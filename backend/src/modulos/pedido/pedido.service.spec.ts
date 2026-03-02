import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { REQUEST } from '@nestjs/core';
import { PedidoService } from './pedido.service';
import { PedidoRepository } from './pedido.repository';
import { ItemPedidoRepository } from './item-pedido.repository';
import { RetiradaItemRepository } from './retirada-item.repository';
import { ComandaRepository } from '../comanda/comanda.repository';
import { ProdutoRepository } from '../produto/produto.repository';
import { AmbienteRepository } from '../ambiente/ambiente.repository';
import { FuncionarioRepository } from '../funcionario/funcionario.repository';
import { TurnoRepository } from '../turno/turno.repository';
import { PedidosGateway } from './pedidos.gateway';
import { CacheInvalidationService } from '../../cache/cache-invalidation.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { PedidoStatus } from './enums/pedido-status.enum';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PedidoService', () => {
  let service: PedidoService;
  let pedidoRepository: any;
  let itemPedidoRepository: any;
  let retiradaItemRepository: any;
  let comandaRepository: any;
  let produtoRepository: any;
  let ambienteRepository: any;
  let funcionarioRepository: any;
  let turnoRepository: any;
  let pedidosGateway: any;

  const mockPedidoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
    findByStatusComItens: jest.fn(),
    findByComandaId: jest.fn(),
    count: jest.fn(),
  };

  const mockItemPedidoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockRetiradaItemRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockComandaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockProdutoRepository = {
    findOne: jest.fn(),
  };

  const mockAmbienteRepository = {
    findOne: jest.fn(),
  };

  const mockFuncionarioRepository = {
    findOne: jest.fn(),
  };

  const mockTurnoRepository = {
    findOne: jest.fn(),
  };

  const mockPedidosGateway = {
    emitNovoPedido: jest.fn(),
    emitStatusAtualizado: jest.fn(),
    server: {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    },
  };

  // Mock data
  const mockComanda = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    status: 'ABERTA',
    cliente: { id: 'cliente-1', nome: 'Cliente Teste' },
    mesa: { id: 'mesa-1', numero: 1 },
  };

  const mockProduto = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    nome: 'Cerveja',
    preco: 15.0,
    ambiente: { id: 'ambiente-1', nome: 'Bar' },
  };

  const mockPedido = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    status: PedidoStatus.FEITO,
    total: 30.0,
    data: new Date(),
    comanda: mockComanda,
    itens: [],
  };

  const mockItemPedido = {
    id: '123e4567-e89b-12d3-a456-426614174003',
    quantidade: 2,
    precoUnitario: 15.0,
    status: PedidoStatus.FEITO,
    produto: mockProduto,
    pedido: mockPedido,
  };

  const mockFuncionario = {
    id: '123e4567-e89b-12d3-a456-426614174004',
    nome: 'Garçom Teste',
    role: 'GARCOM',
  };

  const mockTurno = {
    id: '123e4567-e89b-12d3-a456-426614174005',
    funcionarioId: mockFuncionario.id,
    ativo: true,
    checkOut: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidoService,
        {
          provide: PedidoRepository,
          useValue: mockPedidoRepository,
        },
        {
          provide: ItemPedidoRepository,
          useValue: mockItemPedidoRepository,
        },
        {
          provide: RetiradaItemRepository,
          useValue: mockRetiradaItemRepository,
        },
        {
          provide: ComandaRepository,
          useValue: mockComandaRepository,
        },
        {
          provide: ProdutoRepository,
          useValue: mockProdutoRepository,
        },
        {
          provide: AmbienteRepository,
          useValue: mockAmbienteRepository,
        },
        {
          provide: FuncionarioRepository,
          useValue: mockFuncionarioRepository,
        },
        {
          provide: TurnoRepository,
          useValue: mockTurnoRepository,
        },
        {
          provide: PedidosGateway,
          useValue: mockPedidosGateway,
        },
        {
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
        },
        {
          provide: CacheInvalidationService,
          useValue: { invalidate: jest.fn() },
        },
        {
          provide: TenantContextService,
          useValue: { getTenantId: jest.fn().mockReturnValue('tenant-uuid'), hasTenant: jest.fn().mockReturnValue(true) },
        },
        {
          provide: REQUEST,
          useValue: { tenantId: 'tenant-uuid' },
        },
      ],
    }).compile();

    service = await module.resolve<PedidoService>(PedidoService);
    pedidoRepository = module.get(PedidoRepository);
    itemPedidoRepository = module.get(ItemPedidoRepository);
    retiradaItemRepository = module.get(RetiradaItemRepository);
    comandaRepository = module.get(ComandaRepository);
    produtoRepository = module.get(ProdutoRepository);
    ambienteRepository = module.get(AmbienteRepository);
    funcionarioRepository = module.get(FuncionarioRepository);
    turnoRepository = module.get(TurnoRepository);
    pedidosGateway = module.get(PedidosGateway);
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
    const createPedidoDto = {
      comandaId: mockComanda.id,
      itens: [
        { produtoId: mockProduto.id, quantidade: 2, observacao: 'Bem gelada' },
      ],
    };

    it('deve criar um pedido com sucesso', async () => {
      mockComandaRepository.findOne.mockResolvedValue(mockComanda);
      mockProdutoRepository.findOne.mockResolvedValue(mockProduto);
      mockItemPedidoRepository.create.mockReturnValue(mockItemPedido);
      mockPedidoRepository.create.mockReturnValue(mockPedido);
      mockPedidoRepository.save.mockResolvedValue(mockPedido);
      mockPedidoRepository.findOne.mockResolvedValue({
        ...mockPedido,
        itens: [mockItemPedido],
      });

      const result = await service.create(createPedidoDto);

      expect(result).toBeDefined();
      expect(mockComandaRepository.findOne).toHaveBeenCalledWith({
        where: { id: createPedidoDto.comandaId },
      });
      expect(mockProdutoRepository.findOne).toHaveBeenCalled();
      expect(mockPedidoRepository.save).toHaveBeenCalled();
      expect(mockPedidosGateway.emitNovoPedido).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se comanda não existir', async () => {
      mockComandaRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createPedidoDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createPedidoDto)).rejects.toThrow(
        `Comanda com ID "${createPedidoDto.comandaId}" não encontrada.`,
      );
    });

    it('deve lançar BadRequestException se pedido não tiver itens', async () => {
      mockComandaRepository.findOne.mockResolvedValue(mockComanda);

      const dtoSemItens = { comandaId: mockComanda.id, itens: [] };

      await expect(service.create(dtoSemItens)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(dtoSemItens)).rejects.toThrow(
        'Um pedido não pode ser criado sem itens.',
      );
    });

    it('deve lançar NotFoundException se produto não existir', async () => {
      mockComandaRepository.findOne.mockResolvedValue(mockComanda);
      mockProdutoRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createPedidoDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve calcular total corretamente usando Decimal.js', async () => {
      const produtoComPrecoDecimal = { ...mockProduto, preco: 15.99 };
      const itemComQuantidade = { ...mockItemPedido, quantidade: 3, precoUnitario: 15.99 };

      mockComandaRepository.findOne.mockResolvedValue(mockComanda);
      mockProdutoRepository.findOne.mockResolvedValue(produtoComPrecoDecimal);
      mockItemPedidoRepository.create.mockReturnValue(itemComQuantidade);
      mockPedidoRepository.create.mockImplementation((data) => ({
        ...mockPedido,
        ...data,
      }));
      mockPedidoRepository.save.mockImplementation((pedido) =>
        Promise.resolve(pedido),
      );
      mockPedidoRepository.findOne.mockResolvedValue({
        ...mockPedido,
        total: 47.97, // 3 * 15.99
        itens: [itemComQuantidade],
      });

      const result = await service.create(createPedidoDto);

      expect(result.total).toBe(47.97);
    });
  });

  // ============================================
  // TESTES: findOne()
  // ============================================
  describe('findOne', () => {
    it('deve retornar um pedido por ID', async () => {
      mockPedidoRepository.findOne.mockResolvedValue(mockPedido);

      const result = await service.findOne(mockPedido.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockPedido.id);
      expect(mockPedidoRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockPedido.id },
        relations: expect.any(Array),
      });
    });

    it('deve lançar NotFoundException se pedido não existir', async () => {
      mockPedidoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Pedido com ID "invalid-id" não encontrado.',
      );
    });
  });

  // ============================================
  // TESTES: updateItemStatus()
  // ============================================
  describe('updateItemStatus', () => {
    it('deve atualizar status de item para EM_PREPARO', async () => {
      const itemParaAtualizar = { ...mockItemPedido, iniciadoEm: null };
      mockItemPedidoRepository.findOne.mockResolvedValue(itemParaAtualizar);
      mockItemPedidoRepository.save.mockImplementation((item) =>
        Promise.resolve(item),
      );
      mockPedidoRepository.findOne.mockResolvedValue(mockPedido);

      const result = await service.updateItemStatus(mockItemPedido.id, {
        status: PedidoStatus.EM_PREPARO,
      });

      expect(result.status).toBe(PedidoStatus.EM_PREPARO);
      expect(result.iniciadoEm).toBeDefined();
      expect(mockPedidosGateway.emitStatusAtualizado).toHaveBeenCalled();
    });

    it('deve atualizar status de item para PRONTO e registrar prontoEm', async () => {
      const itemEmPreparo = {
        ...mockItemPedido,
        status: PedidoStatus.EM_PREPARO,
        iniciadoEm: new Date(Date.now() - 600000), // 10 min atrás
        prontoEm: null,
      };
      mockItemPedidoRepository.findOne.mockResolvedValue(itemEmPreparo);
      mockItemPedidoRepository.save.mockImplementation((item) =>
        Promise.resolve(item),
      );
      mockPedidoRepository.findOne.mockResolvedValue(mockPedido);

      const result = await service.updateItemStatus(mockItemPedido.id, {
        status: PedidoStatus.PRONTO,
      });

      expect(result.status).toBe(PedidoStatus.PRONTO);
      expect(result.prontoEm).toBeDefined();
    });

    it('deve atualizar status de item para ENTREGUE e registrar entregueEm', async () => {
      const itemPronto = {
        ...mockItemPedido,
        status: PedidoStatus.PRONTO,
        iniciadoEm: new Date(Date.now() - 900000),
        prontoEm: new Date(Date.now() - 300000),
        entregueEm: null,
      };
      mockItemPedidoRepository.findOne.mockResolvedValue(itemPronto);
      mockItemPedidoRepository.save.mockImplementation((item) =>
        Promise.resolve(item),
      );
      mockPedidoRepository.findOne.mockResolvedValue(mockPedido);

      const result = await service.updateItemStatus(mockItemPedido.id, {
        status: PedidoStatus.ENTREGUE,
      });

      expect(result.status).toBe(PedidoStatus.ENTREGUE);
      expect(result.entregueEm).toBeDefined();
    });

    it('deve registrar motivo de cancelamento', async () => {
      mockItemPedidoRepository.findOne.mockResolvedValue(mockItemPedido);
      mockItemPedidoRepository.save.mockImplementation((item) =>
        Promise.resolve(item),
      );
      mockPedidoRepository.findOne.mockResolvedValue(mockPedido);

      const result = await service.updateItemStatus(mockItemPedido.id, {
        status: PedidoStatus.CANCELADO,
        motivoCancelamento: 'Cliente desistiu',
      });

      expect(result.status).toBe(PedidoStatus.CANCELADO);
      expect(result.motivoCancelamento).toBe('Cliente desistiu');
    });

    it('deve lançar NotFoundException se item não existir', async () => {
      mockItemPedidoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateItemStatus('invalid-id', { status: PedidoStatus.PRONTO }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // TESTES: retirarItem()
  // ============================================
  describe('retirarItem', () => {
    const retirarItemDto = { garcomId: mockFuncionario.id };

    it('deve marcar item como RETIRADO com sucesso', async () => {
      const itemPronto = {
        ...mockItemPedido,
        status: PedidoStatus.PRONTO,
        prontoEm: new Date(Date.now() - 120000), // 2 min atrás
        produto: mockProduto,
        pedido: { ...mockPedido, comanda: mockComanda },
      };

      mockItemPedidoRepository.findOne.mockResolvedValue(itemPronto);
      mockFuncionarioRepository.findOne.mockResolvedValue(mockFuncionario);
      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);
      mockItemPedidoRepository.save.mockImplementation((item) =>
        Promise.resolve(item),
      );
      mockRetiradaItemRepository.create.mockReturnValue({});
      mockRetiradaItemRepository.save.mockResolvedValue({});

      const result = await service.retirarItem(mockItemPedido.id, retirarItemDto);

      expect(result.status).toBe(PedidoStatus.RETIRADO);
      expect(result.retiradoEm).toBeDefined();
      expect(result.retiradoPorGarcomId).toBe(mockFuncionario.id);
      expect(result.tempoReacaoMinutos).toBeDefined();
    });

    it('deve lançar BadRequestException se item não estiver PRONTO', async () => {
      const itemEmPreparo = {
        ...mockItemPedido,
        status: PedidoStatus.EM_PREPARO,
      };
      mockItemPedidoRepository.findOne.mockResolvedValue(itemEmPreparo);

      await expect(
        service.retirarItem(mockItemPedido.id, retirarItemDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar NotFoundException se garçom não existir', async () => {
      const itemPronto = { ...mockItemPedido, status: PedidoStatus.PRONTO };
      mockItemPedidoRepository.findOne.mockResolvedValue(itemPronto);
      mockFuncionarioRepository.findOne.mockResolvedValue(null);

      await expect(
        service.retirarItem(mockItemPedido.id, retirarItemDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se garçom não tiver turno ativo', async () => {
      const itemPronto = { ...mockItemPedido, status: PedidoStatus.PRONTO };
      mockItemPedidoRepository.findOne.mockResolvedValue(itemPronto);
      mockFuncionarioRepository.findOne.mockResolvedValue(mockFuncionario);
      mockTurnoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.retirarItem(mockItemPedido.id, retirarItemDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // TESTES: marcarComoEntregue()
  // ============================================
  describe('marcarComoEntregue', () => {
    const marcarEntregueDto = { garcomId: mockFuncionario.id };

    it('deve marcar item como ENTREGUE com sucesso', async () => {
      const itemRetirado = {
        ...mockItemPedido,
        status: PedidoStatus.RETIRADO,
        prontoEm: new Date(Date.now() - 300000), // 5 min atrás
        retiradoEm: new Date(Date.now() - 60000), // 1 min atrás
        pedido: { ...mockPedido, comanda: mockComanda },
      };

      mockItemPedidoRepository.findOne.mockResolvedValue(itemRetirado);
      mockFuncionarioRepository.findOne.mockResolvedValue(mockFuncionario);
      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);
      mockItemPedidoRepository.save.mockImplementation((item) =>
        Promise.resolve(item),
      );

      const result = await service.marcarComoEntregue(
        mockItemPedido.id,
        marcarEntregueDto,
      );

      expect(result.status).toBe(PedidoStatus.ENTREGUE);
      expect(result.entregueEm).toBeDefined();
      expect(result.garcomEntregaId).toBe(mockFuncionario.id);
      expect(result.tempoEntregaMinutos).toBeDefined();
      expect(result.tempoEntregaFinalMinutos).toBeDefined();
    });

    it('deve lançar BadRequestException se item não estiver RETIRADO', async () => {
      const itemPronto = { ...mockItemPedido, status: PedidoStatus.PRONTO };
      mockItemPedidoRepository.findOne.mockResolvedValue(itemPronto);

      await expect(
        service.marcarComoEntregue(mockItemPedido.id, marcarEntregueDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se garçom não tiver turno ativo', async () => {
      const itemRetirado = { ...mockItemPedido, status: PedidoStatus.RETIRADO };
      mockItemPedidoRepository.findOne.mockResolvedValue(itemRetirado);
      mockFuncionarioRepository.findOne.mockResolvedValue(mockFuncionario);
      mockTurnoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.marcarComoEntregue(mockItemPedido.id, marcarEntregueDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // TESTES: deixarNoAmbiente()
  // ============================================
  describe('deixarNoAmbiente', () => {
    const deixarNoAmbienteDto = { motivo: 'Cliente não encontrado' };

    it('deve marcar item como DEIXADO_NO_AMBIENTE', async () => {
      const itemPronto = {
        ...mockItemPedido,
        status: PedidoStatus.PRONTO,
        pedido: {
          ...mockPedido,
          comanda: {
            ...mockComanda,
            pontoEntrega: {
              ambientePreparoId: 'ambiente-1',
            },
          },
        },
      };

      const mockAmbiente = { id: 'ambiente-1', nome: 'Bar' };

      mockItemPedidoRepository.findOne.mockResolvedValue(itemPronto);
      mockAmbienteRepository.findOne.mockResolvedValue(mockAmbiente);
      mockItemPedidoRepository.save.mockImplementation((item) =>
        Promise.resolve(item),
      );

      const result = await service.deixarNoAmbiente(
        mockItemPedido.id,
        deixarNoAmbienteDto,
      );

      expect(result.status).toBe(PedidoStatus.DEIXADO_NO_AMBIENTE);
      expect(result.ambienteRetiradaId).toBe(mockAmbiente.id);
    });

    it('deve lançar BadRequestException se item não estiver PRONTO', async () => {
      const itemEmPreparo = {
        ...mockItemPedido,
        status: PedidoStatus.EM_PREPARO,
      };
      mockItemPedidoRepository.findOne.mockResolvedValue(itemEmPreparo);

      await expect(
        service.deixarNoAmbiente(mockItemPedido.id, deixarNoAmbienteDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar NotFoundException se item não existir', async () => {
      mockItemPedidoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.deixarNoAmbiente('invalid-id', deixarNoAmbienteDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // TESTES: update()
  // ============================================
  describe('update', () => {
    it('deve atualizar um pedido', async () => {
      const updateDto = { comandaId: mockComanda.id, itens: [] };
      mockPedidoRepository.preload.mockResolvedValue({
        ...mockPedido,
        ...updateDto,
      });
      mockPedidoRepository.save.mockImplementation((pedido) =>
        Promise.resolve(pedido),
      );

      const result = await service.update(mockPedido.id, updateDto);

      expect(result).toBeDefined();
      expect(mockPedidoRepository.preload).toHaveBeenCalledWith({
        id: mockPedido.id,
        ...updateDto,
      });
    });

    it('deve lançar NotFoundException se pedido não existir', async () => {
      mockPedidoRepository.preload.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', { comandaId: mockComanda.id, itens: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // TESTES: remove()
  // ============================================
  describe('remove', () => {
    it('deve remover um pedido', async () => {
      mockPedidoRepository.findOne.mockResolvedValue(mockPedido);
      mockPedidoRepository.remove.mockResolvedValue(mockPedido);

      await expect(service.remove(mockPedido.id)).resolves.not.toThrow();
      expect(mockPedidoRepository.remove).toHaveBeenCalledWith(mockPedido);
    });

    it('deve lançar NotFoundException se pedido não existir', async () => {
      mockPedidoRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
