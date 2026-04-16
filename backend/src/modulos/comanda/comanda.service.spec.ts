import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { REQUEST } from '@nestjs/core';
import { ComandaService } from './comanda.service';
import { ComandaRepository } from './comanda.repository';
import { ComandaAgregadoRepository } from './comanda-agregado.repository';
import { MesaRepository } from '../mesa/mesa.repository';
import { ClienteRepository } from '../cliente/cliente.repository';
import { PaginaEventoRepository } from '../pagina-evento/pagina-evento.repository';
import { EventoRepository } from '../evento/evento.repository';
import { PedidoRepository } from '../pedido/pedido.repository';
import { ItemPedidoRepository } from '../pedido/item-pedido.repository';
import { PontoEntregaRepository } from '../ponto-entrega/ponto-entrega.repository';
import { PedidosGateway } from '../pedido/pedidos.gateway';
import { CaixaService } from '../caixa/caixa.service';
import { CacheInvalidationService } from '../../cache/cache-invalidation.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { Comanda, ComandaStatus } from './entities/comanda.entity';
import { MesaStatus } from '../mesa/entities/mesa.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PedidoStatus } from '../pedido/enums/pedido-status.enum';
import { FormaPagamento } from '../caixa/dto/create-venda.dto';

describe('ComandaService', () => {
  let service: ComandaService;
  let comandaRepository: any;
  let mesaRepository: any;
  let clienteRepository: any;
  let pontoEntregaRepository: any;
  let pedidosGateway: any;
  let caixaService: any;

  // Mock do EntityManager para transações
  const mockTransactionManager = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockComandaRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
    findAbertasComRelacoes: jest.fn(),
    findByMesaId: jest.fn(),
    findByIdPublic: jest.fn(),
    count: jest.fn(),
    findAndCount: jest.fn(),
    manager: {
      transaction: jest.fn((cb) => cb(mockTransactionManager)),
    },
    rawRepository: {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      manager: {
        transaction: jest.fn((cb) => cb(mockTransactionManager)),
      },
    },
  };

  const mockMesaRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    rawRepository: {
      findOne: jest.fn(),
      save: jest.fn(),
    },
  };

  const mockClienteRepository = {
    findOne: jest.fn(),
  };

  const mockPaginaEventoRepository = {
    findOne: jest.fn(),
  };

  const mockEventoRepository = {
    findOne: jest.fn(),
  };

  const mockPedidoRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockItemPedidoRepository = {
    findOne: jest.fn(),
  };

  const mockPontoEntregaRepository = {
    findOne: jest.fn(),
    rawRepository: {
      findOne: jest.fn(),
      save: jest.fn(),
    },
  };

  const mockComandaAgregadoRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPedidosGateway = {
    emitComandaAtualizada: jest.fn(),
    emitNovoPedido: jest.fn(),
    emitNovaComanda: jest.fn(),
  };

  const mockCaixaService = {
    getCaixaAbertoAtual: jest.fn(),
    registrarVenda: jest.fn(),
  };

  // Mock data
  const mockMesa = {
    id: 'mesa-uuid-1',
    numero: 1,
    status: MesaStatus.LIVRE,
    ambiente: { id: 'ambiente-1', nome: 'Salão' },
  };

  const mockCliente = {
    id: 'cliente-uuid-1',
    nome: 'João Silva',
    cpf: '12345678901',
  };

  const mockPontoEntrega = {
    id: 'ponto-uuid-1',
    nome: 'Balcão Principal',
    ativo: true,
  };

  const mockComanda = {
    id: 'comanda-uuid-1',
    status: ComandaStatus.ABERTA,
    mesa: mockMesa,
    cliente: mockCliente,
    pedidos: [],
    agregados: [],
  };

  const mockPedido = {
    id: 'pedido-uuid-1',
    status: PedidoStatus.FEITO,
    total: 50.0,
    itens: [
      {
        id: 'item-uuid-1',
        quantidade: 2,
        precoUnitario: 25.0,
        status: PedidoStatus.FEITO,
        produto: { nome: 'Cerveja' },
      },
    ],
  };

  const mockCaixaAberto = {
    id: 'caixa-uuid-1',
    valorInicial: 100,
    status: 'ABERTO',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComandaService,
        {
          provide: ComandaRepository,
          useValue: mockComandaRepository,
        },
        {
          provide: MesaRepository,
          useValue: mockMesaRepository,
        },
        {
          provide: ClienteRepository,
          useValue: mockClienteRepository,
        },
        {
          provide: PaginaEventoRepository,
          useValue: mockPaginaEventoRepository,
        },
        {
          provide: EventoRepository,
          useValue: mockEventoRepository,
        },
        {
          provide: PedidoRepository,
          useValue: mockPedidoRepository,
        },
        {
          provide: ItemPedidoRepository,
          useValue: mockItemPedidoRepository,
        },
        {
          provide: PontoEntregaRepository,
          useValue: mockPontoEntregaRepository,
        },
        {
          provide: ComandaAgregadoRepository,
          useValue: mockComandaAgregadoRepository,
        },
        {
          provide: PedidosGateway,
          useValue: mockPedidosGateway,
        },
        {
          provide: CaixaService,
          useValue: mockCaixaService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
        },
        {
          provide: CacheInvalidationService,
          useValue: { invalidateAmbientes: jest.fn(), invalidateProdutos: jest.fn(), invalidateMesas: jest.fn(), invalidateComandas: jest.fn(), invalidatePedidos: jest.fn(), invalidatePattern: jest.fn(), invalidateMultiple: jest.fn() },
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

    service = await module.resolve<ComandaService>(ComandaService);
    comandaRepository = module.get(ComandaRepository);
    mesaRepository = module.get(MesaRepository);
    clienteRepository = module.get(ClienteRepository);
    pontoEntregaRepository = module.get(PontoEntregaRepository);
    pedidosGateway = module.get(PedidosGateway);
    caixaService = module.get(CaixaService);
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
    it('deve criar comanda com mesa', async () => {
      const createDto = { mesaId: mockMesa.id, clienteId: mockCliente.id };

      mockTransactionManager.findOne
        .mockResolvedValueOnce({ ...mockMesa, status: MesaStatus.LIVRE }) // Mesa
        .mockResolvedValueOnce(mockCliente) // Cliente
        .mockResolvedValueOnce(null); // Comanda aberta existente

      mockTransactionManager.create.mockReturnValue(mockComanda);
      mockTransactionManager.save.mockResolvedValue(mockComanda);
      mockComandaRepository.findOne.mockResolvedValue(mockComanda);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockComandaRepository.manager.transaction).toHaveBeenCalled();
    });

    it('deve lançar erro se mesa E ponto de entrega forem informados', async () => {
      const createDto = {
        mesaId: mockMesa.id,
        pontoEntregaId: mockPontoEntrega.id,
        clienteId: mockCliente.id,
      };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'A comanda não pode ter mesa E ponto de entrega ao mesmo tempo.',
      );
    });

    it('deve lançar erro se não tiver mesa nem cliente', async () => {
      const createDto = { pontoEntregaId: mockPontoEntrega.id };

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Comandas sem mesa precisam estar associadas a um cliente.',
      );
    });

    it('deve lançar erro se mesa não existir', async () => {
      const createDto = { mesaId: 'mesa-inexistente', clienteId: mockCliente.id };

      mockTransactionManager.findOne.mockResolvedValueOnce(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se mesa já estiver ocupada', async () => {
      const createDto = { mesaId: mockMesa.id };

      mockTransactionManager.findOne.mockResolvedValueOnce({
        ...mockMesa,
        status: MesaStatus.OCUPADA,
      });

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar erro se cliente já tiver comanda aberta', async () => {
      const createDto = { mesaId: mockMesa.id, clienteId: mockCliente.id };

      // Resetar mocks para este teste específico
      mockTransactionManager.findOne.mockReset();
      mockTransactionManager.findOne
        .mockResolvedValueOnce({ ...mockMesa, status: MesaStatus.LIVRE }) // Mesa
        .mockResolvedValueOnce(mockCliente) // Cliente
        .mockResolvedValueOnce({ id: 'comanda-existente' }); // Comanda aberta existente

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );

      // Resetar novamente para segunda verificação
      mockTransactionManager.findOne.mockReset();
      mockTransactionManager.findOne
        .mockResolvedValueOnce({ ...mockMesa, status: MesaStatus.LIVRE })
        .mockResolvedValueOnce(mockCliente)
        .mockResolvedValueOnce({ id: 'comanda-existente' });

      await expect(service.create(createDto)).rejects.toThrow(
        /já possui uma comanda aberta/,
      );
    });
  });

  // ============================================
  // TESTES: findAll()
  // ============================================
  describe('findAll', () => {
    it('deve retornar lista paginada de comandas', async () => {
      mockComandaRepository.findAndCount.mockResolvedValue([[mockComanda], 1]);

      const result = await service.findAll();

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(mockComandaRepository.findAndCount).toHaveBeenCalled();
    });

    it('deve retornar lista vazia se não houver comandas', async () => {
      mockComandaRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll();

      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });
  });

  // ============================================
  // TESTES: findOne()
  // ============================================
  describe('findOne', () => {
    it('deve retornar comanda por ID', async () => {
      const comandaComPedidos = {
        ...mockComanda,
        pedidos: [mockPedido],
      };
      mockComandaRepository.findOne.mockResolvedValue(comandaComPedidos);

      const result = await service.findOne(mockComanda.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockComanda.id);
    });

    it('deve lançar NotFoundException se comanda não existir', async () => {
      mockComandaRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('id-invalido')).rejects.toThrow(
        'Comanda com ID "id-invalido" não encontrada.',
      );
    });

    it('deve calcular total da comanda corretamente', async () => {
      const comandaComPedidos = {
        ...mockComanda,
        pedidos: [
          {
            ...mockPedido,
            itens: [
              { quantidade: 2, precoUnitario: 25.0, status: PedidoStatus.FEITO },
              { quantidade: 1, precoUnitario: 30.0, status: PedidoStatus.FEITO },
            ],
          },
        ],
      };
      mockComandaRepository.findOne.mockResolvedValue(comandaComPedidos);

      const result = await service.findOne(mockComanda.id);

      expect((result as any).total).toBe(80); // 2*25 + 1*30
    });

    it('deve ignorar itens cancelados no cálculo do total', async () => {
      const comandaComPedidos = {
        ...mockComanda,
        pedidos: [
          {
            ...mockPedido,
            itens: [
              { quantidade: 2, precoUnitario: 25.0, status: PedidoStatus.FEITO },
              { quantidade: 1, precoUnitario: 100.0, status: PedidoStatus.CANCELADO },
            ],
          },
        ],
      };
      mockComandaRepository.findOne.mockResolvedValue(comandaComPedidos);

      const result = await service.findOne(mockComanda.id);

      expect((result as any).total).toBe(50); // Apenas 2*25, ignora cancelado
    });
  });

  // ============================================
  // TESTES: fecharComanda()
  // ============================================
  describe('fecharComanda', () => {
    const fecharDto = { formaPagamento: FormaPagamento.PIX };

    it('deve fechar comanda com sucesso', async () => {
      const comandaAberta = {
        ...mockComanda,
        status: ComandaStatus.ABERTA,
        pedidos: [mockPedido],
      };

      mockComandaRepository.findOne.mockResolvedValue(comandaAberta);
      mockCaixaService.getCaixaAbertoAtual.mockResolvedValue(mockCaixaAberto);
      mockCaixaService.registrarVenda.mockResolvedValue({});
      mockComandaRepository.save.mockResolvedValue({
        ...comandaAberta,
        status: ComandaStatus.FECHADA,
      });

      const result = await service.fecharComanda(mockComanda.id, fecharDto);

      expect(result.status).toBe(ComandaStatus.FECHADA);
      expect(mockCaixaService.registrarVenda).toHaveBeenCalled();
      expect(mockPedidosGateway.emitComandaAtualizada).toHaveBeenCalled();
    });

    it('deve liberar mesa ao fechar comanda', async () => {
      const comandaComMesa = {
        ...mockComanda,
        status: ComandaStatus.ABERTA,
        mesa: { ...mockMesa, status: MesaStatus.OCUPADA },
        pedidos: [mockPedido],
      };

      mockComandaRepository.findOne.mockResolvedValue(comandaComMesa);
      mockCaixaService.getCaixaAbertoAtual.mockResolvedValue(mockCaixaAberto);
      mockCaixaService.registrarVenda.mockResolvedValue({});
      mockMesaRepository.save.mockResolvedValue({
        ...mockMesa,
        status: MesaStatus.LIVRE,
      });
      mockComandaRepository.save.mockResolvedValue({
        ...comandaComMesa,
        status: ComandaStatus.FECHADA,
      });

      await service.fecharComanda(mockComanda.id, fecharDto);

      expect(mockMesaRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: MesaStatus.LIVRE }),
      );
    });

    it('deve lançar erro se comanda não existir', async () => {
      mockComandaRepository.findOne.mockResolvedValue(null);

      await expect(
        service.fecharComanda('id-invalido', fecharDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se comanda já estiver fechada', async () => {
      mockComandaRepository.findOne.mockResolvedValue({
        ...mockComanda,
        status: ComandaStatus.FECHADA,
      });

      await expect(
        service.fecharComanda(mockComanda.id, fecharDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.fecharComanda(mockComanda.id, fecharDto),
      ).rejects.toThrow('Apenas comandas com status ABERTA podem ser fechadas.');
    });

    it('deve lançar erro se não houver caixa aberto', async () => {
      mockComandaRepository.findOne.mockResolvedValue({
        ...mockComanda,
        status: ComandaStatus.ABERTA,
        pedidos: [mockPedido],
      });
      mockCaixaService.getCaixaAbertoAtual.mockResolvedValue(null);

      await expect(
        service.fecharComanda(mockComanda.id, fecharDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.fecharComanda(mockComanda.id, fecharDto),
      ).rejects.toThrow(/Não há caixa aberto/);
    });

    it('deve validar valor pago para pagamento em DINHEIRO', async () => {
      const dtoDinheiro = {
        formaPagamento: FormaPagamento.DINHEIRO,
        valorPago: 30, // Menor que o total
      };

      mockComandaRepository.findOne.mockResolvedValue({
        ...mockComanda,
        status: ComandaStatus.ABERTA,
        pedidos: [mockPedido], // Total = 50
      });
      mockCaixaService.getCaixaAbertoAtual.mockResolvedValue(mockCaixaAberto);

      await expect(
        service.fecharComanda(mockComanda.id, dtoDinheiro),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.fecharComanda(mockComanda.id, dtoDinheiro),
      ).rejects.toThrow(/Valor pago.*é menor que o total/);
    });

    it('deve exigir valor pago para pagamento em DINHEIRO', async () => {
      const dtoDinheiro = { formaPagamento: FormaPagamento.DINHEIRO };

      mockComandaRepository.findOne.mockResolvedValue({
        ...mockComanda,
        status: ComandaStatus.ABERTA,
        pedidos: [mockPedido],
      });
      mockCaixaService.getCaixaAbertoAtual.mockResolvedValue(mockCaixaAberto);

      await expect(
        service.fecharComanda(mockComanda.id, dtoDinheiro),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.fecharComanda(mockComanda.id, dtoDinheiro),
      ).rejects.toThrow(/Valor pago é obrigatório/);
    });
  });

  // ============================================
  // TESTES: update()
  // ============================================
  describe('update', () => {
    it('deve atualizar comanda', async () => {
      const updateDto = { status: ComandaStatus.FECHADA };
      mockComandaRepository.preload.mockResolvedValue({
        ...mockComanda,
        ...updateDto,
      });
      mockComandaRepository.save.mockResolvedValue({
        ...mockComanda,
        ...updateDto,
      });

      const result = await service.update(mockComanda.id, updateDto);

      expect(result.status).toBe(ComandaStatus.FECHADA);
      expect(mockPedidosGateway.emitComandaAtualizada).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se comanda não existir', async () => {
      mockComandaRepository.preload.mockResolvedValue(null);

      await expect(service.update('id-invalido', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // TESTES: remove()
  // ============================================
  describe('remove', () => {
    it('deve remover comanda', async () => {
      mockComandaRepository.findOne.mockResolvedValue(mockComanda);
      mockComandaRepository.remove.mockResolvedValue(mockComanda);

      await expect(service.remove(mockComanda.id)).resolves.not.toThrow();
      expect(mockComandaRepository.remove).toHaveBeenCalledWith(mockComanda);
    });

    it('deve lançar NotFoundException se comanda não existir', async () => {
      mockComandaRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // TESTES: updateLocal()
  // ============================================
  describe('updateLocal', () => {
    it('deve vincular comanda a uma mesa', async () => {
      mockComandaRepository.rawRepository.findOne.mockResolvedValue({
        ...mockComanda,
        status: ComandaStatus.ABERTA,
      });
      mockMesaRepository.rawRepository.findOne.mockResolvedValue(mockMesa);
      mockComandaRepository.rawRepository.save.mockResolvedValue({
        ...mockComanda,
        mesa: mockMesa,
        pontoEntrega: null,
      });

      const result = await service.updateLocal(mockComanda.id, {
        mesaId: mockMesa.id,
      });

      expect(result.mesa).toBeDefined();
      expect(mockPedidosGateway.emitComandaAtualizada).toHaveBeenCalled();
    });

    it('deve vincular comanda a um ponto de entrega', async () => {
      mockComandaRepository.rawRepository.findOne.mockResolvedValue({
        ...mockComanda,
        status: ComandaStatus.ABERTA,
      });
      mockPontoEntregaRepository.rawRepository.findOne.mockResolvedValue(mockPontoEntrega);
      mockComandaRepository.rawRepository.save.mockResolvedValue({
        ...mockComanda,
        mesa: null,
        pontoEntrega: mockPontoEntrega,
      });

      const result = await service.updateLocal(mockComanda.id, {
        pontoEntregaId: mockPontoEntrega.id,
      });

      expect(result.pontoEntrega).toBeDefined();
    });

    it('deve lançar erro se comanda não estiver aberta', async () => {
      mockComandaRepository.rawRepository.findOne.mockResolvedValue({
        ...mockComanda,
        status: ComandaStatus.FECHADA,
      });

      await expect(
        service.updateLocal(mockComanda.id, { mesaId: mockMesa.id }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateLocal(mockComanda.id, { mesaId: mockMesa.id }),
      ).rejects.toThrow('Apenas comandas abertas podem ter o local alterado.');
    });

    it('deve lançar erro se ponto de entrega estiver desativado', async () => {
      mockComandaRepository.rawRepository.findOne.mockResolvedValue({
        ...mockComanda,
        status: ComandaStatus.ABERTA,
      });
      mockPontoEntregaRepository.rawRepository.findOne.mockResolvedValue({
        ...mockPontoEntrega,
        ativo: false,
      });

      await expect(
        service.updateLocal(mockComanda.id, {
          pontoEntregaId: mockPontoEntrega.id,
        }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateLocal(mockComanda.id, {
          pontoEntregaId: mockPontoEntrega.id,
        }),
      ).rejects.toThrow(/está desativado/);
    });
  });

  // ============================================
  // TESTES: search()
  // ============================================
  describe('search', () => {
    it('deve buscar comandas por termo', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockComanda]),
      };
      mockComandaRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.search('João');

      expect(result).toHaveLength(1);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('deve retornar comandas abertas sem filtro', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockComanda]),
      };
      mockComandaRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.search('');

      expect(result).toHaveLength(1);
    });
  });
});
