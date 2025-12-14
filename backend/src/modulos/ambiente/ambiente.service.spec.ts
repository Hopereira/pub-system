import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AmbienteService } from './ambiente.service';
import { Ambiente, TipoAmbiente } from './entities/ambiente.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('AmbienteService', () => {
  let service: AmbienteService;
  let ambienteRepository: jest.Mocked<Repository<Ambiente>>;

  const mockAmbienteRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  // Mock data
  const mockAmbiente: Partial<Ambiente> = {
    id: 'ambiente-uuid-1',
    nome: 'Cozinha',
    descricao: 'Área de preparo principal',
    tipo: TipoAmbiente.PREPARO,
    isPontoDeRetirada: false,
  };

  const mockAmbiente2: Partial<Ambiente> = {
    id: 'ambiente-uuid-2',
    nome: 'Salão Principal',
    descricao: 'Área de atendimento',
    tipo: TipoAmbiente.ATENDIMENTO,
    isPontoDeRetirada: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AmbienteService,
        {
          provide: getRepositoryToken(Ambiente),
          useValue: mockAmbienteRepository,
        },
      ],
    }).compile();

    service = module.get<AmbienteService>(AmbienteService);
    ambienteRepository = module.get(getRepositoryToken(Ambiente));
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
      nome: 'Bar',
      descricao: 'Área de bebidas',
      tipo: TipoAmbiente.PREPARO,
      isPontoDeRetirada: true,
    };

    it('deve criar ambiente com sucesso', async () => {
      mockAmbienteRepository.create.mockReturnValue(createDto);
      mockAmbienteRepository.save.mockResolvedValue({
        id: 'new-ambiente-uuid',
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.nome).toBe(createDto.nome);
      expect(mockAmbienteRepository.create).toHaveBeenCalledWith(createDto);
    });
  });

  // ============================================
  // TESTES: findAll()
  // ============================================
  describe('findAll', () => {
    it('deve retornar lista de ambientes com contagens', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            id: mockAmbiente.id,
            nome: mockAmbiente.nome,
            descricao: mockAmbiente.descricao,
            tipo: mockAmbiente.tipo,
            isPontoDeRetirada: false,
            productCount: '5',
            tableCount: '0',
          },
          {
            id: mockAmbiente2.id,
            nome: mockAmbiente2.nome,
            descricao: mockAmbiente2.descricao,
            tipo: mockAmbiente2.tipo,
            isPontoDeRetirada: false,
            productCount: '0',
            tableCount: '10',
          },
        ]),
      };
      mockAmbienteRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].productCount).toBe(5);
      expect(result[1].tableCount).toBe(10);
    });

    it('deve retornar lista vazia', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockAmbienteRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  // ============================================
  // TESTES: findOne()
  // ============================================
  describe('findOne', () => {
    it('deve retornar ambiente por ID', async () => {
      mockAmbienteRepository.findOne.mockResolvedValue(mockAmbiente);

      const result = await service.findOne(mockAmbiente.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockAmbiente.id);
    });

    it('deve lançar NotFoundException se ambiente não existir', async () => {
      mockAmbienteRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // TESTES: update()
  // ============================================
  describe('update', () => {
    const updateDto = { nome: 'Cozinha Principal' };

    it('deve atualizar ambiente', async () => {
      mockAmbienteRepository.preload.mockResolvedValue({
        ...mockAmbiente,
        ...updateDto,
      });
      mockAmbienteRepository.save.mockResolvedValue({
        ...mockAmbiente,
        ...updateDto,
      });

      const result = await service.update(mockAmbiente.id, updateDto);

      expect(result.nome).toBe(updateDto.nome);
    });

    it('deve lançar NotFoundException se ambiente não existir', async () => {
      mockAmbienteRepository.preload.mockResolvedValue(null);

      await expect(service.update('id-invalido', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // TESTES: remove()
  // ============================================
  describe('remove', () => {
    it('deve remover ambiente', async () => {
      mockAmbienteRepository.findOne.mockResolvedValue(mockAmbiente);
      mockAmbienteRepository.remove.mockResolvedValue(mockAmbiente);

      await service.remove(mockAmbiente.id);

      expect(mockAmbienteRepository.remove).toHaveBeenCalledWith(mockAmbiente);
    });

    it('deve lançar NotFoundException se ambiente não existir', async () => {
      mockAmbienteRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar ConflictException se ambiente estiver em uso', async () => {
      mockAmbienteRepository.findOne.mockResolvedValue(mockAmbiente);
      mockAmbienteRepository.remove.mockRejectedValue({ code: '23503' });

      await expect(service.remove(mockAmbiente.id)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
