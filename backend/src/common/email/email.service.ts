import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  SKIPPED = 'SKIPPED',
  FAILED = 'FAILED',
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  status: EmailStatus;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<string>('EMAIL_ENABLED', 'false') === 'true';

    if (this.enabled) {
      const host = this.configService.get<string>('SMTP_HOST');
      const port = this.configService.get<number>('SMTP_PORT', 587);
      const user = this.configService.get<string>('SMTP_USER');
      const pass = this.configService.get<string>('SMTP_PASS');

      if (host && user && pass) {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });
        this.logger.log(`📧 EmailService inicializado (host: ${host})`);
      } else {
        this.logger.warn('⚠️ EMAIL_ENABLED=true mas SMTP_HOST/USER/PASS não configurados — emails serão SKIPPED');
      }
    } else {
      this.logger.log('📧 EmailService desabilitado (EMAIL_ENABLED=false)');
    }
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    if (!this.enabled || !this.transporter) {
      this.logger.log(`📧 Email SKIPPED (desabilitado): ${options.subject} → ${options.to}`);
      return { status: EmailStatus.SKIPPED };
    }

    try {
      const from = this.configService.get<string>('SMTP_FROM', 'Pub System <noreply@pubsystem.com.br>');

      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`✅ Email enviado: ${options.subject} → ${options.to} (${info.messageId})`);
      return { status: EmailStatus.SENT, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`❌ Falha ao enviar email: ${options.subject} → ${options.to}: ${error.message}`, error.stack);
      return { status: EmailStatus.FAILED, error: error.message };
    }
  }

  async sendWelcomeEmail(params: {
    to: string;
    nomeEstabelecimento: string;
    slug: string;
    nomeAdmin: string;
    passwordSetupUrl?: string;
  }): Promise<SendEmailResult> {
    const loginUrl = `https://${params.slug}.pubsystem.com.br`;
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://pubsystem.com.br');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #f59e0b; margin: 0;">🍺 Pub System</h1>
    </div>
    
    <h2 style="color: #1f2937;">Bem-vindo ao Pub System, ${params.nomeAdmin}!</h2>
    
    <p style="color: #4b5563; line-height: 1.6;">
      Seu estabelecimento <strong>${params.nomeEstabelecimento}</strong> foi criado com sucesso!
    </p>
    
    <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;">
        <strong>🔗 Sua URL de acesso:</strong><br>
        <a href="${loginUrl}" style="color: #d97706; font-size: 18px;">${loginUrl}</a>
      </p>
    </div>
    
    ${params.passwordSetupUrl ? `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${params.passwordSetupUrl}" style="display: inline-block; background: #f59e0b; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
        Definir Minha Senha
      </a>
      <p style="color: #6b7280; font-size: 12px; margin-top: 8px;">
        Este link expira em 24 horas.
      </p>
    </div>
    ` : ''}
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
      <p style="color: #6b7280; font-size: 14px;">
        <strong>Próximos passos:</strong>
      </p>
      <ol style="color: #4b5563; font-size: 14px; line-height: 1.8;">
        <li>Acesse o painel administrativo</li>
        <li>Configure seu cardápio e ambientes</li>
        <li>Cadastre seus funcionários</li>
        <li>Comece a atender!</li>
      </ol>
    </div>
    
    <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px;">
        ${params.nomeEstabelecimento} · Powered by <a href="${frontendUrl}" style="color: #f59e0b;">Pub System</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    const text = `Bem-vindo ao Pub System, ${params.nomeAdmin}!\n\nSeu estabelecimento "${params.nomeEstabelecimento}" foi criado com sucesso.\n\nURL de acesso: ${loginUrl}\n${params.passwordSetupUrl ? `\nDefina sua senha: ${params.passwordSetupUrl}\n` : ''}\nEquipe Pub System`;

    return this.send({
      to: params.to,
      subject: `🍺 Bem-vindo ao Pub System — ${params.nomeEstabelecimento}`,
      html,
      text,
    });
  }

  async sendPasswordResetEmail(params: {
    to: string;
    nomeUsuario: string;
    resetUrl: string;
  }): Promise<SendEmailResult> {
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #f59e0b; margin: 0;">🍺 Pub System</h1>
    </div>
    
    <h2 style="color: #1f2937;">Definição de Senha</h2>
    
    <p style="color: #4b5563; line-height: 1.6;">
      Olá <strong>${params.nomeUsuario}</strong>, clique no botão abaixo para definir sua senha:
    </p>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="${params.resetUrl}" style="display: inline-block; background: #f59e0b; color: #000; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
        Definir Senha
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 12px;">
      Se você não solicitou este email, pode ignorá-lo com segurança.<br>
      Este link expira em 24 horas.
    </p>
    
    <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px;">
        Powered by <a href="https://pubsystem.com.br" style="color: #f59e0b;">Pub System</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    const text = `Olá ${params.nomeUsuario},\n\nClique no link abaixo para definir sua senha:\n${params.resetUrl}\n\nEste link expira em 24 horas.\n\nEquipe Pub System`;

    return this.send({
      to: params.to,
      subject: '🔐 Definição de Senha — Pub System',
      html,
      text,
    });
  }

  isEnabled(): boolean {
    return this.enabled && !!this.transporter;
  }
}
