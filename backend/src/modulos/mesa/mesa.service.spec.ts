import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MesaService } from './mesa.service';
import { Mesa, MesaStatus } from './entities/mesa.entity';
import { Ambiente } from '../ambiente/entities/ambiente.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('MesaService', () => {
  let service: MesaService;
  let mesaRepository: jest.Mocked<Repository<Mesa>>;
  let ambienteRepository: jest.Mocked<Repository<Ambiente>>;

  const mockMesaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
    manager: {
      find: jest.fn(),
    },
  };

  const mockAmbienteRepository = {
    findOne: jest.fn(),
  };

  // Mock data
  const mockAmbiente = {
    id: 'ambiente-uuid-1',
    nome: 'Salão Principal',
    tipo: 'ATENDIMENTO',
  };

  const mockMesa: Partial<Mesa> = {
    id: 'mesa-uuid-1',
    numero: 1,
    status: MesaStatus.LIVRE,
    ambiente: mockAmbiente as Ambiente,
    posicao: { x: 100, y: 100 },
    tamanho: { width: 80, height: 80 },
    rotacao: 0,
    comandas: [],
  };

  const mockMesa2: Partial<Mesa> = {
    id: 'mesa-uuid-2',
    numero: 2,
    status: MesaStatus.OCUPADA,
    ambiente: mockAmbiente as Ambiente,
    posicao: { x: 200, y: 100 },
    tamanho: { width: 80, height: 80 },
    rotacao: 0,
    comandas: [{ id: 'comanda-1', status: 'ABERTA', cliente: { id: 'c1', nome: 'Cliente' } }] as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MesaService,
        {
          provide: getRepositoryToken(Mesa),
          useValue: mockMesaRepository,
        },
        {
          provide: getRepositoryToken(Ambiente),
          useValue: mockAmbienteRepository,
        },
      ],
    }).compile();

    service = module.get<MesaService>(MesaService);
    mesaRepository = module.get(getRepositoryToken(Mesa));
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
      numero: 5,
      ambienteId: mockAmbiente.id,
    };

    it('deve criar mesa com sucesso', async () => {
      mockAmbienteRepository.findOne.mockResolvedValue(mockAmbiente);
      mockMesaRepository.findOne.mockResolvedValue(null);
      mockMesaRepository.create.mockReturnValue({
        ...createDto,
        ambiente: mockAmbiente,
        posicao: { x: 100, y: 100 },
      });
      mockMesaRepository.save.mockResolvedValue({
        id: 'new-mesa-uuid',
        ...createDto,
        ambiente: mockAmbiente,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.numero).toBe(createDto.numero);
    });

    it('deve criar mesa com posição personalizada', async () => {
      const dtoComPosicao = {
        ...createDto,
        posicao: { x: 300, y: 400 },
        tamanho: { width: 100, height: 100 },
        rotacao: 45,
      };
      mockAmbienteRepository.findOne.mockResolvedValue(mockAmbiente);
      mockMesaRepository.findOne.mockResolvedValue(null);
      mockMesaRepository.create.mockReturnValue(dtoComPosicao);
      mockMesaRepository.save.mockResolvedValue({
        id: 'new-mesa-uuid',
        ...dtoComPosicao,
      });

      const result = await service.create(dtoComPosicao);

      expect(result.posicao).toEqual({ x: 300, y: 400 });
    });

    it('deve lançar NotFoundException se ambiente não existir', async () => {
      mockAmbienteRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException se mesa já existir no mesmo ambiente', async () => {
      mockAmbienteRepository.findOne.mockResolvedValue(mockAmbiente);
      mockMesaRepository.findOne.mockResolvedValue({
        ...mockMesa,
        ambiente: mockAmbiente,
      });

      await expect(service.create({ numero: 1, ambienteId: mockAmbiente.id })).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve lançar ConflictException se mesa já existir em outro ambiente', async () => {
      const outroAmbiente = { id: 'outro-ambiente', nome: 'Varanda' };
      mockAmbienteRepository.findOne.mockResolvedValue(mockAmbiente);
      mockMesaRepository.findOne.mockResolvedValue({
        ...mockMesa,
        ambiente: outroAmbiente,
      });

      await expect(service.create({ numero: 1, ambienteId: mockAmbiente.id })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ============================================
  // TESTES: findAll()
  // ============================================
  describe('findAll', () => {
    it('deve retornar lista de mesas com status calculado', async () => {
      mockMesaRepository.find.mockResolvedValue([mockMesa, mockMesa2]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(MesaStatus.LIVRE);
      expect(result[1].status).toBe(MesaStatus.OCUPADA);
    });

    it('deve retornar lista vazia', async () => {
      mockMesaRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });

    it('deve incluir dados da comanda aberta', async () => {
      mockMesaRepository.find.mockResolvedValue([mockMesa2]);

      const result = await service.findAll();

      expect((result[0] as any).comanda).toBeDefined();
      expect((result[0] as any).comanda.id).toBe('comanda-1');
    });
  });

  // ============================================
  // TESTES: findByAmbiente()
  // ============================================
  describe('findByAmbiente', () => {
    it('deve retornar mesas do ambiente', async () => {
      mockAmbienteRepository.findOne.mockResolvedValue(mockAmbiente);
      mockMesaRepository.find.mockResolvedValue([mockMesa, mockMesa2]);

      const result = await service.findByAmbiente(mockAmbiente.id);

      expect(result).toHaveLength(2);
    });

    it('deve lançar NotFoundException se ambiente não existir', async () => {
      mockAmbienteRepository.findOne.mockResolvedValue(null);

      await expect(service.findByAmbiente('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // TESTES: findOne()
  // ============================================
  describe('findOne', () => {
    it('deve retornar mesa por ID', async () => {
      mockMesaRepository.findOne.mockResolvedValue(mockMesa);

      const result = await service.findOne(mockMesa.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockMesa.id);
    });

    it('deve lançar NotFoundException se mesa não existir', async () => {
      mockMesaRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // TESTES: update()
  // ============================================
  describe('update', () => {
    const updateDto = { numero: 10 };

    it('deve atualizar mesa', async () => {
      mockMesaRepository.preload.mockResolvedValue({
        ...mockMesa,
        ...updateDto,
      });
      mockMesaRepository.save.mockResolvedValue({
        ...mockMesa,
        ...updateDto,
      });

      const result = await service.update(mockMesa.id, updateDto);

      expect(result.numero).toBe(updateDto.numero);
    });

    it('deve atualizar ambiente da mesa', async () => {
      const novoAmbiente = { id: 'ambiente-uuid-2', nome: 'Varanda' };
      mockMesaRepository.preload.mockResolvedValue(mockMesa);
      mockAmbienteRepository.findOne.mockResolvedValue(novoAmbiente);
      mockMesaRepository.save.mockResolvedValue({
        ...mockMesa,
        ambiente: novoAmbiente,
      });

      const result = await service.update(mockMesa.id, {
        ambienteId: novoAmbiente.id,
      });

      expect(result.ambiente).toBe(novoAmbiente);
    });

    it('deve lançar NotFoundException se mesa não existir', async () => {
      mockMesaRepository.preload.mockResolvedValue(null);

      await expect(service.update('id-invalido', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar NotFoundException se novo ambiente não existir', async () => {
      mockMesaRepository.preload.mockResolvedValue(mockMesa);
      mockAmbienteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockMesa.id, { ambienteId: 'ambiente-invalido' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // TESTES: remove()
  // ============================================
  describe('remove', () => {
    it('deve remover mesa', async () => {
      mockMesaRepository.findOne.mockResolvedValue(mockMesa);
      mockMesaRepository.remove.mockResolvedValue(mockMesa);

      await service.remove(mockMesa.id);

      expect(mockMesaRepository.remove).toHaveBeenCalledWith(mockMesa);
    });

    it('deve lançar NotFoundException se mesa não existir', async () => {
      mockMesaRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // TESTES: atualizarPosicao()
  // ============================================
  describe('atualizarPosicao', () => {
    it('deve atualizar posição da mesa', async () => {
      const novaPosicao = { x: 500, y: 600 };
      mockMesaRepository.findOne.mockResolvedValue(mockMesa);
      mockMesaRepository.save.mockResolvedValue({
        ...mockMesa,
        posicao: novaPosicao,
      });

      const result = await service.atualizarPosicao(mockMesa.id, {
        posicao: novaPosicao,
      });

      expect(result.posicao).toEqual(novaPosicao);
    });

    it('deve atualizar posição, tamanho e rotação', async () => {
      const dto = {
        posicao: { x: 500, y: 600 },
        tamanho: { width: 120, height: 120 },
        rotacao: 90,
      };
      mockMesaRepository.findOne.mockResolvedValue(mockMesa);
      mockMesaRepository.save.mockResolvedValue({
        ...mockMesa,
        ...dto,
      });

      const result = await service.atualizarPosicao(mockMesa.id, dto);

      expect(result.posicao).toEqual(dto.posicao);
      expect(result.tamanho).toEqual(dto.tamanho);
      expect(result.rotacao).toBe(dto.rotacao);
    });
  });

  // ============================================
  // TESTES: getMapa()
  // ============================================
  describe('getMapa', () => {
    it('deve retornar mapa completo do ambiente', async () => {
      mockMesaRepository.find.mockResolvedValue([mockMesa, mockMesa2]);
      mockMesaRepository.manager.find.mockResolvedValue([]);

      const result = await service.getMapa(mockAmbiente.id);

      expect(result.mesas).toHaveLength(2);
      expect(result.pontosEntrega).toHaveLength(0);
      expect(result.layout).toBeDefined();
    });

    it('deve incluir pontos de entrega no mapa', async () => {
      mockMesaRepository.find.mockResolvedValue([mockMesa]);
      mockMesaRepository.manager.find.mockResolvedValue([
        {
          id: 'ponto-1',
          nome: 'Balcão',
          ativo: true,
          posicao: { x: 50, y: 50 },
          comandas: [],
        },
      ]);

      const result = await service.getMapa(mockAmbiente.id);

      expect(result.pontosEntrega).toHaveLength(1);
      expect(result.pontosEntrega[0].nome).toBe('Balcão');
    });
  });
});
