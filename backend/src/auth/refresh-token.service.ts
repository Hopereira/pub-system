import {
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from './entities/refresh-token.entity';
import { Funcionario } from '../modulos/funcionario/entities/funcionario.entity';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Gera um novo refresh token
   */
  async generateRefreshToken(
    funcionario: Funcionario,
    ipAddress: string,
    userAgent?: string,
  ): Promise<RefreshToken> {
    const token = crypto.randomBytes(64).toString('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshToken = this.refreshTokenRepository.create({
      token,
      funcionario,
      ipAddress,
      userAgent,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);

    this.logger.log(
      `🔑 Refresh token gerado para usuário ${funcionario.email}`,
    );

    return refreshToken;
  }

  /**
   * Valida e retorna um refresh token
   */
  async validateRefreshToken(token: string): Promise<RefreshToken> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
      relations: ['funcionario'],
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (!refreshToken.isActive) {
      throw new UnauthorizedException('Refresh token expirado ou revogado');
    }

    return refreshToken;
  }

  /**
   * Renova o access token usando refresh token
   */
  async refreshAccessToken(
    token: string,
    ipAddress: string,
  ): Promise<{ accessToken: string; refreshToken?: string }> {
    const refreshToken = await this.validateRefreshToken(token);

    const payload = {
      sub: refreshToken.funcionario.id,
      email: refreshToken.funcionario.email,
      cargo: refreshToken.funcionario.cargo,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });

    const rotateRefreshToken = this.configService.get(
      'ROTATE_REFRESH_TOKEN',
      'true',
    );

    if (rotateRefreshToken === 'true') {
      await this.revokeToken(refreshToken, ipAddress, 'Rotacionado');

      const newRefreshToken = await this.generateRefreshToken(
        refreshToken.funcionario,
        ipAddress,
        refreshToken.userAgent,
      );

      refreshToken.replacedByToken = newRefreshToken.id;
      await this.refreshTokenRepository.save(refreshToken);

      this.logger.log(
        `🔄 Access token renovado e refresh token rotacionado para ${refreshToken.funcionario.email}`,
      );

      return {
        accessToken,
        refreshToken: newRefreshToken.token,
      };
    }

    this.logger.log(
      `🔄 Access token renovado para ${refreshToken.funcionario.email}`,
    );

    return { accessToken };
  }

  /**
   * Revoga um refresh token
   */
  async revokeToken(
    refreshToken: RefreshToken,
    ipAddress: string,
    reason?: string,
  ): Promise<void> {
    refreshToken.revoked = true;
    refreshToken.revokedAt = new Date();
    refreshToken.revokedByIp = ipAddress;

    await this.refreshTokenRepository.save(refreshToken);

    this.logger.log(
      `🗑️ Refresh token revogado para ${refreshToken.funcionario.email}. Motivo: ${reason || 'Não especificado'}`,
    );
  }

  /**
   * Revoga um refresh token por token string
   */
  async revokeTokenByString(
    token: string,
    ipAddress: string,
    reason?: string,
  ): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
      relations: ['funcionario'],
    });

    if (!refreshToken) {
      throw new NotFoundException('Refresh token não encontrado');
    }

    await this.revokeToken(refreshToken, ipAddress, reason);
  }

  /**
   * Revoga todos os refresh tokens de um usuário
   */
  async revokeAllUserTokens(
    funcionarioId: string,
    ipAddress: string,
  ): Promise<void> {
    const tokens = await this.refreshTokenRepository.find({
      where: {
        funcionario: { id: funcionarioId },
        revoked: false,
      },
      relations: ['funcionario'],
    });

    for (const token of tokens) {
      await this.revokeToken(token, ipAddress, 'Logout de todas as sessões');
    }

    this.logger.log(
      `🗑️ Todos os refresh tokens revogados para usuário ${funcionarioId}. Total: ${tokens.length}`,
    );
  }

  /**
   * Remove refresh tokens expirados (executar periodicamente)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    const count = result.affected || 0;
    
    if (count > 0) {
      this.logger.log(`🧹 ${count} refresh tokens expirados removidos`);
    }

    return count;
  }

  /**
   * Lista sessões ativas de um usuário
   */
  async getUserActiveSessions(funcionarioId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: {
        funcionario: { id: funcionarioId },
        revoked: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Revoga uma sessão específica por ID
   */
  async revokeSessionById(
    sessionId: string,
    funcionarioId: string,
    ipAddress: string,
  ): Promise<void> {
    const session = await this.refreshTokenRepository.findOne({
      where: { id: sessionId },
      relations: ['funcionario'],
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    if (session.funcionario.id !== funcionarioId) {
      throw new UnauthorizedException('Sessão não pertence ao usuário');
    }

    await this.revokeToken(session, ipAddress, 'Revogado pelo usuário');
  }
}
