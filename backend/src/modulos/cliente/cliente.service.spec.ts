import { Test, TestingModule } from '@nestjs/testing';
import { ClienteService } from './cliente.service';
import { ClienteRepository } from './cliente.repository';
import { Cliente } from './entities/cliente.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ClienteService', () => {
  let service: ClienteService;
  let clienteRepository: any;

  const mockClienteRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
    findByCpf: jest.fn(),
    findByCpfPublic: jest.fn(),
    savePublic: jest.fn(),
    findByTelefone: jest.fn(),
  };

  // Mock data
  const mockCliente: Partial<Cliente> = {
    id: 'cliente-uuid-1',
    nome: 'Maria Silva',
    cpf: '12345678901',
    email: 'maria@email.com',
    celular: '11999999999',
  };

  const mockCliente2: Partial<Cliente> = {
    id: 'cliente-uuid-2',
    nome: 'João Santos',
    cpf: '98765432100',
    email: 'joao@email.com',
    celular: '11888888888',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClienteService,
        {
          provide: ClienteRepository,
          useValue: mockClienteRepository,
        },
      ],
    }).compile();

    service = module.get<ClienteService>(ClienteService);
    clienteRepository = module.get(ClienteRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // TESTES: create()
  // ============================================
  describe('create', () => {
    const createDto = {
      nome: 'Novo Cliente',
      cpf: '11122233344',
      email: 'novo@email.com',
      celular: '11777777777',
    };

    it('deve criar cliente com sucesso', async () => {
      mockClienteRepository.findOne.mockResolvedValue(null);
      mockClienteRepository.create.mockReturnValue(createDto);
      mockClienteRepository.save.mockResolvedValue({
        id: 'new-cliente-uuid',
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.cpf).toBe(createDto.cpf);
    });

    it('deve lançar ConflictException se CPF já existir', async () => {
      mockClienteRepository.findOne.mockResolvedValue(mockCliente);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Um cliente com este CPF já está cadastrado.',
      );
    });
  });

  // ============================================
  // TESTES: createRapido()
  // ============================================
  describe('createRapido', () => {
    it('deve criar cliente rápido com CPF', async () => {
      const dto = { nome: 'Cliente Rápido', cpf: '55566677788' };
      mockClienteRepository.findOne.mockResolvedValue(null);
      mockClienteRepository.create.mockReturnValue(dto);
      mockClienteRepository.save.mockResolvedValue({
        id: 'new-cliente-uuid',
        ...dto,
      });

      const result = await service.createRapido(dto);

      expect(result).toBeDefined();
      expect(result.cpf).toBe(dto.cpf);
    });

    it('deve retornar cliente existente se CPF já existir', async () => {
      const dto = { nome: 'Cliente Rápido', cpf: mockCliente.cpf };
      mockClienteRepository.findOne.mockResolvedValue(mockCliente);

      const result = await service.createRapido(dto);

      expect(result).toBe(mockCliente);
      expect(mockClienteRepository.save).not.toHaveBeenCalled();
    });

    it('deve criar cliente com CPF temporário se não fornecido', async () => {
      const dto = { nome: 'Cliente Sem CPF' };
      mockClienteRepository.create.mockReturnValue({
        ...dto,
        cpf: '99912345678',
      });
      mockClienteRepository.save.mockResolvedValue({
        id: 'new-cliente-uuid',
        ...dto,
        cpf: '99912345678',
      });

      const result = await service.createRapido(dto);

      expect(result).toBeDefined();
      expect(result.cpf).toMatch(/^999/); // CPF temporário começa com 999
    });

    it('deve criar cliente com telefone e pontoEntregaId', async () => {
      const dto = {
        nome: 'Cliente Completo',
        cpf: '44455566677',
        telefone: '11666666666',
        pontoEntregaId: 'ponto-uuid-1',
      };
      mockClienteRepository.findOne.mockResolvedValue(null);
      mockClienteRepository.create.mockReturnValue(dto);
      mockClienteRepository.save.mockResolvedValue({
        id: 'new-cliente-uuid',
        ...dto,
      });

      const result = await service.createRapido(dto);

      expect(result).toBeDefined();
    });
  });

  // ============================================
  // TESTES: findAll()
  // ============================================
  describe('findAll', () => {
    it('deve retornar lista de clientes', async () => {
      mockClienteRepository.find.mockResolvedValue([mockCliente, mockCliente2]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockClienteRepository.find).toHaveBeenCalled();
    });

    it('deve retornar lista vazia', async () => {
      mockClienteRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  // ============================================
  // TESTES: findByCpf()
  // ============================================
  describe('findByCpf', () => {
    it('deve retornar cliente por CPF', async () => {
      mockClienteRepository.findOne.mockResolvedValue(mockCliente);

      const result = await service.findByCpf(mockCliente.cpf);

      expect(result).toBeDefined();
      expect(result.cpf).toBe(mockCliente.cpf);
    });

    it('deve lançar NotFoundException se CPF não existir', async () => {
      mockClienteRepository.findOne.mockResolvedValue(null);

      await expect(service.findByCpf('00000000000')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // TESTES: buscar()
  // ============================================
  describe('buscar', () => {
    it('deve buscar por CPF (11 dígitos)', async () => {
      mockClienteRepository.findOne.mockResolvedValue(mockCliente);

      const result = await service.buscar('12345678901');

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockCliente);
    });

    it('deve retornar array vazio se CPF não encontrado', async () => {
      mockClienteRepository.findOne.mockResolvedValue(null);

      const result = await service.buscar('00000000000');

      expect(result).toHaveLength(0);
    });

    it('deve buscar por nome (menos de 11 dígitos)', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockCliente, mockCliente2]),
      };
      mockClienteRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.buscar('Maria');

      expect(result).toHaveLength(2);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'LOWER(cliente.nome) LIKE LOWER(:termo)',
        { termo: '%Maria%' },
      );
    });

    it('deve limitar resultados a 10', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockClienteRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.buscar('teste');

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it('deve remover formatação do CPF antes de buscar', async () => {
      mockClienteRepository.findOne.mockResolvedValue(mockCliente);

      const result = await service.buscar('123.456.789-01');

      expect(result).toHaveLength(1);
      expect(mockClienteRepository.findOne).toHaveBeenCalledWith({
        where: { cpf: '12345678901' },
      });
    });
  });

  // ============================================
  // TESTES: findOne()
  // ============================================
  describe('findOne', () => {
    it('deve retornar cliente por ID', async () => {
      mockClienteRepository.findOne.mockResolvedValue(mockCliente);

      const result = await service.findOne(mockCliente.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockCliente.id);
    });

    it('deve lançar NotFoundException se cliente não existir', async () => {
      mockClienteRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // TESTES: update()
  // ============================================
  describe('update', () => {
    const updateDto = { nome: 'Nome Atualizado' };

    it('deve atualizar cliente', async () => {
      mockClienteRepository.preload.mockResolvedValue({
        ...mockCliente,
        ...updateDto,
      });
      mockClienteRepository.save.mockResolvedValue({
        ...mockCliente,
        ...updateDto,
      });

      const result = await service.update(mockCliente.id, updateDto);

      expect(result.nome).toBe(updateDto.nome);
    });

    it('deve lançar NotFoundException se cliente não existir', async () => {
      mockClienteRepository.preload.mockResolvedValue(null);

      await expect(service.update('id-invalido', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // TESTES: remove()
  // ============================================
  describe('remove', () => {
    it('deve remover cliente', async () => {
      mockClienteRepository.findOne.mockResolvedValue(mockCliente);
      mockClienteRepository.remove.mockResolvedValue(mockCliente);

      await service.remove(mockCliente.id);

      expect(mockClienteRepository.remove).toHaveBeenCalledWith(mockCliente);
    });

    it('deve lançar NotFoundException se cliente não existir', async () => {
      mockClienteRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
