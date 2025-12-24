import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TenantContextService } from '../tenant-context.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantPlano } from '../entities/tenant.entity';

/**
 * Configuração de limites por plano
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number; // Máximo de requisições em 1 segundo
}

/**
 * Limites padrão por plano
 */
export const RATE_LIMITS: Record<TenantPlano | string, RateLimitConfig> = {
  [TenantPlano.FREE]: {
    requestsPerMinute: 20,
    requestsPerHour: 500,
    burstLimit: 5,
  },
  [TenantPlano.BASIC]: {
    requestsPerMinute: 60,
    requestsPerHour: 2000,
    burstLimit: 15,
  },
  [TenantPlano.PRO]: {
    requestsPerMinute: 100,
    requestsPerHour: 5000,
    burstLimit: 30,
  },
  [TenantPlano.ENTERPRISE]: {
    requestsPerMinute: 500,
    requestsPerHour: 20000,
    burstLimit: 100,
  },
  // Fallback para tenants sem plano definido
  default: {
    requestsPerMinute: 30,
    requestsPerHour: 1000,
    burstLimit: 10,
  },
};

/**
 * Decorator para pular rate limiting em rotas específicas
 */
export const SKIP_RATE_LIMIT = 'skipRateLimit';
import { SetMetadata } from '@nestjs/common';
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT, true);

/**
 * TenantRateLimitGuard - Rate Limiting por Tenant
 * 
 * Implementa limites de requisições baseados no plano do tenant:
 * - FREE: 20 req/min, 500 req/hora
 * - BASIC: 60 req/min, 2000 req/hora
 * - PRO: 100 req/min, 5000 req/hora
 * - ENTERPRISE: 500 req/min, 20000 req/hora
 * 
 * Usa Redis para armazenar contadores de requisições.
 * Retorna headers X-RateLimit-* para informar o cliente.
 */
@Injectable()
export class TenantRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(TenantRateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly tenantContext: TenantContextService,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar se deve pular rate limiting
    // Proteção contra reflector undefined (pode ocorrer em alguns contextos)
    const skipRateLimit = this.reflector?.getAllAndOverride<boolean>(
      SKIP_RATE_LIMIT,
      [context.getHandler(), context.getClass()],
    ) ?? false;

    if (skipRateLimit) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Obter tenantId do contexto (com proteção contra undefined)
    const tenantId = this.tenantContext?.getTenantId?.() ?? null;

    if (!tenantId) {
      // Sem tenant, aplicar limite global por IP
      return this.checkIpRateLimit(request, response);
    }

    // Obter plano do tenant
    const tenant = await this.getTenantWithCache(tenantId);
    const plano = tenant?.plano || 'default';
    const limits = RATE_LIMITS[plano] || RATE_LIMITS.default;

    // Verificar limites
    const now = Date.now();
    const minuteKey = `ratelimit:${tenantId}:minute:${Math.floor(now / 60000)}`;
    const hourKey = `ratelimit:${tenantId}:hour:${Math.floor(now / 3600000)}`;
    const burstKey = `ratelimit:${tenantId}:burst:${Math.floor(now / 1000)}`;

    // Verificar burst (por segundo)
    const burstCount = await this.incrementCounter(burstKey, 2); // TTL 2 segundos
    if (burstCount > limits.burstLimit) {
      this.setRateLimitHeaders(response, limits, burstCount, 'burst');
      this.logger.warn(
        `🚫 Rate limit BURST excedido para tenant ${tenantId} (${plano}): ${burstCount}/${limits.burstLimit}`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Muitas requisições em um curto período. Aguarde um momento.',
          error: 'Too Many Requests',
          retryAfter: 1,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Verificar limite por minuto
    const minuteCount = await this.incrementCounter(minuteKey, 60);
    if (minuteCount > limits.requestsPerMinute) {
      this.setRateLimitHeaders(response, limits, minuteCount, 'minute');
      this.logger.warn(
        `🚫 Rate limit MINUTO excedido para tenant ${tenantId} (${plano}): ${minuteCount}/${limits.requestsPerMinute}`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Limite de requisições por minuto excedido. Tente novamente em breve.',
          error: 'Too Many Requests',
          retryAfter: 60 - (Math.floor(now / 1000) % 60),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Verificar limite por hora
    const hourCount = await this.incrementCounter(hourKey, 3600);
    if (hourCount > limits.requestsPerHour) {
      this.setRateLimitHeaders(response, limits, hourCount, 'hour');
      this.logger.warn(
        `🚫 Rate limit HORA excedido para tenant ${tenantId} (${plano}): ${hourCount}/${limits.requestsPerHour}`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Limite de requisições por hora excedido. Tente novamente mais tarde.',
          error: 'Too Many Requests',
          retryAfter: 3600 - (Math.floor(now / 1000) % 3600),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Adicionar headers informativos
    this.setRateLimitHeaders(response, limits, minuteCount, 'minute');

    return true;
  }

  /**
   * Rate limit por IP para requisições sem tenant
   */
  private async checkIpRateLimit(request: any, response: any): Promise<boolean> {
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const minuteKey = `ratelimit:ip:${ip}:minute:${Math.floor(now / 60000)}`;

    const limits = RATE_LIMITS.default;
    const count = await this.incrementCounter(minuteKey, 60);

    if (count > limits.requestsPerMinute) {
      this.setRateLimitHeaders(response, limits, count, 'minute');
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Limite de requisições excedido.',
          error: 'Too Many Requests',
          retryAfter: 60,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.setRateLimitHeaders(response, limits, count, 'minute');
    return true;
  }

  /**
   * Incrementa contador no cache
   */
  private async incrementCounter(key: string, ttlSeconds: number): Promise<number> {
    // Proteção contra cacheManager undefined
    if (!this.cacheManager) {
      return 1; // Retorna 1 para não bloquear se cache não estiver disponível
    }
    const current = await this.cacheManager.get<number>(key);
    const newValue = (current || 0) + 1;
    await this.cacheManager.set(key, newValue, ttlSeconds * 1000);
    return newValue;
  }

  /**
   * Obtém tenant com cache
   */
  private async getTenantWithCache(tenantId: string): Promise<Tenant | null> {
    const cacheKey = `tenant:${tenantId}`;
    
    // Proteção contra cacheManager undefined
    if (!this.cacheManager) {
      return this.tenantRepository?.findOne?.({ where: { id: tenantId } }) ?? null;
    }
    
    let tenant = await this.cacheManager.get<Tenant>(cacheKey);

    if (!tenant) {
      tenant = await this.tenantRepository?.findOne?.({
        where: { id: tenantId },
      });
      if (tenant) {
        await this.cacheManager.set(cacheKey, tenant, 300000); // 5 minutos
      }
    }

    return tenant ?? null;
  }

  /**
   * Define headers de rate limit na resposta
   */
  private setRateLimitHeaders(
    response: any,
    limits: RateLimitConfig,
    current: number,
    type: 'burst' | 'minute' | 'hour',
  ): void {
    const limit = type === 'burst' 
      ? limits.burstLimit 
      : type === 'minute' 
        ? limits.requestsPerMinute 
        : limits.requestsPerHour;

    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
    response.setHeader('X-RateLimit-Type', type);
  }
}
