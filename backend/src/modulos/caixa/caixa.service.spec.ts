import { Test, TestingModule } from '@nestjs/testing';
import { CaixaService } from './caixa.service';
import { AberturaCaixaRepository } from './repositories/abertura-caixa.repository';
import { FechamentoCaixaRepository } from './repositories/fechamento-caixa.repository';
import { SangriaRepository } from './repositories/sangria.repository';
import { MovimentacaoCaixaRepository } from './repositories/movimentacao-caixa.repository';
import { TurnoRepository } from '../turno/turno.repository';
import { PedidosGateway } from '../pedido/pedidos.gateway';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CaixaService', () => {
  let service: CaixaService;
  let aberturaCaixaRepository: any;
  let fechamentoCaixaRepository: any;
  let sangriaRepository: any;
  let movimentacaoCaixaRepository: any;

  const mockAberturaCaixaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockFechamentoCaixaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockSangriaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockMovimentacaoCaixaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockTurnoRepository = {
    findOne: jest.fn(),
  };

  const mockPedidosGateway = {
    emitCaixaAtualizado: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaixaService,
        {
          provide: AberturaCaixaRepository,
          useValue: mockAberturaCaixaRepository,
        },
        {
          provide: FechamentoCaixaRepository,
          useValue: mockFechamentoCaixaRepository,
        },
        {
          provide: SangriaRepository,
          useValue: mockSangriaRepository,
        },
        {
          provide: MovimentacaoCaixaRepository,
          useValue: mockMovimentacaoCaixaRepository,
        },
        {
          provide: TurnoRepository,
          useValue: mockTurnoRepository,
        },
        {
          provide: PedidosGateway,
          useValue: mockPedidosGateway,
        },
      ],
    }).compile();

    service = await module.resolve<CaixaService>(CaixaService);
    aberturaCaixaRepository = module.get(AberturaCaixaRepository);
    fechamentoCaixaRepository = module.get(FechamentoCaixaRepository);
    sangriaRepository = module.get(SangriaRepository);
    movimentacaoCaixaRepository = module.get(MovimentacaoCaixaRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('abrirCaixa', () => {
    const mockTurno = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      funcionarioId: 'func-uuid-1',
      ativo: true,
      checkOut: null,
      funcionario: { nome: 'João' },
    };

    it('deve abrir um caixa com valor inicial', async () => {
      const dto = {
        turnoFuncionarioId: mockTurno.id,
        valorInicial: 100,
        observacao: 'Abertura do turno da manhã',
      };

      const mockAbertura = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        ...dto,
        status: 'ABERTO',
        dataAbertura: new Date(),
      };

      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);
      mockAberturaCaixaRepository.findOne.mockResolvedValue(null);
      mockAberturaCaixaRepository.create.mockReturnValue(mockAbertura);
      mockAberturaCaixaRepository.save.mockResolvedValue(mockAbertura);
      mockMovimentacaoCaixaRepository.create.mockReturnValue({});
      mockMovimentacaoCaixaRepository.save.mockResolvedValue({});

      const result = await service.abrirCaixa(dto);

      expect(result).toBeDefined();
      expect(result.valorInicial).toBe(100);
      expect(result.status).toBe('ABERTO');
    });

    it('deve lançar erro se turno não encontrado', async () => {
      const dto = {
        turnoFuncionarioId: 'turno-invalido',
        valorInicial: 100,
      };

      mockTurnoRepository.findOne.mockResolvedValue(null);

      await expect(service.abrirCaixa(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar erro se já existe caixa aberto para o turno', async () => {
      const dto = {
        turnoFuncionarioId: mockTurno.id,
        valorInicial: 100,
      };

      mockTurnoRepository.findOne.mockResolvedValue(mockTurno);
      mockAberturaCaixaRepository.findOne.mockResolvedValue({
        id: 'existing-id',
        status: 'ABERTO',
      });

      await expect(service.abrirCaixa(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('fecharCaixa', () => {
    it('deve calcular diferenças corretamente', async () => {
      const dto = {
        aberturaCaixaId: '123e4567-e89b-12d3-a456-426614174000',
        valorInformadoDinheiro: 835,
        valorInformadoPix: 450,
        valorInformadoDebito: 200,
        valorInformadoCredito: 300,
        valorInformadoValeRefeicao: 150,
        valorInformadoValeAlimentacao: 100,
      };

      const mockAbertura = {
        id: dto.aberturaCaixaId,
        valorInicial: 100,
        status: 'ABERTO',
      };

      const mockMovimentacoes = [
        { formaPagamento: 'DINHEIRO', valor: 850 },
        { formaPagamento: 'PIX', valor: 450 },
        { formaPagamento: 'DEBITO', valor: 200 },
        { formaPagamento: 'CREDITO', valor: 300 },
        { formaPagamento: 'VALE_REFEICAO', valor: 150 },
        { formaPagamento: 'VALE_ALIMENTACAO', valor: 100 },
      ];

      const mockSangrias = [];

      mockAberturaCaixaRepository.findOne.mockResolvedValue(mockAbertura);
      mockMovimentacaoCaixaRepository.find.mockResolvedValue(mockMovimentacoes);
      mockSangriaRepository.find.mockResolvedValue(mockSangrias);

      const mockFechamento = {
        id: 'fechamento-id',
        ...dto,
        diferencaDinheiro: -15, // 835 - 850
        diferencaPix: 0,
        diferencaDebito: 0,
        diferencaCredito: 0,
        diferencaValeRefeicao: 0,
        diferencaValeAlimentacao: 0,
        diferencaTotal: -15,
      };

      mockFechamentoCaixaRepository.create.mockReturnValue(mockFechamento);
      mockFechamentoCaixaRepository.save.mockResolvedValue(mockFechamento);
      mockAberturaCaixaRepository.save.mockResolvedValue({
        ...mockAbertura,
        status: 'FECHADO',
      });

      const result = await service.fecharCaixa(dto);

      expect(result).toBeDefined();
      expect(result.diferencaDinheiro).toBe(-15);
      expect(result.diferencaPix).toBe(0);
      expect(result.diferencaTotal).toBe(-15);
      expect(mockAberturaCaixaRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FECHADO' }),
      );
    });

    it('deve lançar erro se caixa não encontrado', async () => {
      const dto = {
        aberturaCaixaId: 'invalid-id',
        valorInformadoDinheiro: 0,
        valorInformadoPix: 0,
        valorInformadoDebito: 0,
        valorInformadoCredito: 0,
        valorInformadoValeRefeicao: 0,
        valorInformadoValeAlimentacao: 0,
      };

      mockAberturaCaixaRepository.findOne.mockResolvedValue(null);

      await expect(service.fecharCaixa(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar erro se caixa já está fechado', async () => {
      const dto = {
        aberturaCaixaId: '123e4567-e89b-12d3-a456-426614174000',
        valorInformadoDinheiro: 0,
        valorInformadoPix: 0,
        valorInformadoDebito: 0,
        valorInformadoCredito: 0,
        valorInformadoValeRefeicao: 0,
        valorInformadoValeAlimentacao: 0,
      };

      mockAberturaCaixaRepository.findOne.mockResolvedValue({
        id: dto.aberturaCaixaId,
        status: 'FECHADO',
      });

      await expect(service.fecharCaixa(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('registrarSangria', () => {
    it('deve registrar uma sangria corretamente', async () => {
      const dto = {
        aberturaCaixaId: '123e4567-e89b-12d3-a456-426614174000',
        valor: 500,
        motivo: 'Pagamento de fornecedor',
        autorizadoPor: 'João Silva - Gerente',
      };

      const mockAbertura = {
        id: dto.aberturaCaixaId,
        status: 'ABERTO',
      };

      const mockSangria = {
        id: 'sangria-id',
        ...dto,
        dataSangria: new Date(),
      };

      mockAberturaCaixaRepository.findOne.mockResolvedValue(mockAbertura);
      mockSangriaRepository.create.mockReturnValue(mockSangria);
      mockSangriaRepository.save.mockResolvedValue(mockSangria);

      const result = await service.registrarSangria(dto);

      expect(result).toBeDefined();
      expect(result.valor).toBe(500);
      expect(result.motivo).toBe('Pagamento de fornecedor');
      expect(mockSangriaRepository.save).toHaveBeenCalled();
    });

    it('deve lançar erro se caixa não está aberto', async () => {
      const dto = {
        aberturaCaixaId: '123e4567-e89b-12d3-a456-426614174000',
        valor: 500,
        motivo: 'Pagamento de fornecedor',
      };

      mockAberturaCaixaRepository.findOne.mockResolvedValue({
        id: dto.aberturaCaixaId,
        status: 'FECHADO',
      });

      await expect(service.registrarSangria(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('registrarVenda', () => {
    it('deve registrar uma venda e criar movimentação', async () => {
      const dto = {
        aberturaCaixaId: '123e4567-e89b-12d3-a456-426614174000',
        valor: 125.5,
        formaPagamento: 'PIX' as any,
        comandaId: '123e4567-e89b-12d3-a456-426614174001',
        comandaNumero: 'CMD-001',
      };

      const mockAbertura = {
        id: dto.aberturaCaixaId,
        status: 'ABERTO',
      };

      const mockMovimentacao = {
        id: 'movimentacao-id',
        ...dto,
        dataMovimentacao: new Date(),
      };

      mockAberturaCaixaRepository.findOne.mockResolvedValue(mockAbertura);
      mockMovimentacaoCaixaRepository.create.mockReturnValue(mockMovimentacao);
      mockMovimentacaoCaixaRepository.save.mockResolvedValue(mockMovimentacao);

      const result = await service.registrarVenda(dto);

      expect(result).toBeDefined();
      expect(result.valor).toBe(125.5);
      expect(result.formaPagamento).toBe('PIX');
      expect(mockMovimentacaoCaixaRepository.save).toHaveBeenCalled();
    });
  });

  describe('getCaixaAberto', () => {
    it('deve retornar caixa aberto por turno', async () => {
      const turnoId = '123e4567-e89b-12d3-a456-426614174000';

      const mockCaixa = {
        id: 'caixa-id',
        turnoFuncionarioId: turnoId,
        status: 'ABERTO',
        valorInicial: 100,
      };

      mockAberturaCaixaRepository.findOne.mockResolvedValue(mockCaixa);

      const result = await service.getCaixaAberto(turnoId);

      expect(result).toBeDefined();
      expect(result.turnoFuncionarioId).toBe(turnoId);
      expect(result.status).toBe('ABERTO');
    });

    it('deve retornar null se caixa não encontrado', async () => {
      const turnoId = 'invalid-id';

      mockAberturaCaixaRepository.findOne.mockResolvedValue(null);

      const result = await service.getCaixaAberto(turnoId);

      expect(result).toBeNull();
    });
  });

  describe('getResumoCaixa', () => {
    it('deve retornar resumo completo do caixa', async () => {
      const aberturaCaixaId = '123e4567-e89b-12d3-a456-426614174000';

      const mockAbertura = {
        id: aberturaCaixaId,
        valorInicial: 100,
        status: 'ABERTO',
      };

      const mockMovimentacoes = [
        { formaPagamento: 'DINHEIRO', valor: 50, tipo: 'VENDA' },
        { formaPagamento: 'PIX', valor: 100, tipo: 'VENDA' },
      ];

      const mockSangrias = [{ valor: 200, motivo: 'Teste' }];

      mockAberturaCaixaRepository.findOne.mockResolvedValue(mockAbertura);
      mockMovimentacaoCaixaRepository.find.mockResolvedValue(mockMovimentacoes);
      mockSangriaRepository.find.mockResolvedValue(mockSangrias);
      mockFechamentoCaixaRepository.findOne.mockResolvedValue(null);

      const result = await service.getResumoCaixa(aberturaCaixaId);

      expect(result).toBeDefined();
      expect(result.abertura).toBeDefined();
      expect(result.movimentacoes).toHaveLength(2);
      expect(result.sangrias).toHaveLength(1);
      expect(result.totalSangrias).toBe(200);
    });
  });
});
