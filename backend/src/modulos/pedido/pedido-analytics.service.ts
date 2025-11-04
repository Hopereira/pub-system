import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { ItemPedido } from './entities/item-pedido.entity';
import {
  RelatorioGeralDto,
  GarcomPerformanceDto,
  AmbientePerformanceDto,
  ProdutoVendasDto,
  FiltroRelatorioDto,
  PedidoTempoDto,
} from './dto/analytics.dto';

@Injectable()
export class PedidoAnalyticsService {
  private readonly logger = new Logger(PedidoAnalyticsService.name);

  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(ItemPedido)
    private itemPedidoRepository: Repository<ItemPedido>,
  ) {}

  /**
   * Gera relatório geral com todas as métricas
   */
  async gerarRelatorioGeral(filtro: FiltroRelatorioDto): Promise<RelatorioGeralDto> {
    const dataInicio = filtro.dataInicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás
    const dataFim = filtro.dataFim || new Date();

    this.logger.log(`Gerando relatório de ${dataInicio.toISOString()} até ${dataFim.toISOString()}`);

    const [
      resumo,
      garcons,
      ambientes,
      produtosMaisVendidos,
      produtosMenosVendidos,
      pedidosPorHora,
      pedidosPorDiaSemana,
    ] = await Promise.all([
      this.getResumoGeral(dataInicio, dataFim),
      this.getGarcomPerformance(dataInicio, dataFim, filtro.limite || 10),
      this.getAmbientePerformance(dataInicio, dataFim),
      this.getProdutosMaisVendidos(dataInicio, dataFim, filtro.limite || 10),
      this.getProdutosMenosVendidos(dataInicio, dataFim, filtro.limite || 10),
      this.getPedidosPorHora(dataInicio, dataFim),
      this.getPedidosPorDiaSemana(dataInicio, dataFim),
    ]);

    return {
      periodo: {
        inicio: dataInicio,
        fim: dataFim,
      },
      resumo,
      garcons,
      ambientes,
      produtosMaisVendidos,
      produtosMenosVendidos,
      pedidosPorHora,
      pedidosPorDiaSemana,
    };
  }

  /**
   * Resumo geral de pedidos
   */
  private async getResumoGeral(dataInicio: Date, dataFim: Date) {
    const pedidos = await this.pedidoRepository.find({
      where: {
        data: Between(dataInicio, dataFim),
      },
      relations: ['itens', 'itens.produto'],
      order: {
        data: 'DESC',
      },
      take: 10, // Últimos 10 pedidos para tempo médio
    });

    const totalPedidos = pedidos.length;
    const totalItens = pedidos.reduce((sum, p) => sum + p.itens.length, 0);
    const valorTotal = pedidos.reduce((sum, p) => {
      const valorPedido = p.itens.reduce(
        (itemSum, item) => itemSum + Number(item.precoUnitario) * item.quantidade,
        0,
      );
      return sum + valorPedido;
    }, 0);

    // Calcula tempo médio de preparo dos últimos 10 pedidos
    const itensComTempo = pedidos.flatMap(p => p.itens).filter(item => 
      item.iniciadoEm && item.prontoEm
    );
    
    const tempoMedioPreparo = itensComTempo.length > 0
      ? itensComTempo.reduce((sum, item) => {
          const tempo = (item.prontoEm.getTime() - item.iniciadoEm.getTime()) / 60000;
          return sum + tempo;
        }, 0) / itensComTempo.length
      : 0;

    const itensComEntrega = pedidos.flatMap(p => p.itens).filter(item => 
      item.iniciadoEm && item.entregueEm
    );
    
    const tempoMedioEntrega = itensComEntrega.length > 0
      ? itensComEntrega.reduce((sum, item) => {
          const tempo = (item.entregueEm.getTime() - item.iniciadoEm.getTime()) / 60000;
          return sum + tempo;
        }, 0) / itensComEntrega.length
      : 0;

    return {
      totalPedidos,
      totalItens,
      valorTotal,
      tempoMedioPreparo: Math.round(tempoMedioPreparo),
      tempoMedioEntrega: Math.round(tempoMedioEntrega),
    };
  }

  /**
   * Performance dos garçons
   */
  private async getGarcomPerformance(
    dataInicio: Date,
    dataFim: Date,
    limite: number,
  ): Promise<GarcomPerformanceDto[]> {
    // TODO: ItemPedido não tem relação com funcionário
    // Retorna array vazio por enquanto
    return [];
  }

  /**
   * Performance dos ambientes
   */
  private async getAmbientePerformance(dataInicio: Date, dataFim: Date): Promise<AmbientePerformanceDto[]> {
    const query = this.itemPedidoRepository
      .createQueryBuilder('item')
      .leftJoin('item.pedido', 'pedido')
      .leftJoin('item.produto', 'produto')
      .leftJoin('produto.ambiente', 'ambiente')
      .where('pedido.data BETWEEN :dataInicio AND :dataFim', { dataInicio, dataFim })
      .andWhere('ambiente.id IS NOT NULL')
      .select('ambiente.id', 'ambienteId')
      .addSelect('ambiente.nome', 'ambienteNome')
      .addSelect('COUNT(DISTINCT CASE WHEN item.status IN (:...statusConcluidos) THEN item.id END)', 'totalPedidosPreparados')
      .addSelect('COUNT(DISTINCT CASE WHEN item.status = :statusPreparo THEN item.id END)', 'pedidosEmPreparo')
      .addSelect(
        'AVG(CASE WHEN item.iniciadoEm IS NOT NULL AND item.prontoEm IS NOT NULL THEN EXTRACT(EPOCH FROM (item.prontoEm - item.iniciadoEm))/60 END)',
        'tempoMedioPreparoMinutos'
      )
      .setParameter('statusConcluidos', ['PRONTO', 'ENTREGUE', 'DEIXADO_NO_AMBIENTE'])
      .setParameter('statusPreparo', 'EM_PREPARO')
      .groupBy('ambiente.id')
      .addGroupBy('ambiente.nome')
      .orderBy('"totalPedidosPreparados"', 'DESC');

    const result = await query.getRawMany();

    return result.map((r) => ({
      ambienteId: r.ambienteId,
      ambienteNome: r.ambienteNome,
      totalPedidosPreparados: parseInt(r.totalPedidosPreparados, 10),
      tempoMedioPreparoMinutos: Math.round(parseFloat(r.tempoMedioPreparoMinutos) || 0),
      pedidosEmPreparo: parseInt(r.pedidosEmPreparo, 10),
    }));
  }

  /**
   * Produtos mais vendidos
   */
  private async getProdutosMaisVendidos(
    dataInicio: Date,
    dataFim: Date,
    limite: number,
  ): Promise<ProdutoVendasDto[]> {
    const query = this.itemPedidoRepository
      .createQueryBuilder('item')
      .leftJoin('item.pedido', 'pedido')
      .leftJoin('item.produto', 'produto')
      .where('pedido.data BETWEEN :dataInicio AND :dataFim', { dataInicio, dataFim })
      .andWhere('item.status != :statusCancelado', { statusCancelado: 'CANCELADO' })
      .andWhere('produto.id IS NOT NULL')
      .select('produto.id', 'produtoId')
      .addSelect('produto.nome', 'produtoNome')
      .addSelect('SUM(item.quantidade)', 'quantidadeVendida')
      .addSelect('SUM(item.quantidade * item.precoUnitario)', 'valorTotal')
      .addSelect('MAX(pedido.data)', 'ultimaVenda')
      .groupBy('produto.id')
      .addGroupBy('produto.nome')
      .orderBy('"quantidadeVendida"', 'DESC')
      .limit(limite);

    const result = await query.getRawMany();

    return result.map((r) => ({
      produtoId: r.produtoId,
      produtoNome: r.produtoNome,
      quantidadeVendida: parseInt(r.quantidadeVendida, 10),
      valorTotal: parseFloat(r.valorTotal),
      ultimaVenda: r.ultimaVenda,
    }));
  }

  /**
   * Produtos menos vendidos
   */
  private async getProdutosMenosVendidos(
    dataInicio: Date,
    dataFim: Date,
    limite: number,
  ): Promise<ProdutoVendasDto[]> {
    const query = this.itemPedidoRepository
      .createQueryBuilder('item')
      .leftJoin('item.pedido', 'pedido')
      .leftJoin('item.produto', 'produto')
      .where('pedido.data BETWEEN :dataInicio AND :dataFim', { dataInicio, dataFim })
      .andWhere('item.status != :statusCancelado', { statusCancelado: 'CANCELADO' })
      .andWhere('produto.id IS NOT NULL')
      .select('produto.id', 'produtoId')
      .addSelect('produto.nome', 'produtoNome')
      .addSelect('SUM(item.quantidade)', 'quantidadeVendida')
      .addSelect('SUM(item.quantidade * item.precoUnitario)', 'valorTotal')
      .addSelect('MAX(pedido.data)', 'ultimaVenda')
      .groupBy('produto.id')
      .addGroupBy('produto.nome')
      .orderBy('"quantidadeVendida"', 'ASC')
      .limit(limite);

    const result = await query.getRawMany();

    return result.map((r) => ({
      produtoId: r.produtoId,
      produtoNome: r.produtoNome,
      quantidadeVendida: parseInt(r.quantidadeVendida, 10),
      valorTotal: parseFloat(r.valorTotal),
      ultimaVenda: r.ultimaVenda,
    }));
  }

  /**
   * Pedidos por hora do dia
   */
  private async getPedidosPorHora(dataInicio: Date, dataFim: Date) {
    const query = this.pedidoRepository
      .createQueryBuilder('pedido')
      .where('pedido.data BETWEEN :dataInicio AND :dataFim', { dataInicio, dataFim })
      .select('EXTRACT(HOUR FROM pedido.data)', 'hora')
      .addSelect('COUNT(*)', 'quantidade')
      .groupBy('hora')
      .orderBy('"hora"', 'ASC');

    const result = await query.getRawMany();

    return result.map((r) => ({
      hora: parseInt(r.hora, 10),
      quantidade: parseInt(r.quantidade, 10),
    }));
  }

  /**
   * Pedidos por dia da semana
   */
  private async getPedidosPorDiaSemana(dataInicio: Date, dataFim: Date) {
    const query = this.pedidoRepository
      .createQueryBuilder('pedido')
      .where('pedido.data BETWEEN :dataInicio AND :dataFim', { dataInicio, dataFim })
      .select('EXTRACT(DOW FROM pedido.data)', 'diaSemana')
      .addSelect('COUNT(*)', 'quantidade')
      .groupBy('"diaSemana"')
      .orderBy('"diaSemana"', 'ASC');

    const result = await query.getRawMany();

    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    return result.map((r) => ({
      dia: diasSemana[parseInt(r.diaSemana, 10)],
      quantidade: parseInt(r.quantidade, 10),
    }));
  }

  /**
   * Calcula tempos de preparo e entrega dos pedidos
   */
  private calcularTemposPedidos(pedidos: Pedido[]): PedidoTempoDto[] {
    return pedidos.map((pedido) => {
      const dto: PedidoTempoDto = {
        pedidoId: pedido.id,
        criadoEm: pedido.data,
        status: pedido.itens[0]?.status || 'DESCONHECIDO',
      };

      // Nota: ItemPedido não tem campo de timestamp de atualização
      // Por enquanto, não calculamos tempos individuais
      // TODO: Adicionar campos de timestamp em ItemPedido se necessário

      // Ambiente do primeiro item
      if (pedido.itens[0]?.produto?.ambiente) {
        dto.ambiente = pedido.itens[0].produto.ambiente.nome;
      }

      return dto;
    });
  }

  /**
   * Busca tempos detalhados de pedidos específicos
   */
  async getTemposPedidos(filtro: FiltroRelatorioDto): Promise<PedidoTempoDto[]> {
    const dataInicio = filtro.dataInicio || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 dias atrás
    const dataFim = filtro.dataFim || new Date();

    const pedidos = await this.pedidoRepository.find({
      where: {
        data: Between(dataInicio, dataFim),
      },
      relations: ['itens', 'itens.produto', 'itens.produto.ambiente'],
      order: {
        data: 'DESC',
      },
      take: filtro.limite || 50,
    });

    return this.calcularTemposPedidos(pedidos);
  }
}
