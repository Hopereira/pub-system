import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PontoEntregaService } from './ponto-entrega.service';
import { PontoEntrega } from './entities/ponto-entrega.entity';
import { Empresa } from '../empresa/entities/empresa.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PontoEntregaService', () => {
  let service: PontoEntregaService;
  let pontoEntregaRepository: jest.Mocked<Repository<PontoEntrega>>;
  let empresaRepository: jest.Mocked<Repository<Empresa>>;

  const mockPontoEntregaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockEmpresaRepository = {
    findOne: jest.fn(),
  };

  // Mock data
  const mockEmpresa = {
    id: 'empresa-uuid-1',
    nomeFantasia: 'Pub Test',
  };

  const mockPontoEntrega: Partial<PontoEntrega> = {
    id: 'ponto-uuid-1',
    nome: 'Balcão Principal',
    descricao: 'Balcão de atendimento',
    ativo: true,
    empresaId: mockEmpresa.id,
    posicao: { x: 100, y: 100 },
    tamanho: { width: 100, height: 60 },
  };

  const mockPontoEntrega2: Partial<PontoEntrega> = {
    id: 'ponto-uuid-2',
    nome: 'Varanda',
    descricao: 'Área externa',
    ativo: true,
    empresaId: mockEmpresa.id,
    posicao: { x: 200, y: 200 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PontoEntregaService,
        {
          provide: getRepositoryToken(PontoEntrega),
          useValue: mockPontoEntregaRepository,
        },
        {
          provide: getRepositoryToken(Empresa),
          useValue: mockEmpresaRepository,
        },
      ],
    }).compile();

    service = module.get<PontoEntregaService>(PontoEntregaService);
    pontoEntregaRepository = module.get(getRepositoryToken(PontoEntrega));
    empresaRepository = module.get(getRepositoryToken(Empresa));
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
      nome: 'Novo Ponto',
      descricao: 'Descrição do ponto',
      ambientePreparoId: 'ambiente-preparo-uuid',
    };

    it('deve criar ponto de entrega com empresaId fornecido', async () => {
      mockPontoEntregaRepository.create.mockReturnValue({
        ...createDto,
        empresaId: mockEmpresa.id,
      });
      mockPontoEntregaRepository.save.mockResolvedValue({
        id: 'new-ponto-uuid',
        ...createDto,
        empresaId: mockEmpresa.id,
      });
      mockPontoEntregaRepository.findOne.mockResolvedValue({
        id: 'new-ponto-uuid',
        ...createDto,
        empresaId: mockEmpresa.id,
      });

      const result = await service.create(createDto, mockEmpresa.id);

      expect(result).toBeDefined();
      expect(result.nome).toBe(createDto.nome);
    });

    it('deve criar ponto de entrega usando empresa padrão', async () => {
      mockEmpresaRepository.findOne.mockResolvedValue(mockEmpresa);
      mockPontoEntregaRepository.create.mockReturnValue({
        ...createDto,
        empresaId: mockEmpresa.id,
      });
      mockPontoEntregaRepository.save.mockResolvedValue({
        id: 'new-ponto-uuid',
        ...createDto,
        empresaId: mockEmpresa.id,
      });
      mockPontoEntregaRepository.findOne.mockResolvedValue({
        id: 'new-ponto-uuid',
        ...createDto,
        empresaId: mockEmpresa.id,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockEmpresaRepository.findOne).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se não houver empresa', async () => {
      mockEmpresaRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ============================================
  // TESTES: findAll()
  // ============================================
  describe('findAll', () => {
    it('deve retornar lista de pontos de entrega', async () => {
      mockEmpresaRepository.findOne.mockResolvedValue(mockEmpresa);
      mockPontoEntregaRepository.find.mockResolvedValue([
        mockPontoEntrega,
        mockPontoEntrega2,
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
    });

    it('deve filtrar por empresaId', async () => {
      mockPontoEntregaRepository.find.mockResolvedValue([mockPontoEntrega]);

      const result = await service.findAll(mockEmpresa.id);

      expect(result).toHaveLength(1);
      expect(mockPontoEntregaRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { empresaId: mockEmpresa.id },
        }),
      );
    });
  });

  // ============================================
  // TESTES: findAllAtivos()
  // ============================================
  describe('findAllAtivos', () => {
    it('deve retornar apenas pontos ativos', async () => {
      mockEmpresaRepository.findOne.mockResolvedValue(mockEmpresa);
      mockPontoEntregaRepository.find.mockResolvedValue([mockPontoEntrega]);

      const result = await service.findAllAtivos();

      expect(result).toHaveLength(1);
      expect(mockPontoEntregaRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ativo: true }),
        }),
      );
    });
  });

  // ============================================
  // TESTES: findByAmbiente()
  // ============================================
  describe('findByAmbiente', () => {
    it('deve retornar pontos do ambiente', async () => {
      mockPontoEntregaRepository.find.mockResolvedValue([mockPontoEntrega]);

      const result = await service.findByAmbiente('ambiente-uuid-1');

      expect(result).toHaveLength(1);
    });
  });

  // ============================================
  // TESTES: findOne()
  // ============================================
  describe('findOne', () => {
    it('deve retornar ponto por ID', async () => {
      mockPontoEntregaRepository.findOne.mockResolvedValue(mockPontoEntrega);

      const result = await service.findOne(mockPontoEntrega.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockPontoEntrega.id);
    });

    it('deve lançar NotFoundException se ponto não existir', async () => {
      mockPontoEntregaRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // TESTES: update()
  // ============================================
  describe('update', () => {
    const updateDto = { nome: 'Balcão Atualizado' };

    it('deve atualizar ponto de entrega', async () => {
      mockPontoEntregaRepository.findOne
        .mockResolvedValueOnce(mockPontoEntrega)
        .mockResolvedValueOnce({ ...mockPontoEntrega, ...updateDto });
      mockPontoEntregaRepository.save.mockResolvedValue({
        ...mockPontoEntrega,
        ...updateDto,
      });

      const result = await service.update(mockPontoEntrega.id, updateDto);

      expect(result.nome).toBe(updateDto.nome);
    });

    it('deve lançar NotFoundException se ponto não existir', async () => {
      mockPontoEntregaRepository.findOne.mockResolvedValue(null);

      await expect(service.update('id-invalido', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // TESTES: remove()
  // ============================================
  describe('remove', () => {
    it('deve remover ponto de entrega', async () => {
      mockPontoEntregaRepository.findOne.mockResolvedValue(mockPontoEntrega);
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };
      mockPontoEntregaRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );
      mockPontoEntregaRepository.remove.mockResolvedValue(mockPontoEntrega);

      await service.remove(mockPontoEntrega.id);

      expect(mockPontoEntregaRepository.remove).toHaveBeenCalledWith(
        mockPontoEntrega,
      );
    });

    it('deve lançar BadRequestException se houver comandas ativas', async () => {
      mockPontoEntregaRepository.findOne.mockResolvedValue(mockPontoEntrega);
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
      };
      mockPontoEntregaRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await expect(service.remove(mockPontoEntrega.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar NotFoundException se ponto não existir', async () => {
      mockPontoEntregaRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // TESTES: toggleAtivo()
  // ============================================
  describe('toggleAtivo', () => {
    it('deve alternar status ativo', async () => {
      mockPontoEntregaRepository.findOne.mockResolvedValue({
        ...mockPontoEntrega,
        ativo: true,
      });
      mockPontoEntregaRepository.save.mockResolvedValue({
        ...mockPontoEntrega,
        ativo: false,
      });

      const result = await service.toggleAtivo(mockPontoEntrega.id);

      expect(result.ativo).toBe(false);
    });
  });

  // ============================================
  // TESTES: atualizarPosicao()
  // ============================================
  describe('atualizarPosicao', () => {
    it('deve atualizar posição do ponto', async () => {
      const novaPosicao = { x: 500, y: 600 };
      mockPontoEntregaRepository.findOne.mockResolvedValue(mockPontoEntrega);
      mockPontoEntregaRepository.save.mockResolvedValue({
        ...mockPontoEntrega,
        posicao: novaPosicao,
      });

      const result = await service.atualizarPosicao(mockPontoEntrega.id, {
        posicao: novaPosicao,
      });

      expect(result.posicao).toEqual(novaPosicao);
    });

    it('deve atualizar posição e tamanho', async () => {
      const dto = {
        posicao: { x: 500, y: 600 },
        tamanho: { width: 150, height: 80 },
      };
      mockPontoEntregaRepository.findOne.mockResolvedValue(mockPontoEntrega);
      mockPontoEntregaRepository.save.mockResolvedValue({
        ...mockPontoEntrega,
        ...dto,
      });

      const result = await service.atualizarPosicao(mockPontoEntrega.id, dto);

      expect(result.posicao).toEqual(dto.posicao);
      expect(result.tamanho).toEqual(dto.tamanho);
    });
  });
});
