import { Controller, Post, Get, Body, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { IsString, MinLength, IsEmail } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordResetService } from './password-reset.service';
import { SkipTenantGuard } from '../common/tenant/guards/tenant.guard';
import { Public } from './decorators/public.decorator';
import { Funcionario } from '../modulos/funcionario/entities/funcionario.entity';
import { EmailService } from '../common/email/email.service';
import { PasswordResetType } from './entities/password-reset.entity';

class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  novaSenha: string;
}

class RequestResetDto {
  @IsEmail()
  email: string;
}

@ApiTags('Senha')
@Controller('senha')
@Public()
@SkipTenantGuard()
export class PasswordResetController {
  private readonly logger = new Logger(PasswordResetController.name);

  constructor(
    private readonly passwordResetService: PasswordResetService,
    @InjectRepository(Funcionario)
    private readonly funcionarioRepository: Repository<Funcionario>,
    private readonly emailService: EmailService,
  ) {}

  @Get('validar-token')
  @ApiOperation({ summary: 'Valida um token de reset/setup de senha' })
  @ApiQuery({ name: 'token', required: true })
  @ApiResponse({ status: 200, description: 'Resultado da validação' })
  async validateToken(@Query('token') token: string) {
    const result = await this.passwordResetService.validateToken(token);
    return { valid: result.valid, type: result.type, error: result.error };
  }

  @Post('definir')
  @ApiOperation({ summary: 'Define uma nova senha usando token' })
  @ApiResponse({ status: 200, description: 'Senha definida com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto.token, dto.novaSenha);
  }

  @Post('recuperar')
  @ApiOperation({ summary: 'Solicita recuperação de senha por email' })
  @ApiResponse({ status: 200, description: 'Se o email existir, um link foi enviado' })
  async requestReset(@Body() dto: RequestResetDto) {
    const funcionario = await this.funcionarioRepository.findOne({
      where: { email: dto.email },
    });

    if (!funcionario) {
      this.logger.warn(`⚠️ Tentativa de reset para email não cadastrado: ${dto.email}`);
      return { message: 'Se o email estiver cadastrado, você receberá um link para redefinir a senha.' };
    }

    const { url, emailSent } = await this.passwordResetService.sendResetEmail(
      funcionario.id,
      PasswordResetType.RESET,
    );

    this.logger.log(`🔐 Reset de senha solicitado: ${dto.email} (emailSent: ${emailSent})`);

    return {
      message: 'Se o email estiver cadastrado, você receberá um link para redefinir a senha.',
      ...(process.env.NODE_ENV !== 'production' ? { resetUrl: url } : {}),
    };
  }
}
