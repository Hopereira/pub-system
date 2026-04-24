import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService, EmailStatus } from '../email.service';

describe('EmailService', () => {
  let service: EmailService;

  describe('quando EMAIL_ENABLED=false', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: (key: string, defaultValue?: any) => {
                const config: Record<string, any> = {
                  EMAIL_ENABLED: 'false',
                };
                return config[key] ?? defaultValue;
              },
            },
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    it('deve retornar SKIPPED ao tentar enviar email', async () => {
      const result = await service.send({
        to: 'test@test.com',
        subject: 'Test',
        html: '<p>test</p>',
      });
      expect(result.status).toBe(EmailStatus.SKIPPED);
    });

    it('deve retornar SKIPPED para welcome email', async () => {
      const result = await service.sendWelcomeEmail({
        to: 'test@test.com',
        nomeEstabelecimento: 'Bar Test',
        slug: 'bar-test',
        nomeAdmin: 'Admin',
      });
      expect(result.status).toBe(EmailStatus.SKIPPED);
    });

    it('deve retornar SKIPPED para password reset email', async () => {
      const result = await service.sendPasswordResetEmail({
        to: 'test@test.com',
        nomeUsuario: 'Admin',
        resetUrl: 'http://localhost/definir-senha?token=abc',
      });
      expect(result.status).toBe(EmailStatus.SKIPPED);
    });

    it('isEnabled deve retornar false', () => {
      expect(service.isEnabled()).toBe(false);
    });
  });

  describe('quando EMAIL_ENABLED=true mas sem SMTP config', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmailService,
          {
            provide: ConfigService,
            useValue: {
              get: (key: string, defaultValue?: any) => {
                const config: Record<string, any> = {
                  EMAIL_ENABLED: 'true',
                };
                return config[key] ?? defaultValue;
              },
            },
          },
        ],
      }).compile();

      service = module.get<EmailService>(EmailService);
    });

    it('deve retornar SKIPPED sem SMTP configurado', async () => {
      const result = await service.send({
        to: 'test@test.com',
        subject: 'Test',
        html: '<p>test</p>',
      });
      expect(result.status).toBe(EmailStatus.SKIPPED);
    });

    it('isEnabled deve retornar false', () => {
      expect(service.isEnabled()).toBe(false);
    });
  });
});
