import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { FuncionarioService } from './funcionario.service';
import { Funcionario } from './entities/funcionario.entity';
import { Cargo } from './enums/cargo.enum';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('FuncionarioService', () => {
  let service: FuncionarioService;
  let funcionarioRepository: jest.Mocked<Repository<Funcionario>>;
  let configService: jest.Mocked<ConfigService>;

  const mockFuncionarioRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
    findByEmailAndTenantForAuth: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  // Mock data
  const mockFuncionario: Partial<Funcionario> = {
    id: 'func-uuid-1',
    nome: 'João Silva',
    email: 'joao@email.com',
    senha: 'hashedPassword123',
    cargo: Cargo.GARCOM,
  };

  const mockAdmin: Partial<Funcionario> = {
    id: 'admin-uuid-1',
    nome: 'Administrador',
    email: 'admin@email.com',
    senha: 'hashedAdminPassword',
    cargo: Cargo.ADMIN,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FuncionarioService,
        {
          provide: getRepositoryToken(Funcionario),
          useValue: mockFuncionarioRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<FuncionarioService>(FuncionarioService);
    funcionarioRepository = module.get(getRepositoryToken(Funcionario));
    configService = module.get(ConfigService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // TESTES: onModuleInit()
  // ============================================
  describe('onModuleInit', () => {
    it('deve criar admin padrão se não existir funcionários', async () => {
      mockFuncionarioRepository.count.mockResolvedValue(0);
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'ADMIN_SENHA') return 'admin123';
        if (key === 'ADMIN_EMAIL') return 'admin@admin.com';
        return null;
      });
      mockFuncionarioRepository.create.mockReturnValue(mockAdmin);
      mockFuncionarioRepository.save.mockResolvedValue(mockAdmin);

      await service.onModuleInit();

      expect(mockFuncionarioRepository.count).toHaveBeenCalled();
      expect(mockFuncionarioRepository.create).toHaveBeenCalled();
      expect(mockFuncionarioRepository.save).toHaveBeenCalled();
    });

    it('não deve criar admin se já existir funcionários', async () => {
      mockFuncionarioRepository.count.mockResolvedValue(5);

      await service.onModuleInit();

      expect(mockFuncionarioRepository.count).toHaveBeenCalled();
      expect(mockFuncionarioRepository.create).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // TESTES: isFirstAccess()
  // ============================================
  describe('isFirstAccess', () => {
    it('deve retornar true se não houver usuários', async () => {
      mockFuncionarioRepository.count.mockResolvedValue(0);

      const result = await service.isFirstAccess();

      expect(result).toBe(true);
    });

    it('deve retornar false se houver usuários', async () => {
      mockFuncionarioRepository.count.mockResolvedValue(3);

      const result = await service.isFirstAccess();

      expect(result).toBe(false);
    });
  });

  // ============================================
  // TESTES: registroPrimeiroAcesso()
  // ============================================
  describe('registroPrimeiroAcesso', () => {
    const createDto = {
      nome: 'Primeiro Admin',
      email: 'primeiro@admin.com',
      senha: 'senha123',
      cargo: Cargo.GARCOM, // Será forçado para ADMIN
    };

    it('deve criar primeiro usuário como ADMIN', async () => {
      mockFuncionarioRepository.count.mockResolvedValue(0);
      mockFuncionarioRepository.create.mockReturnValue({
        ...createDto,
        cargo: Cargo.ADMIN,
        senha: 'hashedPassword123',
      });
      mockFuncionarioRepository.save.mockResolvedValue({
        id: 'new-admin-uuid',
        ...createDto,
        cargo: Cargo.ADMIN,
      });

      const result = await service.registroPrimeiroAcesso(createDto);

      expect(result.cargo).toBe(Cargo.ADMIN);
      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.senha, 10);
    });

    it('deve lançar ForbiddenException se já existir usuário', async () => {
      mockFuncionarioRepository.count.mockResolvedValue(1);

      await expect(service.registroPrimeiroAcesso(createDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deve lançar ConflictException se email já existir', async () => {
      mockFuncionarioRepository.count.mockResolvedValue(0);
      mockFuncionarioRepository.create.mockReturnValue(createDto);
      mockFuncionarioRepository.save.mockRejectedValue({ code: '23505' });

      await expect(service.registroPrimeiroAcesso(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ============================================
  // TESTES: create()
  // ============================================
  describe('create', () => {
    const createDto = {
      nome: 'Novo Funcionário',
      email: 'novo@email.com',
      senha: 'senha123',
      cargo: Cargo.GARCOM,
    };

    it('deve criar funcionário com sucesso', async () => {
      mockFuncionarioRepository.create.mockReturnValue({
        ...createDto,
        senha: 'hashedPassword123',
      });
      mockFuncionarioRepository.save.mockResolvedValue({
        id: 'new-func-uuid',
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.senha, 10);
    });

    it('deve lançar ConflictException se email já existir', async () => {
      mockFuncionarioRepository.create.mockReturnValue(createDto);
      mockFuncionarioRepository.save.mockRejectedValue({ code: '23505' });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve propagar outros erros', async () => {
      mockFuncionarioRepository.create.mockReturnValue(createDto);
      mockFuncionarioRepository.save.mockRejectedValue(new Error('DB Error'));

      await expect(service.create(createDto)).rejects.toThrow('DB Error');
    });
  });

  // ============================================
  // TESTES: findAll()
  // ============================================
  describe('findAll', () => {
    it('deve retornar lista de funcionários', async () => {
      mockFuncionarioRepository.find.mockResolvedValue([
        mockFuncionario,
        mockAdmin,
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockFuncionarioRepository.find).toHaveBeenCalled();
    });

    it('deve retornar lista vazia', async () => {
      mockFuncionarioRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  // ============================================
  // TESTES: findOne()
  // ============================================
  describe('findOne', () => {
    it('deve retornar funcionário por ID', async () => {
      mockFuncionarioRepository.findOne.mockResolvedValue(mockFuncionario);

      const result = await service.findOne(mockFuncionario.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockFuncionario.id);
    });

    it('deve retornar null se não encontrar', async () => {
      mockFuncionarioRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('id-invalido');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // TESTES: findByEmailAndTenant()
  // ============================================
  describe('findByEmailAndTenant', () => {
    const mockTenantId = 'tenant-uuid-1';

    it('deve retornar funcionário por email e tenantId', async () => {
      mockFuncionarioRepository.findByEmailAndTenantForAuth = jest.fn().mockResolvedValue(mockFuncionario);

      const result = await service.findByEmailAndTenant(mockFuncionario.email, mockTenantId);

      expect(result).toBeDefined();
      expect(mockFuncionarioRepository.findByEmailAndTenantForAuth).toHaveBeenCalledWith(
        mockFuncionario.email,
        mockTenantId,
      );
    });

    it('deve retornar null se email não existir no tenant', async () => {
      mockFuncionarioRepository.findByEmailAndTenantForAuth = jest.fn().mockResolvedValue(null);

      const result = await service.findByEmailAndTenant('inexistente@email.com', mockTenantId);

      expect(result).toBeNull();
    });
  });

  // ============================================
  // TESTES: update()
  // ============================================
  describe('update', () => {
    const updateDto = { nome: 'Nome Atualizado' };

    it('deve atualizar funcionário', async () => {
      mockFuncionarioRepository.preload.mockResolvedValue({
        ...mockFuncionario,
        ...updateDto,
      });
      mockFuncionarioRepository.save.mockResolvedValue({
        ...mockFuncionario,
        ...updateDto,
      });

      const result = await service.update(mockFuncionario.id, updateDto);

      expect(result.nome).toBe(updateDto.nome);
    });

    it('deve lançar NotFoundException se funcionário não existir', async () => {
      mockFuncionarioRepository.preload.mockResolvedValue(null);

      await expect(service.update('id-invalido', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ConflictException se email já existir', async () => {
      mockFuncionarioRepository.preload.mockResolvedValue(mockFuncionario);
      mockFuncionarioRepository.save.mockRejectedValue({ code: '23505' });

      await expect(
        service.update(mockFuncionario.id, { email: 'existente@email.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ============================================
  // TESTES: remove()
  // ============================================
  describe('remove', () => {
    it('deve remover funcionário', async () => {
      mockFuncionarioRepository.findOne.mockResolvedValue(mockFuncionario);
      mockFuncionarioRepository.remove.mockResolvedValue(mockFuncionario);

      await service.remove(mockFuncionario.id);

      expect(mockFuncionarioRepository.remove).toHaveBeenCalledWith(
        mockFuncionario,
      );
    });

    it('deve lançar NotFoundException se funcionário não existir', async () => {
      mockFuncionarioRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
