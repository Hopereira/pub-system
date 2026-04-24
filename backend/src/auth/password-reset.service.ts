import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PasswordReset, PasswordResetType } from './entities/password-reset.entity';
import { Funcionario } from '../modulos/funcionario/entities/funcionario.entity';
import { EmailService } from '../common/email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    @InjectRepository(Funcionario)
    private readonly funcionarioRepository: Repository<Funcionario>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async createToken(
    funcionarioId: string,
    type: PasswordResetType = PasswordResetType.RESET,
  ): Promise<{ token: string; url: string }> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.passwordResetRepository
      .createQueryBuilder()
      .update(PasswordReset)
      .set({ usedAt: new Date() })
      .where('funcionario_id = :funcionarioId AND used_at IS NULL', { funcionarioId })
      .execute();

    const reset = this.passwordResetRepository.create({
      funcionarioId,
      token,
      type,
      expiresAt,
    });
    await this.passwordResetRepository.save(reset);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://pubsystem.com.br');
    const url = `${frontendUrl}/definir-senha?token=${token}`;

    this.logger.log(`🔐 Token de ${type} criado para funcionário ${funcionarioId}`);
    return { token, url };
  }

  async validateToken(token: string): Promise<{ valid: boolean; funcionarioId?: string; type?: string; error?: string }> {
    const reset = await this.passwordResetRepository.findOne({
      where: { token },
    });

    if (!reset) {
      return { valid: false, error: 'Token não encontrado' };
    }
    if (reset.isUsed()) {
      return { valid: false, error: 'Token já foi utilizado' };
    }
    if (reset.isExpired()) {
      return { valid: false, error: 'Token expirado' };
    }

    return { valid: true, funcionarioId: reset.funcionarioId, type: reset.type };
  }

  async resetPassword(token: string, novaSenha: string): Promise<{ success: boolean }> {
    const validation = await this.validateToken(token);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    const funcionario = await this.funcionarioRepository.findOne({
      where: { id: validation.funcionarioId },
    });
    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    funcionario.senha = senhaHash;
    await this.funcionarioRepository.save(funcionario);

    const reset = await this.passwordResetRepository.findOne({ where: { token } });
    reset.usedAt = new Date();
    await this.passwordResetRepository.save(reset);

    this.logger.log(`✅ Senha definida com sucesso para funcionário ${funcionario.id} (${funcionario.email})`);
    return { success: true };
  }

  async sendResetEmail(funcionarioId: string, type: PasswordResetType = PasswordResetType.RESET): Promise<{ url: string; emailSent: boolean }> {
    const funcionario = await this.funcionarioRepository.findOne({
      where: { id: funcionarioId },
    });
    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    const { token, url } = await this.createToken(funcionarioId, type);

    const emailResult = await this.emailService.sendPasswordResetEmail({
      to: funcionario.email,
      nomeUsuario: funcionario.nome,
      resetUrl: url,
    });

    return { url, emailSent: emailResult.status === 'SENT' };
  }

  async createSetupTokenForAdmin(funcionarioId: string): Promise<{ token: string; url: string }> {
    return this.createToken(funcionarioId, PasswordResetType.SETUP);
  }
}
