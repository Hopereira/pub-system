import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Scope,
} from '@nestjs/common';
import { AberturaCaixa, StatusCaixa } from './entities/abertura-caixa.entity';
import { FechamentoCaixa } from './entities/fechamento-caixa.entity';
import { Sangria } from './entities/sangria.entity';
import {
  MovimentacaoCaixa,
  TipoMovimentacao,
  FormaPagamento,
} from './entities/movimentacao-caixa.entity';
import { CreateAberturaCaixaDto } from './dto/create-abertura-caixa.dto';
import { CreateFechamentoCaixaDto } from './dto/create-fechamento-caixa.dto';
import { CreateSangriaDto } from './dto/create-sangria.dto';
import { CreateVendaDto } from './dto/create-venda.dto';
import { PedidosGateway } from '../pedido/pedidos.gateway';
import { AberturaCaixaRepository } from './repositories/abertura-caixa.repository';
import { FechamentoCaixaRepository } from './repositories/fechamento-caixa.repository';
import { SangriaRepository } from './repositories/sangria.repository';
import { MovimentacaoCaixaRepository } from './repositories/movimentacao-caixa.repository';
import { TurnoRepository } from '../turno/turno.repository';

@Injectable({ scope: Scope.REQUEST })
export class CaixaService {
  private readonly logger = new Logger(CaixaService.name);

  constructor(
    private aberturaRepository: AberturaCaixaRepository,
    private fechamentoRepository: FechamentoCaixaRepository,
    private sangriaRepository: SangriaRepository,
    private movimentacaoRepository: MovimentacaoCaixaRepository,
    private turnoRepository: TurnoRepository,
    private pedidosGateway: PedidosGateway,
  ) {}

  /**
   * Abre um novo caixa
   */
  async abrirCaixa(dto: CreateAberturaCaixaDto): Promise<AberturaCaixa> {
    // Verifica se turno existe e está ativo
    const turno = await this.turnoRepository.findOne({
      where: { id: dto.turnoFuncionarioId },
    });

    if (!turno) {
      throw new NotFoundException('Turno não encontrado');
    }

    if (!turno.ativo || turno.checkOut) {
      throw new BadRequestException('Turno não está ativo');
    }

    // Verifica se já existe caixa aberto para este turno
    const caixaAberto = await this.aberturaRepository.findOne({
      where: {
        turnoFuncionarioId: dto.turnoFuncionarioId,
        status: StatusCaixa.ABERTO,
      },
    });

    if (caixaAberto) {
      throw new BadRequestException(
        'Já existe um caixa aberto para este turno',
      );
    }

    // Cria abertura de caixa
    const abertura = this.aberturaRepository.create({
      turnoFuncionarioId: dto.turnoFuncionarioId,
      funcionarioId: turno.funcionarioId,
      dataAbertura: new Date(),
      horaAbertura: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
      valorInicial: dto.valorInicial,
      observacao: dto.observacao,
      status: StatusCaixa.ABERTO,
    });

    const aberturaSalva = await this.aberturaRepository.save(abertura);

    // Registra movimentação de abertura
    await this.registrarMovimentacao({
      aberturaCaixaId: aberturaSalva.id,
      tipo: TipoMovimentacao.ABERTURA,
      valor: dto.valorInicial,
      descricao: `Abertura de caixa - Valor inicial: R$ ${dto.valorInicial.toFixed(2)}`,
      funcionarioId: turno.funcionarioId,
    });

    this.logger.log(
      `💰 Caixa aberto | Funcionário: ${turno.funcionario.nome} | Valor inicial: R$ ${dto.valorInicial.toFixed(2)}`,
    );

    return aberturaSalva;
  }

  /**
   * Fecha o caixa com conferência de valores
   */
  async fecharCaixa(dto: CreateFechamentoCaixaDto): Promise<FechamentoCaixa> {
    // Busca abertura de caixa
    const abertura = await this.aberturaRepository.findOne({
      where: { id: dto.aberturaCaixaId },
    });

    if (!abertura) {
      throw new NotFoundException('Abertura de caixa não encontrada');
    }

    if (abertura.status !== StatusCaixa.ABERTO) {
      throw new BadRequestException('Caixa não está aberto');
    }

    // Calcula valores esperados por forma de pagamento
    const movimentacoes = await this.movimentacaoRepository.find({
      where: { aberturaCaixaId: abertura.id, tipo: TipoMovimentacao.VENDA },
    });

    // Busca sangrias
    const sangrias = await this.sangriaRepository.find({
      where: { aberturaCaixaId: abertura.id },
    });

    // Validação: Não permite fechar caixa sem nenhuma movimentação
    // (exceto se forçar fechamento via flag)
    if (movimentacoes.length === 0 && sangrias.length === 0 && !dto.forcarFechamento) {
      throw new BadRequestException(
        'Não é possível fechar o caixa sem movimentações. ' +
        'Se deseja fechar mesmo assim, marque a opção "Forçar fechamento".'
      );
    }

    const valoresEsperados = this.calcularValoresEsperados(movimentacoes);

    const totalSangrias = sangrias.reduce((acc, s) => acc + Number(s.valor), 0);

    // Calcula valores informados
    const valorInformadoTotal =
      Number(dto.valorInformadoDinheiro) +
      Number(dto.valorInformadoPix) +
      Number(dto.valorInformadoDebito) +
      Number(dto.valorInformadoCredito) +
      Number(dto.valorInformadoValeRefeicao) +
      Number(dto.valorInformadoValeAlimentacao);

    // Calcula diferenças
    const diferencaDinheiro =
      Number(dto.valorInformadoDinheiro) - valoresEsperados.dinheiro;
    const diferencaPix = Number(dto.valorInformadoPix) - valoresEsperados.pix;
    const diferencaDebito =
      Number(dto.valorInformadoDebito) - valoresEsperados.debito;
    const diferencaCredito =
      Number(dto.valorInformadoCredito) - valoresEsperados.credito;
    const diferencaValeRefeicao =
      Number(dto.valorInformadoValeRefeicao) - valoresEsperados.valeRefeicao;
    const diferencaValeAlimentacao =
      Number(dto.valorInformadoValeAlimentacao) -
      valoresEsperados.valeAlimentacao;
    const diferencaTotal = valorInformadoTotal - valoresEsperados.total;

    // Calcula estatísticas
    const vendas = movimentacoes.length;
    const totalVendas = valoresEsperados.total;
    const ticketMedio = vendas > 0 ? totalVendas / vendas : 0;

    // Cria fechamento
    const fechamento = this.fechamentoRepository.create({
      aberturaCaixaId: abertura.id,
      turnoFuncionarioId: abertura.turnoFuncionarioId,
      funcionarioId: abertura.funcionarioId,
      dataFechamento: new Date(),
      horaFechamento: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
      // Valores esperados
      valorEsperadoDinheiro: valoresEsperados.dinheiro,
      valorEsperadoPix: valoresEsperados.pix,
      valorEsperadoDebito: valoresEsperados.debito,
      valorEsperadoCredito: valoresEsperados.credito,
      valorEsperadoValeRefeicao: valoresEsperados.valeRefeicao,
      valorEsperadoValeAlimentacao: valoresEsperados.valeAlimentacao,
      valorEsperadoTotal: valoresEsperados.total,
      // Valores informados
      valorInformadoDinheiro: dto.valorInformadoDinheiro,
      valorInformadoPix: dto.valorInformadoPix,
      valorInformadoDebito: dto.valorInformadoDebito,
      valorInformadoCredito: dto.valorInformadoCredito,
      valorInformadoValeRefeicao: dto.valorInformadoValeRefeicao,
      valorInformadoValeAlimentacao: dto.valorInformadoValeAlimentacao,
      valorInformadoTotal: valorInformadoTotal,
      // Diferenças
      diferencaDinheiro,
      diferencaPix,
      diferencaDebito,
      diferencaCredito,
      diferencaValeRefeicao,
      diferencaValeAlimentacao,
      diferencaTotal,
      // Estatísticas
      totalSangrias,
      quantidadeSangrias: sangrias.length,
      quantidadeVendas: vendas,
      quantidadeComandasFechadas: vendas, // TODO: Ajustar quando integrar com comandas
      ticketMedio,
      observacao: dto.observacao,
      status: StatusCaixa.FECHADO,
    });

    const fechamentoSalvo = await this.fechamentoRepository.save(fechamento);

    // Atualiza status da abertura
    abertura.status = StatusCaixa.FECHADO;
    await this.aberturaRepository.save(abertura);

    // Registra movimentação de fechamento
    await this.registrarMovimentacao({
      aberturaCaixaId: abertura.id,
      tipo: TipoMovimentacao.FECHAMENTO,
      valor: valorInformadoTotal,
      descricao: `Fechamento de caixa - Diferença: R$ ${diferencaTotal.toFixed(2)}`,
      funcionarioId: abertura.funcionarioId,
    });

    this.logger.log(
      `🔐 Caixa fechado | Total: R$ ${valorInformadoTotal.toFixed(2)} | Diferença: R$ ${diferencaTotal.toFixed(2)}`,
    );

    return fechamentoSalvo;
  }

  /**
   * Registra uma sangria
   */
  async registrarSangria(dto: CreateSangriaDto): Promise<Sangria> {
    // Busca abertura de caixa
    const abertura = await this.aberturaRepository.findOne({
      where: { id: dto.aberturaCaixaId },
    });

    if (!abertura) {
      throw new NotFoundException('Abertura de caixa não encontrada');
    }

    if (abertura.status !== StatusCaixa.ABERTO) {
      throw new BadRequestException('Caixa não está aberto');
    }

    // Valida se valor da sangria não excede o saldo disponível
    const saldoAtual = await this.calcularSaldoAtual(abertura.id);

    if (dto.valor > saldoAtual) {
      throw new BadRequestException(
        `Valor da sangria (R$ ${dto.valor.toFixed(2)}) excede o saldo disponível (R$ ${saldoAtual.toFixed(2)})`,
      );
    }

    // Cria sangria
    const sangria = this.sangriaRepository.create({
      aberturaCaixaId: dto.aberturaCaixaId,
      turnoFuncionarioId: abertura.turnoFuncionarioId,
      funcionarioId: abertura.funcionarioId,
      dataSangria: new Date(),
      horaSangria: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
      valor: dto.valor,
      motivo: dto.motivo,
      observacao: dto.observacao,
      autorizadoPor: dto.autorizadoPor,
    });

    const sangriaSalva = await this.sangriaRepository.save(sangria);

    // Registra movimentação
    await this.registrarMovimentacao({
      aberturaCaixaId: abertura.id,
      tipo: TipoMovimentacao.SANGRIA,
      valor: dto.valor,
      descricao: `Sangria: ${dto.motivo}`,
      funcionarioId: abertura.funcionarioId,
    });

    this.logger.log(
      `💸 Sangria registrada | Valor: R$ ${dto.valor.toFixed(2)} | Motivo: ${dto.motivo}`,
    );

    // Emitir evento WebSocket para atualizar caixa em tempo real
    this.pedidosGateway.emitCaixaAtualizado(abertura.id);

    return sangriaSalva;
  }

  /**
   * Registra um suprimento (entrada de dinheiro no caixa)
   */
  async registrarSuprimento(dto: {
    aberturaCaixaId: string;
    valor: number;
    motivo?: string;
  }): Promise<MovimentacaoCaixa> {
    const abertura = await this.aberturaRepository.findOne({
      where: { id: dto.aberturaCaixaId },
    });

    if (!abertura) {
      throw new NotFoundException('Abertura de caixa não encontrada');
    }

    if (abertura.status !== StatusCaixa.ABERTO) {
      throw new BadRequestException('Caixa não está aberto');
    }

    // Registra movimentação de suprimento
    const movimentacao = await this.registrarMovimentacao({
      aberturaCaixaId: abertura.id,
      tipo: TipoMovimentacao.SUPRIMENTO,
      formaPagamento: FormaPagamento.DINHEIRO,
      valor: dto.valor,
      descricao: dto.motivo || 'Suprimento de caixa',
      funcionarioId: abertura.funcionarioId,
    });

    this.logger.log(
      `💵 Suprimento registrado | Valor: R$ ${dto.valor.toFixed(2)} | Motivo: ${dto.motivo || 'Não informado'}`,
    );

    // Emitir evento WebSocket para atualizar caixa em tempo real
    this.pedidosGateway.emitCaixaAtualizado(abertura.id);

    return movimentacao;
  }

  /**
   * Registra uma venda (fechamento de comanda)
   */
  async registrarVenda(dto: CreateVendaDto): Promise<MovimentacaoCaixa> {
    // Busca abertura de caixa
    const abertura = await this.aberturaRepository.findOne({
      where: { id: dto.aberturaCaixaId },
    });

    if (!abertura) {
      throw new NotFoundException('Abertura de caixa não encontrada');
    }

    if (abertura.status !== StatusCaixa.ABERTO) {
      throw new BadRequestException('Caixa não está aberto');
    }

    // Mapeia forma de pagamento do DTO para a entidade
    const formaPagamentoMap: Record<string, FormaPagamento> = {
      DINHEIRO: FormaPagamento.DINHEIRO,
      PIX: FormaPagamento.PIX,
      DEBITO: FormaPagamento.DEBITO,
      CREDITO: FormaPagamento.CREDITO,
      VALE_REFEICAO: FormaPagamento.VALE_REFEICAO,
      VALE_ALIMENTACAO: FormaPagamento.VALE_ALIMENTACAO,
    };

    const formaPagamento = formaPagamentoMap[dto.formaPagamento];

    if (!formaPagamento) {
      throw new BadRequestException('Forma de pagamento inválida');
    }

    // Registra movimentação de venda
    const movimentacao = await this.registrarMovimentacao({
      aberturaCaixaId: abertura.id,
      tipo: TipoMovimentacao.VENDA,
      formaPagamento: formaPagamento,
      valor: dto.valor,
      descricao:
        dto.descricao ||
        `Venda - Comanda ${dto.comandaNumero || dto.comandaId}`,
      funcionarioId: abertura.funcionarioId,
      comandaId: dto.comandaId,
    });

    this.logger.log(
      `💰 Venda registrada | Valor: R$ ${dto.valor.toFixed(2)} | Forma: ${dto.formaPagamento} | Comanda: ${dto.comandaNumero || dto.comandaId}`,
    );

    // Emitir evento WebSocket para atualizar caixa em tempo real
    this.pedidosGateway.emitCaixaAtualizado(abertura.id);

    return movimentacao;
  }

  /**
   * Busca caixa aberto por turno
   */
  async getCaixaAberto(
    turnoFuncionarioId: string,
  ): Promise<AberturaCaixa | null> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(turnoFuncionarioId)) {
      throw new NotFoundException('Caixa não encontrado');
    }
    return await this.aberturaRepository.findOne({
      where: {
        turnoFuncionarioId,
        status: StatusCaixa.ABERTO,
      },
    });
  }

  /**
   * Busca caixa aberto do funcionário específico
   */
  async getCaixaAbertoPorFuncionario(
    funcionarioId: string,
  ): Promise<AberturaCaixa | null> {
    return await this.aberturaRepository.findOne({
      where: {
        funcionarioId,
        status: StatusCaixa.ABERTO,
      },
      order: {
        dataAbertura: 'DESC',
        horaAbertura: 'DESC',
      },
    });
  }

  /**
   * Busca todos os caixas abertos (apenas para admin/gestor)
   */
  async getTodosCaixasAbertos(): Promise<AberturaCaixa[]> {
    return await this.aberturaRepository.find({
      where: {
        status: StatusCaixa.ABERTO,
      },
      order: {
        dataAbertura: 'DESC',
        horaAbertura: 'DESC',
      },
    });
  }

  /**
   * Busca o caixa aberto do funcionário específico (para fechamento de comandas)
   * Cada operador só pode usar seu próprio caixa
   * @param funcionarioId - ID do funcionário logado
   */
  async getCaixaAbertoAtual(funcionarioId: string): Promise<AberturaCaixa | null> {
    if (!funcionarioId) {
      this.logger.warn('⚠️ getCaixaAbertoAtual chamado sem funcionarioId');
      return null;
    }

    return await this.aberturaRepository.findOne({
      where: {
        funcionarioId,
        status: StatusCaixa.ABERTO,
      },
      order: {
        dataAbertura: 'DESC',
        horaAbertura: 'DESC',
      },
    });
  }

  /**
   * Busca resumo do caixa
   */
  async getResumoCaixa(aberturaCaixaId: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(aberturaCaixaId)) {
      throw new NotFoundException('Caixa não encontrado');
    }
    const abertura = await this.aberturaRepository.findOne({
      where: { id: aberturaCaixaId },
    });

    if (!abertura) {
      throw new NotFoundException('Caixa não encontrado');
    }

    const movimentacoes = await this.movimentacaoRepository.find({
      where: { aberturaCaixaId },
    });

    const sangrias = await this.sangriaRepository.find({
      where: { aberturaCaixaId },
    });

    const fechamento = await this.fechamentoRepository.findOne({
      where: { aberturaCaixaId },
    });

    const vendas = movimentacoes.filter(
      (m) => m.tipo === TipoMovimentacao.VENDA,
    );
    const suprimentos = movimentacoes.filter(
      (m) => m.tipo === TipoMovimentacao.SUPRIMENTO || m.tipo === TipoMovimentacao.ABERTURA,
    );
    const totalVendas = vendas.reduce((acc, v) => acc + Number(v.valor), 0);
    const totalSangrias = sangrias.reduce((acc, s) => acc + Number(s.valor), 0);
    const totalSuprimentos = suprimentos.reduce((acc, s) => acc + Number(s.valor), 0);
    const saldoFinal = totalSuprimentos + totalVendas - totalSangrias;

    const resumoPorFormaPagamento = this.agruparPorFormaPagamento(vendas);

    return {
      abertura,
      fechamento,
      movimentacoes,
      sangrias,
      suprimentos,
      resumoPorFormaPagamento,
      totalVendas,
      totalSangrias,
      totalSuprimentos,
      saldoFinal,
    };
  }

  /**
   * Busca histórico de fechamentos
   */
  async getHistoricoFechamentos(params?: {
    funcionarioId?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }) {
    const query = this.fechamentoRepository.createQueryBuilder('fechamento');

    if (params?.funcionarioId) {
      query.andWhere('fechamento.funcionarioId = :funcionarioId', {
        funcionarioId: params.funcionarioId,
      });
    }

    if (params?.dataInicio) {
      query.andWhere('fechamento.dataFechamento >= :dataInicio', {
        dataInicio: params.dataInicio,
      });
    }

    if (params?.dataFim) {
      query.andWhere('fechamento.dataFechamento <= :dataFim', {
        dataFim: params.dataFim,
      });
    }

    query.orderBy('fechamento.dataFechamento', 'DESC');
    query.addOrderBy('fechamento.horaFechamento', 'DESC');

    return await query.getMany();
  }

  /**
   * Relatório consolidado de vendas por caixa (funcionário)
   * Agrupa vendas por funcionário com totais e filtros de período
   * @param funcionarioId - Se informado, filtra apenas vendas deste funcionário
   */
  async getRelatorioVendasPorCaixa(params?: {
    periodo?: 'hoje' | 'semana' | 'mes' | 'personalizado';
    dataInicio?: Date;
    dataFim?: Date;
    funcionarioId?: string;
  }) {
    // Calcula datas baseado no período
    let dataInicio: Date;
    let dataFim: Date = new Date();
    dataFim.setHours(23, 59, 59, 999);

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    switch (params?.periodo) {
      case 'semana':
        // Início da semana (domingo)
        dataInicio = new Date(hoje);
        dataInicio.setDate(hoje.getDate() - hoje.getDay());
        break;
      case 'mes':
        // Início do mês
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        break;
      case 'personalizado':
        dataInicio = params?.dataInicio || hoje;
        dataFim = params?.dataFim || dataFim;
        break;
      case 'hoje':
      default:
        dataInicio = hoje;
        break;
    }

    // Busca todas as movimentações de venda no período
    const query = this.movimentacaoRepository
      .createQueryBuilder('mov')
      .leftJoinAndSelect('mov.funcionario', 'funcionario')
      .leftJoinAndSelect('mov.aberturaCaixa', 'abertura')
      .where('mov.tipo = :tipo', { tipo: TipoMovimentacao.VENDA })
      .andWhere('mov.data >= :dataInicio', { dataInicio })
      .andWhere('mov.data <= :dataFim', { dataFim });

    // Filtro por funcionário específico (para caixas não-admin)
    if (params?.funcionarioId) {
      query.andWhere('mov.funcionarioId = :funcionarioId', {
        funcionarioId: params.funcionarioId,
      });
    }

    const movimentacoes = await query.getMany();

    // Agrupa por funcionário
    const vendasPorFuncionario = new Map<
      string,
      {
        funcionarioId: string;
        funcionarioNome: string;
        totalVendas: number;
        quantidadeVendas: number;
        porFormaPagamento: Record<string, { valor: number; quantidade: number }>;
      }
    >();

    movimentacoes.forEach((mov) => {
      const funcionarioId = mov.funcionarioId;
      const funcionarioNome = mov.funcionario?.nome || 'Não identificado';

      if (!vendasPorFuncionario.has(funcionarioId)) {
        vendasPorFuncionario.set(funcionarioId, {
          funcionarioId,
          funcionarioNome,
          totalVendas: 0,
          quantidadeVendas: 0,
          porFormaPagamento: {},
        });
      }

      const dados = vendasPorFuncionario.get(funcionarioId)!;
      dados.totalVendas += Number(mov.valor);
      dados.quantidadeVendas += 1;

      // Agrupa por forma de pagamento
      const forma = mov.formaPagamento || 'OUTROS';
      if (!dados.porFormaPagamento[forma]) {
        dados.porFormaPagamento[forma] = { valor: 0, quantidade: 0 };
      }
      dados.porFormaPagamento[forma].valor += Number(mov.valor);
      dados.porFormaPagamento[forma].quantidade += 1;
    });

    // Converte para array e ordena por total de vendas (maior primeiro)
    const caixas = Array.from(vendasPorFuncionario.values()).sort(
      (a, b) => b.totalVendas - a.totalVendas,
    );

    // Calcula totais gerais
    const totalGeral = caixas.reduce((acc, c) => acc + c.totalVendas, 0);
    const quantidadeTotal = caixas.reduce((acc, c) => acc + c.quantidadeVendas, 0);

    // Agrupa totais por forma de pagamento
    const totalPorFormaPagamento: Record<string, { valor: number; quantidade: number }> = {};
    caixas.forEach((caixa) => {
      Object.entries(caixa.porFormaPagamento).forEach(([forma, dados]) => {
        if (!totalPorFormaPagamento[forma]) {
          totalPorFormaPagamento[forma] = { valor: 0, quantidade: 0 };
        }
        totalPorFormaPagamento[forma].valor += dados.valor;
        totalPorFormaPagamento[forma].quantidade += dados.quantidade;
      });
    });

    return {
      periodo: {
        tipo: params?.periodo || 'hoje',
        dataInicio,
        dataFim,
      },
      caixas,
      resumo: {
        totalGeral,
        quantidadeTotal,
        ticketMedio: quantidadeTotal > 0 ? totalGeral / quantidadeTotal : 0,
        quantidadeCaixas: caixas.length,
        porFormaPagamento: totalPorFormaPagamento,
      },
    };
  }

  // Métodos auxiliares privados

  private async registrarMovimentacao(data: {
    aberturaCaixaId: string;
    tipo: TipoMovimentacao;
    valor: number;
    descricao: string;
    funcionarioId: string;
    formaPagamento?: FormaPagamento;
    comandaId?: string;
    comandaNumero?: string;
  }) {
    const movimentacao = this.movimentacaoRepository.create({
      ...data,
      data: new Date(),
      hora: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
    });

    return await this.movimentacaoRepository.save(movimentacao);
  }

  private calcularValoresEsperados(movimentacoes: MovimentacaoCaixa[]) {
    const valores = {
      dinheiro: 0,
      pix: 0,
      debito: 0,
      credito: 0,
      valeRefeicao: 0,
      valeAlimentacao: 0,
      total: 0,
    };

    movimentacoes.forEach((mov) => {
      const valor = Number(mov.valor);
      valores.total += valor;

      switch (mov.formaPagamento) {
        case FormaPagamento.DINHEIRO:
          valores.dinheiro += valor;
          break;
        case FormaPagamento.PIX:
          valores.pix += valor;
          break;
        case FormaPagamento.DEBITO:
          valores.debito += valor;
          break;
        case FormaPagamento.CREDITO:
          valores.credito += valor;
          break;
        case FormaPagamento.VALE_REFEICAO:
          valores.valeRefeicao += valor;
          break;
        case FormaPagamento.VALE_ALIMENTACAO:
          valores.valeAlimentacao += valor;
          break;
      }
    });

    return valores;
  }

  private async calcularSaldoAtual(aberturaCaixaId: string): Promise<number> {
    const abertura = await this.aberturaRepository.findOne({
      where: { id: aberturaCaixaId },
    });

    const vendas = await this.movimentacaoRepository.find({
      where: { aberturaCaixaId, tipo: TipoMovimentacao.VENDA },
    });

    const sangrias = await this.sangriaRepository.find({
      where: { aberturaCaixaId },
    });

    const totalVendas = vendas.reduce((acc, v) => acc + Number(v.valor), 0);
    const totalSangrias = sangrias.reduce((acc, s) => acc + Number(s.valor), 0);

    return Number(abertura.valorInicial) + totalVendas - totalSangrias;
  }

  private agruparPorFormaPagamento(vendas: MovimentacaoCaixa[]) {
    const formas = Object.values(FormaPagamento);

    return formas.map((forma) => {
      const vendasPorForma = vendas.filter((v) => v.formaPagamento === forma);
      const valorEsperado = vendasPorForma.reduce(
        (acc, v) => acc + Number(v.valor),
        0,
      );

      return {
        formaPagamento: forma,
        valorEsperado,
        valorInformado: 0,
        diferenca: 0,
        quantidadeVendas: vendasPorForma.length,
      };
    });
  }
}
