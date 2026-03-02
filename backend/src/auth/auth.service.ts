import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FuncionarioService } from 'src/modulos/funcionario/funcionario.service';
import { RefreshTokenService } from './refresh-token.service';
import { AuditService } from '../modulos/audit/audit.service';
import { AuditAction } from '../modulos/audit/entities/audit-log.entity';
import { TenantResolverService } from '../common/tenant/tenant-resolver.service';
import * as bcrypt from 'bcrypt';

/**
 * AuthService - Serviço de autenticação com isolamento multi-tenant forte
 * 
 * O tenant é resolvido OBRIGATORIAMENTE pelo subdomain/header ANTES do login.
 * A query de busca do usuário usa email + tenant_id (nunca apenas email).
 * O JWT contém tenantId obrigatório (sem fallbacks ou ambiguidades).
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private funcionarioService: FuncionarioService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private auditService: AuditService,
    private tenantResolver: TenantResolverService,
  ) {}

  /**
   * Resolve o tenantId a partir do hostname (subdomain), header x-tenant-id ou x-tenant-slug.
   * OBRIGATÓRIO - falha se não conseguir resolver.
   */
  async resolveTenantFromRequest(host?: string, headerTenantId?: string, headerTenantSlug?: string): Promise<string> {
    // 1. Tentar header x-tenant-id (ID direto)
    if (headerTenantId) {
      const tenant = await this.tenantResolver.resolveById(headerTenantId);
      if (tenant) return tenant.id;
    }

    // 2. Tentar header x-tenant-slug (slug enviado pelo frontend)
    if (headerTenantSlug) {
      const tenant = await this.tenantResolver.resolveBySlug(headerTenantSlug);
      if (tenant) return tenant.id;
    }

    // 3. Tentar subdomain do hostname
    if (host) {
      const slug = this.tenantResolver.extractSlugFromHostname(host);
      if (slug) {
        const tenant = await this.tenantResolver.resolveBySlug(slug);
        if (tenant) return tenant.id;
      }
    }

    throw new UnauthorizedException(
      'Não foi possível identificar o estabelecimento. Acesse pelo endereço correto.',
    );
  }

  /**
   * Valida credenciais do usuário DENTRO do tenant específico.
   * Busca por email + tenant_id (nunca apenas email).
   */
  async validateUser(
    email: string,
    pass: string,
    tenantId: string,
    ipAddress?: string,
  ): Promise<any> {
    const user = await this.funcionarioService.findByEmailAndTenant(email, tenantId);
    if (user && (await bcrypt.compare(pass, user.senha))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { senha, ...result } = user;
      this.logger.log(`Autenticação bem-sucedida: ${email} (${user.cargo}) [tenant: ${tenantId}]`);
      return result;
    }
    this.logger.warn(
      `Falha na autenticação: Email ${email} [tenant: ${tenantId}] - Credenciais inválidas`,
    );

    // Registrar tentativa de login falhada
    if (ipAddress) {
      await this.auditService.log({
        funcionarioEmail: email,
        action: AuditAction.LOGIN_FAILED,
        entityName: 'Auth',
        ipAddress,
        tenantId,
        description: `Tentativa de login falhada para ${email} [tenant: ${tenantId}]`,
      });
    }

    return null;
  }

  /**
   * Gera JWT e refresh token para o usuário autenticado.
   * tenantId é OBRIGATÓRIO e vem do subdomain (já validado).
   */
  async login(user: any, tenantId: string, ipAddress: string, userAgent?: string) {
    const payload = {
      id: user.id,
      sub: user.id,
      email: user.email,
      nome: user.nome,
      cargo: user.cargo,
      role: user.cargo,
      ambienteId: user.ambienteId,
      tenantId, // OBRIGATÓRIO - sem fallback
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    const refreshToken = await this.refreshTokenService.generateRefreshToken(
      user,
      ipAddress,
      userAgent,
      tenantId,
    );

    this.logger.log(
      `🔑 Tokens gerados: ${user.email} (ID: ${user.id}) [tenant: ${tenantId}]`,
    );

    // Registrar login bem-sucedido
    await this.auditService.log({
      funcionario: user,
      funcionarioEmail: user.email,
      action: AuditAction.LOGIN,
      entityName: 'Auth',
      ipAddress,
      userAgent,
      tenantId,
      description: `Login bem-sucedido [tenant: ${tenantId}]`,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken.token,
      expires_in: 3600,
      tenant_id: tenantId,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
      },
    };
  }

  async logout(refreshToken: string, ipAddress: string, user?: any): Promise<void> {
    await this.refreshTokenService.revokeTokenByString(
      refreshToken,
      ipAddress,
      'Logout',
    );
    
    // Registrar logout
    if (user) {
      await this.auditService.log({
        funcionario: user,
        funcionarioEmail: user.email,
        action: AuditAction.LOGOUT,
        entityName: 'Auth',
        ipAddress,
        description: `Logout realizado`,
      });
    }
    
    this.logger.log(`🚪 Logout realizado`);
  }

  async logoutAll(funcionarioId: string, ipAddress: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(funcionarioId, ipAddress);
    this.logger.log(`🚪 Logout de todas as sessões realizado`);
  }
}
