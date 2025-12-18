import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FuncionarioService } from 'src/modulos/funcionario/funcionario.service';
import { RefreshTokenService } from './refresh-token.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private funcionarioService: FuncionarioService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
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
    return null;
  }

  async login(user: any, ipAddress: string, userAgent?: string) {
    const payload = {
      id: user.id,
      sub: user.id, // Mantém sub para compatibilidade
      email: user.email,
      nome: user.nome,
      cargo: user.cargo,
      role: user.cargo, // Alias para compatibilidade
      empresaId: user.empresaId,
      ambienteId: user.ambienteId,
    };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    const refreshToken = await this.refreshTokenService.generateRefreshToken(
      user,
      ipAddress,
      userAgent,
    );

    this.logger.log(
      `🔑 Access token e refresh token gerados para: ${user.email} (ID: ${user.id})`,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken.token,
      expires_in: 3600,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        cargo: user.cargo,
      },
    };
  }

  async logout(refreshToken: string, ipAddress: string): Promise<void> {
    await this.refreshTokenService.revokeTokenByString(
      refreshToken,
      ipAddress,
      'Logout',
    );
    this.logger.log(`🚪 Logout realizado`);
  }

  async logoutAll(funcionarioId: string, ipAddress: string): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(funcionarioId, ipAddress);
    this.logger.log(`🚪 Logout de todas as sessões realizado`);
  }
}
