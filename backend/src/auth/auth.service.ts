import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FuncionarioService } from 'src/modulos/funcionario/funcionario.service';
import { RefreshTokenService } from './refresh-token.service';
import { AuditService } from '../modulos/audit/audit.service';
import { AuditAction } from '../modulos/audit/entities/audit-log.entity';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import * as bcrypt from 'bcrypt';

/**
 * AuthService - Serviço de autenticação
 * 
 * Multi-tenancy: O refresh token é vinculado ao tenant da sessão,
 * impedindo uso cross-tenant de tokens.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private funcionarioService: FuncionarioService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private auditService: AuditService,
    @Optional() private tenantContext?: TenantContextService,
  ) {}

  async validateUser(email: string, pass: string, ipAddress?: string): Promise<any> {
    const user = await this.funcionarioService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.senha))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { senha, ...result } = user;
      this.logger.log(` Autenticação bem-sucedida: ${email} (${user.cargo})`);
      return result;
    }
    this.logger.warn(
      ` Falha na autenticação: Email ${email} - Credenciais inválidas`,
    );
    
    // Registrar tentativa de login falhada
    if (ipAddress) {
      await this.auditService.log({
        funcionarioEmail: email,
        action: AuditAction.LOGIN_FAILED,
        entityName: 'Auth',
        ipAddress,
        description: `Tentativa de login falhada para ${email}`,
      });
    }
    
    return null;
  }

  async login(user: any, ipAddress: string, userAgent?: string, tenantId?: string) {
    // Capturar tenantId do contexto ou do parâmetro
    // Usar try-catch porque getTenantId() lança erro se não houver tenant
    let contextTenantId: string | null = null;
    try {
      contextTenantId = this.tenantContext?.getTenantId?.() ?? null;
    } catch {
      // Ignorar erro - tenant não definido é válido para login
    }
    const effectiveTenantId = tenantId || contextTenantId || user.empresaId || user.tenantId;

    const payload = {
      id: user.id,
      sub: user.id, // Mantém sub para compatibilidade
      email: user.email,
      nome: user.nome,
      cargo: user.cargo,
      role: user.cargo, // Alias para compatibilidade
      empresaId: user.empresaId,
      ambienteId: user.ambienteId,
      tenantId: effectiveTenantId, // Incluir tenantId no JWT
    };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    const refreshToken = await this.refreshTokenService.generateRefreshToken(
      user,
      ipAddress,
      userAgent,
      effectiveTenantId, // Vincular refresh token ao tenant
    );

    this.logger.log(
      `🔑 Access token e refresh token gerados para: ${user.email} (ID: ${user.id})` +
      `${effectiveTenantId ? ` [tenant: ${effectiveTenantId}]` : ''}`,
    );

    // Registrar login bem-sucedido
    await this.auditService.log({
      funcionario: user,
      funcionarioEmail: user.email,
      action: AuditAction.LOGIN,
      entityName: 'Auth',
      ipAddress,
      userAgent,
      description: `Login bem-sucedido${effectiveTenantId ? ` [tenant: ${effectiveTenantId}]` : ''}`,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken.token,
      expires_in: 3600,
      tenant_id: effectiveTenantId,
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
