import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PasswordResetService } from '../password-reset.service';
import { PasswordReset, PasswordResetType } from '../entities/password-reset.entity';
import { Funcionario } from '../../modulos/funcionario/entities/funcionario.entity';
import { EmailService, EmailStatus } from '../../common/email/email.service';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let mockPasswordResetRepo: any;
  let mockFuncionarioRepo: any;
  let mockEmailService: any;

  beforeEach(async () => {
    mockPasswordResetRepo = {
      create: jest.fn().mockImplementation((data) => ({ id: 'reset-1', ...data })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      }),
    };

    mockFuncionarioRepo = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    mockEmailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue({ status: EmailStatus.SKIPPED }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: getRepositoryToken(PasswordReset), useValue: mockPasswordResetRepo },
        { provide: getRepositoryToken(Funcionario), useValue: mockFuncionarioRepo },
        { provide: EmailService, useValue: mockEmailService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                FRONTEND_URL: 'http://localhost:3001',
              };
              return config[key] ?? defaultValue;
            },
          },
        },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
  });

  describe('createToken', () => {
    it('deve criar um token válido', async () => {
      const result = await service.createToken('func-1', PasswordResetType.SETUP);
      expect(result.token).toBeDefined();
      expect(result.token.length).toBe(64); // 32 bytes hex
      expect(result.url).toContain('http://localhost:3001/definir-senha?token=');
      expect(mockPasswordResetRepo.save).toHaveBeenCalled();
    });

    it('deve invalidar tokens anteriores ao criar novo', async () => {
      await service.createToken('func-1');
      const qb = mockPasswordResetRepo.createQueryBuilder();
      expect(qb.update).toHaveBeenCalled();
    });
  });

  describe('validateToken', () => {
    it('deve retornar valid=false para token não encontrado', async () => {
      mockPasswordResetRepo.findOne.mockResolvedValue(null);
      const result = await service.validateToken('invalid-token');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token não encontrado');
    });

    it('deve retornar valid=false para token já utilizado', async () => {
      mockPasswordResetRepo.findOne.mockResolvedValue({
        token: 'used-token',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        isUsed: () => true,
        isExpired: () => false,
      });
      const result = await service.validateToken('used-token');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token já foi utilizado');
    });

    it('deve retornar valid=false para token expirado', async () => {
      mockPasswordResetRepo.findOne.mockResolvedValue({
        token: 'expired-token',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        isUsed: () => false,
        isExpired: () => true,
      });
      const result = await service.validateToken('expired-token');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expirado');
    });

    it('deve retornar valid=true para token válido', async () => {
      mockPasswordResetRepo.findOne.mockResolvedValue({
        token: 'valid-token',
        funcionarioId: 'func-1',
        type: PasswordResetType.SETUP,
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        isUsed: () => false,
        isExpired: () => false,
      });
      const result = await service.validateToken('valid-token');
      expect(result.valid).toBe(true);
      expect(result.funcionarioId).toBe('func-1');
      expect(result.type).toBe('SETUP');
    });
  });

  describe('resetPassword', () => {
    it('deve lançar BadRequestException para token inválido', async () => {
      mockPasswordResetRepo.findOne.mockResolvedValue(null);
      await expect(service.resetPassword('bad-token', 'nova-senha')).rejects.toThrow(BadRequestException);
    });

    it('deve lançar NotFoundException se funcionário não existe', async () => {
      mockPasswordResetRepo.findOne.mockResolvedValueOnce({
        token: 'valid',
        funcionarioId: 'func-1',
        type: PasswordResetType.RESET,
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        isUsed: () => false,
        isExpired: () => false,
      });
      mockFuncionarioRepo.findOne.mockResolvedValue(null);
      // Precisa encontrar token novamente no segundo findOne
      mockPasswordResetRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.resetPassword('valid', 'nova-senha')).rejects.toThrow(NotFoundException);
    });

    it('deve definir senha com sucesso', async () => {
      const resetEntity = {
        token: 'valid',
        funcionarioId: 'func-1',
        type: PasswordResetType.RESET,
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        isUsed: () => false,
        isExpired: () => false,
      };

      mockPasswordResetRepo.findOne.mockResolvedValue(resetEntity);
      mockFuncionarioRepo.findOne.mockResolvedValue({
        id: 'func-1',
        email: 'test@test.com',
        nome: 'Admin',
        senha: 'old-hash',
      });

      const result = await service.resetPassword('valid', 'nova-senha-123');
      expect(result.success).toBe(true);
      expect(mockFuncionarioRepo.save).toHaveBeenCalled();
      // Senha deve ter sido hasheada (não ser a original)
      const savedFunc = mockFuncionarioRepo.save.mock.calls[0][0];
      expect(savedFunc.senha).not.toBe('nova-senha-123');
      expect(savedFunc.senha).not.toBe('old-hash');
    });
  });

  describe('sendResetEmail', () => {
    it('deve lançar NotFoundException se funcionário não existe', async () => {
      mockFuncionarioRepo.findOne.mockResolvedValue(null);
      await expect(service.sendResetEmail('func-1')).rejects.toThrow(NotFoundException);
    });

    it('deve criar token e enviar email', async () => {
      mockFuncionarioRepo.findOne.mockResolvedValue({
        id: 'func-1',
        email: 'test@test.com',
        nome: 'Admin',
      });

      const result = await service.sendResetEmail('func-1', PasswordResetType.SETUP);
      expect(result.url).toContain('definir-senha?token=');
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@test.com',
          nomeUsuario: 'Admin',
        }),
      );
    });
  });
});
