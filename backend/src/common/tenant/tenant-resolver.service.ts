import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from '../../modulos/empresa/entities/empresa.entity';
import { Tenant } from './entities/tenant.entity';
import { TenantId, createTenantId } from './tenant.types';

/**
 * Informações do tenant resolvido
 */
export interface ResolvedTenant {
  id: TenantId;
  slug: string;
  nomeFantasia: string;
  ativo: boolean;
}

/**
 * Fonte de onde o tenant foi identificado
 */
export type TenantSource = 'subdomain' | 'slug' | 'jwt' | 'header';

/**
 * TenantResolverService - Resolve identificadores de tenant para IDs
 * 
 * Responsável por:
 * - Buscar tenant por slug (URL ou subdomínio)
 * - Buscar tenant por ID (JWT)
 * - Validar se o tenant está ativo
 * - Cache de tenants para performance
 */
@Injectable()
export class TenantResolverService {
  private readonly logger = new Logger(TenantResolverService.name);
  
  // Cache simples em memória (em produção, usar Redis)
  private readonly cache = new Map<string, { tenant: ResolvedTenant; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Resolve um tenant pelo slug (subdomínio ou URL)
   * 
   * @param slug - Identificador do tenant (ex: "bar-do-ze")
   * @returns Informações do tenant
   * @throws NotFoundException se tenant não encontrado ou inativo
   */
  async resolveBySlug(slug: string): Promise<ResolvedTenant> {
    const normalizedSlug = this.normalizeSlug(slug);
    
    // Verificar cache
    const cached = this.getFromCache(`slug:${normalizedSlug}`);
    if (cached) {
      this.logger.debug(`🎯 Tenant cache HIT: ${normalizedSlug}`);
      return cached;
    }

    this.logger.debug(`🔍 Buscando tenant por slug: ${normalizedSlug}`);

    let empresa = await this.empresaRepository.findOne({
      where: { slug: normalizedSlug },
      select: ['id', 'slug', 'nomeFantasia', 'ativo'],
    });

    // Se não encontrou, tentar remover sufixo numérico (ex: casarao-pub-423 -> casarao-pub)
    if (!empresa) {
      const slugWithoutSuffix = normalizedSlug.replace(/-\d+$/, '');
      if (slugWithoutSuffix !== normalizedSlug) {
        this.logger.debug(`🔍 Tentando slug sem sufixo numérico: ${slugWithoutSuffix}`);
        empresa = await this.empresaRepository.findOne({
          where: { slug: slugWithoutSuffix },
          select: ['id', 'slug', 'nomeFantasia', 'ativo'],
        });
      }
    }

    if (!empresa) {
      this.logger.warn(`❌ Tenant não encontrado: ${normalizedSlug}`);
      throw new NotFoundException(
        `Estabelecimento não encontrado: ${normalizedSlug}`
      );
    }

    if (!empresa.ativo) {
      this.logger.warn(`🚫 Tenant inativo: ${normalizedSlug}`);
      throw new NotFoundException(
        `Estabelecimento não disponível: ${normalizedSlug}`
      );
    }

    const resolved: ResolvedTenant = {
      id: createTenantId(empresa.id),
      slug: empresa.slug,
      nomeFantasia: empresa.nomeFantasia,
      ativo: empresa.ativo,
    };

    // Salvar no cache
    this.setCache(`slug:${normalizedSlug}`, resolved);
    this.setCache(`id:${empresa.id}`, resolved);

    this.logger.log(`✅ Tenant resolvido: ${resolved.nomeFantasia} (${resolved.id})`);
    return resolved;
  }

  /**
   * Resolve um tenant pelo ID (do JWT)
   * 
   * @param id - UUID do tenant
   * @returns Informações do tenant
   * @throws ForbiddenException se tenant não encontrado ou inativo
   */
  async resolveById(id: string): Promise<ResolvedTenant> {
    // Validar formato UUID antes de fazer query (evita erro PostgreSQL)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      this.logger.warn(`⚠️ resolveById chamado com valor não-UUID: ${id}, tentando como slug`);
      return this.resolveBySlug(id);
    }

    // Verificar cache
    const cached = this.getFromCache(`id:${id}`);
    if (cached) {
      this.logger.debug(`🎯 Tenant cache HIT: ${id}`);
      return cached;
    }

    this.logger.debug(`🔍 Buscando tenant por id: ${id}`);

    // 1. Primeiro tentar buscar na tabela tenants (fonte primária)
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      select: ['id', 'slug', 'nome', 'status'],
    });

    if (tenant) {
      this.logger.log(`✅ Tenant encontrado na tabela tenants: ${tenant.nome}`);
      
      const resolved: ResolvedTenant = {
        id: createTenantId(tenant.id),
        slug: tenant.slug,
        nomeFantasia: tenant.nome,
        ativo: tenant.status === 'ATIVO' || tenant.status === 'TRIAL',
      };

      this.setCache(`id:${id}`, resolved);
      if (tenant.slug) {
        this.setCache(`slug:${tenant.slug}`, resolved);
      }

      return resolved;
    }

    // 2. Fallback: buscar empresa pelo tenant_id
    this.logger.debug(`🔍 Buscando empresa por tenant_id: ${id}`);
    const empresa = await this.empresaRepository.findOne({
      where: { tenantId: id },
      select: ['id', 'slug', 'nomeFantasia', 'ativo', 'tenantId'],
    });

    if (empresa) {
      const resolved: ResolvedTenant = {
        id: createTenantId(empresa.tenantId || id),
        slug: empresa.slug,
        nomeFantasia: empresa.nomeFantasia,
        ativo: empresa.ativo,
      };

      this.setCache(`id:${id}`, resolved);
      if (empresa.slug) {
        this.setCache(`slug:${empresa.slug}`, resolved);
      }

      return resolved;
    }

    // 3. Fallback: tentar buscar pelo id da empresa (compatibilidade legada)
    const empresaById = await this.empresaRepository.findOne({
      where: { id },
      select: ['id', 'slug', 'nomeFantasia', 'ativo', 'tenantId'],
    });
    
    if (empresaById) {
      const resolved: ResolvedTenant = {
        id: createTenantId(empresaById.tenantId || empresaById.id),
        slug: empresaById.slug,
        nomeFantasia: empresaById.nomeFantasia,
        ativo: empresaById.ativo,
      };

      this.setCache(`id:${id}`, resolved);
      if (empresaById.slug) {
        this.setCache(`slug:${empresaById.slug}`, resolved);
      }

      return resolved;
    }

    // Nenhum tenant encontrado
    this.logger.warn(`❌ Tenant não encontrado: ${id}`);
    throw new ForbiddenException(`Tenant não encontrado`);
  }

  /**
   * Extrai o slug do hostname (subdomínio)
   * 
   * @example
   * "bar-do-ze.pubsystem.com.br" -> "bar-do-ze"
   * "pubsystem.com.br" -> null
   * "localhost:3000" -> null
   */
  extractSlugFromHostname(hostname: string): string | null {
    // Remover porta se existir
    const host = hostname.split(':')[0];

    // Padrões de domínio principal (não são tenants)
    const mainDomains = [
      'pubsystem.com.br',
      'pubsystem.com',
      'localhost',
      '127.0.0.1',
    ];

    // Verificar se é domínio principal
    if (mainDomains.some(domain => host === domain || host.endsWith(`.${domain}`))) {
      // Extrair subdomínio
      for (const domain of mainDomains) {
        if (host.endsWith(`.${domain}`)) {
          const subdomain = host.replace(`.${domain}`, '');
          // Ignorar subdomínios especiais
          if (['www', 'api', 'admin', 'app'].includes(subdomain)) {
            return null;
          }
          return subdomain;
        }
      }
    }

    return null;
  }

  /**
   * Extrai o slug de uma URL path
   * 
   * @example
   * "/menu/bar-do-ze" -> "bar-do-ze"
   * "/menu/bar-do-ze/produtos" -> "bar-do-ze"
   * "/dashboard" -> null
   */
  extractSlugFromPath(path: string, patterns: string[] = ['/menu/', '/evento/', '/comanda/']): string | null {
    for (const pattern of patterns) {
      if (path.startsWith(pattern)) {
        const remaining = path.substring(pattern.length);
        const slug = remaining.split('/')[0];
        if (slug && slug.length > 0) {
          return slug;
        }
      }
    }
    return null;
  }

  /**
   * Normaliza o slug para busca
   */
  private normalizeSlug(slug: string): string {
    return slug.toLowerCase().trim();
  }

  /**
   * Obtém item do cache se não expirado
   */
  private getFromCache(key: string): ResolvedTenant | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tenant;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  /**
   * Salva item no cache
   */
  private setCache(key: string, tenant: ResolvedTenant): void {
    this.cache.set(key, {
      tenant,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });
  }

  /**
   * Limpa o cache (útil para testes)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalida cache de um tenant específico
   */
  invalidateCache(tenantId: string, slug?: string): void {
    this.cache.delete(`id:${tenantId}`);
    if (slug) {
      this.cache.delete(`slug:${slug}`);
    }
  }
}
