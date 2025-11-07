import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Pedido } from '../pedido/entities/pedido.entity';
import { ItemPedido } from '../pedido/entities/item-pedido.entity';
import { Comanda } from '../comanda/entities/comanda.entity';

interface FiltroRelatorio {
  dataInicio?: Date;
  dataFim?: Date;
  ambienteId?: string;
  funcionarioId?: string;
  limite?: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Pedido)
    private pedidoRepository: Repository<Pedido>,
    @InjectRepository(ItemPedido)
    private itemPedidoRepository: Repository<ItemPedido>,
    @InjectRepository(Comanda)
    private comandaRepository: Repository<Comanda>,
  ) {}

  async getRelatorioGeral(filtro: FiltroRelatorio) {
    this.logger.log(`📊 Gerando relatório geral | Filtro: ${JSON.stringify(filtro)}`);

    const whereClause: any = {};
    
    if (filtro.dataInicio && filtro.dataFim) {
      whereClause.data = Between(filtro.dataInicio, filtro.dataFim);
    } else if (filtro.dataInicio) {
      whereClause.data = MoreThanOrEqual(filtro.dataInicio);
    } else if (filtro.dataFim) {
      whereClause.data = LessThanOrEqual(filtro.dataFim);
    }

    // Buscar pedidos
    const pedidos = await this.pedidoRepository.find({
      where: whereClause,
      relations: ['itens', 'itens.produto', 'comanda', 'criadoPor', 'entreguePor'],
    });

    // Resumo geral
    const totalPedidos = pedidos.length;
    const totalItens = pedidos.reduce((sum, p) => sum + p.itens.length, 0);
    const valorTotal = pedidos.reduce((sum, p) => sum + Number(p.total), 0);
    
    const pedidosComTempo = pedidos.filter(p => p.tempoTotalMinutos);
    const tempoMedioEntrega = pedidosComTempo.length > 0
      ? Math.round(pedidosComTempo.reduce((sum, p) => sum + p.tempoTotalMinutos, 0) / pedidosComTempo.length)
      : 0;

    const itensComTempo = await this.itemPedidoRepository.find({
      where: { tempoPreparoMinutos: MoreThanOrEqual(0) },
      order: { prontoEm: 'DESC' },
      take: filtro.limite || 10,
    });
    const tempoMedioPreparo = itensComTempo.length > 0
      ? Math.round(itensComTempo.reduce((sum, i) => sum + i.tempoPreparoMinutos, 0) / itensComTempo.length)
      : 0;

    // Produtos mais vendidos
    const produtosMap = new Map<string, { produtoId: string; produtoNome: string; quantidadeVendida: number; valorTotal: number }>();
    
    pedidos.forEach(pedido => {
      pedido.itens.forEach(item => {
        if (item.produto) {
          const key = item.produto.id;
          const existing = produtosMap.get(key) || {
            produtoId: item.produto.id,
            produtoNome: item.produto.nome,
            quantidadeVendida: 0,
            valorTotal: 0,
          };
          existing.quantidadeVendida += item.quantidade;
          existing.valorTotal += Number(item.precoUnitario) * item.quantidade;
          produtosMap.set(key, existing);
        }
      });
    });

    const produtosArray = Array.from(produtosMap.values());
    const produtosMaisVendidos = produtosArray
      .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
      .slice(0, filtro.limite || 10);
    
    const produtosMenosVendidos = produtosArray
      .sort((a, b) => a.quantidadeVendida - b.quantidadeVendida)
      .slice(0, 5);

    // Performance de garçons
    const garconsMap = new Map<string, { funcionarioId: string; funcionarioNome: string; totalPedidosEntregues: number; tempoMedioEntregaMinutos: number; totalTempos: number }>();
    
    pedidos.forEach(pedido => {
      if (pedido.entreguePor && pedido.tempoTotalMinutos) {
        const key = pedido.entreguePor.id;
        const existing = garconsMap.get(key) || {
          funcionarioId: pedido.entreguePor.id,
          funcionarioNome: pedido.entreguePor.nome,
          totalPedidosEntregues: 0,
          tempoMedioEntregaMinutos: 0,
          totalTempos: 0,
        };
        existing.totalPedidosEntregues++;
        existing.totalTempos += pedido.tempoTotalMinutos;
        garconsMap.set(key, existing);
      }
    });

    const garcons = Array.from(garconsMap.values()).map(g => ({
      ...g,
      tempoMedioEntregaMinutos: g.totalPedidosEntregues > 0 ? Math.round(g.totalTempos / g.totalPedidosEntregues) : 0,
    })).sort((a, b) => b.totalPedidosEntregues - a.totalPedidosEntregues);

    // Performance de ambientes
    const ambientesMap = new Map<string, { ambienteId: string; ambienteNome: string; totalPedidosPreparados: number; tempoMedioPreparoMinutos: number; pedidosEmPreparo: number; totalTempos: number }>();
    
    const itens = await this.itemPedidoRepository.find({
      relations: ['produto', 'produto.ambiente'],
    });

    itens.forEach(item => {
      if (item.produto?.ambiente) {
        const key = item.produto.ambiente.id;
        const existing = ambientesMap.get(key) || {
          ambienteId: item.produto.ambiente.id,
          ambienteNome: item.produto.ambiente.nome,
          totalPedidosPreparados: 0,
          tempoMedioPreparoMinutos: 0,
          pedidosEmPreparo: 0,
          totalTempos: 0,
        };
        
        if (item.status === 'EM_PREPARO') {
          existing.pedidosEmPreparo++;
        }
        
        if (item.tempoPreparoMinutos) {
          existing.totalPedidosPreparados++;
          existing.totalTempos += item.tempoPreparoMinutos;
        }
        
        ambientesMap.set(key, existing);
      }
    });

    const ambientes = Array.from(ambientesMap.values()).map(a => ({
      ...a,
      tempoMedioPreparoMinutos: a.totalPedidosPreparados > 0 ? Math.round(a.totalTempos / a.totalPedidosPreparados) : 0,
    })).sort((a, b) => b.totalPedidosPreparados - a.totalPedidosPreparados);

    const relatorio = {
      periodo: {
        inicio: filtro.dataInicio || new Date(0),
        fim: filtro.dataFim || new Date(),
      },
      resumo: {
        totalPedidos,
        totalItens,
        valorTotal,
        tempoMedioPreparo,
        tempoMedioEntrega,
      },
      produtosMaisVendidos,
      produtosMenosVendidos,
      garcons,
      ambientes,
    };

    this.logger.log(`✅ Relatório gerado | Pedidos: ${totalPedidos} | Valor: R$ ${valorTotal.toFixed(2)}`);
    
    return relatorio;
  }

  async getTemposPedidos(filtro: FiltroRelatorio) {
    this.logger.log(`⏱️ Buscando tempos de pedidos | Filtro: ${JSON.stringify(filtro)}`);

    const whereClause: any = {};
    
    if (filtro.dataInicio && filtro.dataFim) {
      whereClause.data = Between(filtro.dataInicio, filtro.dataFim);
    }

    const pedidos = await this.pedidoRepository.find({
      where: whereClause,
      relations: ['itens', 'comanda', 'comanda.mesa', 'criadoPor', 'entreguePor'],
      order: { data: 'DESC' },
      take: filtro.limite || 50,
    });

    const tempos = pedidos.map(pedido => ({
      pedidoId: pedido.id,
      data: pedido.data,
      mesa: pedido.comanda?.mesa?.numero,
      criadoPor: pedido.criadoPor?.nome || 'Cliente',
      entreguePor: pedido.entreguePor?.nome,
      tempoTotalMinutos: pedido.tempoTotalMinutos,
      entregueEm: pedido.entregueEm,
    }));

    this.logger.log(`✅ Tempos carregados | Total: ${tempos.length}`);
    
    return tempos;
  }

  async getPerformanceGarcons(filtro: FiltroRelatorio) {
    this.logger.log(`👥 Buscando performance de garçons`);

    const whereClause: any = {};
    
    if (filtro.dataInicio && filtro.dataFim) {
      whereClause.entregueEm = Between(filtro.dataInicio, filtro.dataFim);
    }

    const pedidos = await this.pedidoRepository.find({
      where: whereClause,
      relations: ['entreguePor', 'itens'],
    });

    const garconsMap = new Map();
    
    // Buscar itens retirados para calcular tempo de reação
    const itensRetirados = await this.itemPedidoRepository.find({
      where: {
        retiradoPorGarcomId: filtro.funcionarioId || undefined,
        retiradoEm: filtro.dataInicio && filtro.dataFim 
          ? Between(filtro.dataInicio, filtro.dataFim)
          : undefined,
      },
      relations: ['retiradoPorGarcom'],
    });

    // Mapear itens por garçom para calcular métricas de reação
    const itensRetiradosMap = new Map();
    itensRetirados.forEach(item => {
      if (item.retiradoPorGarcom) {
        const key = item.retiradoPorGarcom.id;
        if (!itensRetiradosMap.has(key)) {
          itensRetiradosMap.set(key, []);
        }
        itensRetiradosMap.get(key).push(item);
      }
    });
    
    pedidos.forEach(pedido => {
      if (pedido.entreguePor) {
        const key = pedido.entreguePor.id;
        const existing = garconsMap.get(key) || {
          funcionarioId: pedido.entreguePor.id,
          funcionarioNome: pedido.entreguePor.nome,
          totalEntregas: 0,
          tempoMedioMinutos: 0,
          totalTempos: 0,
          // Novas métricas
          tempoMedioReacaoMinutos: 0,
          tempoMedioEntregaFinalMinutos: 0,
          totalReacoes: 0,
          totalEntregasFinais: 0,
          somaReacoes: 0,
          somaEntregasFinais: 0,
          percentualSLA: 0,
          totalReacoesDentroSLA: 0,
        };
        existing.totalEntregas++;
        if (pedido.tempoTotalMinutos) {
          existing.totalTempos += pedido.tempoTotalMinutos;
        }
        
        // Calcular métricas dos itens
        const itensDoGarcom = itensRetiradosMap.get(key) || [];
        itensDoGarcom.forEach(item => {
          if (item.tempoReacaoMinutos !== null && item.tempoReacaoMinutos !== undefined) {
            existing.totalReacoes++;
            existing.somaReacoes += item.tempoReacaoMinutos;
            // SLA: reação < 2min
            if (item.tempoReacaoMinutos < 2) {
              existing.totalReacoesDentroSLA++;
            }
          }
          if (item.tempoEntregaFinalMinutos !== null && item.tempoEntregaFinalMinutos !== undefined) {
            existing.totalEntregasFinais++;
            existing.somaEntregasFinais += item.tempoEntregaFinalMinutos;
          }
        });
        
        garconsMap.set(key, existing);
      }
    });

    const garcons = Array.from(garconsMap.values()).map(g => ({
      funcionarioId: g.funcionarioId,
      funcionarioNome: g.funcionarioNome,
      totalEntregas: g.totalEntregas,
      tempoMedioMinutos: g.totalEntregas > 0 ? Math.round(g.totalTempos / g.totalEntregas) : 0,
      tempoMedioReacaoMinutos: g.totalReacoes > 0 ? Math.round(g.somaReacoes / g.totalReacoes) : 0,
      tempoMedioEntregaFinalMinutos: g.totalEntregasFinais > 0 ? Math.round(g.somaEntregasFinais / g.totalEntregasFinais) : 0,
      percentualSLA: g.totalReacoes > 0 ? Math.round((g.totalReacoesDentroSLA / g.totalReacoes) * 100) : 0,
    }));

    return garcons;
  }

  async getPerformanceAmbientes(filtro: FiltroRelatorio) {
    this.logger.log(`🍳 Buscando performance de ambientes`);

    const itens = await this.itemPedidoRepository.find({
      relations: ['produto', 'produto.ambiente'],
    });

    const ambientesMap = new Map();
    
    itens.forEach(item => {
      if (item.produto?.ambiente) {
        const key = item.produto.ambiente.id;
        const existing = ambientesMap.get(key) || {
          ambienteId: item.produto.ambiente.id,
          ambienteNome: item.produto.ambiente.nome,
          totalPreparados: 0,
          tempoMedioMinutos: 0,
          totalTempos: 0,
        };
        if (item.tempoPreparoMinutos) {
          existing.totalPreparados++;
          existing.totalTempos += item.tempoPreparoMinutos;
        }
        ambientesMap.set(key, existing);
      }
    });

    const ambientes = Array.from(ambientesMap.values()).map(a => ({
      ...a,
      tempoMedioMinutos: a.totalPreparados > 0 ? Math.round(a.totalTempos / a.totalPreparados) : 0,
    }));

    return ambientes;
  }

  async getProdutosMaisVendidos(filtro: FiltroRelatorio) {
    this.logger.log(`📦 Buscando produtos mais vendidos`);

    const whereClause: any = {};
    
    if (filtro.dataInicio && filtro.dataFim) {
      whereClause.data = Between(filtro.dataInicio, filtro.dataFim);
    }

    const pedidos = await this.pedidoRepository.find({
      where: whereClause,
      relations: ['itens', 'itens.produto'],
    });

    const produtosMap = new Map();
    
    pedidos.forEach(pedido => {
      pedido.itens.forEach(item => {
        if (item.produto) {
          const key = item.produto.id;
          const existing = produtosMap.get(key) || {
            produtoId: item.produto.id,
            produtoNome: item.produto.nome,
            quantidadeVendida: 0,
            valorTotal: 0,
          };
          existing.quantidadeVendida += item.quantidade;
          existing.valorTotal += Number(item.precoUnitario) * item.quantidade;
          produtosMap.set(key, existing);
        }
      });
    });

    const produtos = Array.from(produtosMap.values())
      .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
      .slice(0, filtro.limite || 10);

    return produtos;
  }

  async getRankingGarcons(filtro: { periodo?: 'hoje' | 'semana' | 'mes'; ambienteId?: string; limite?: number }) {
    this.logger.log(`🏆 Gerando ranking de garçons | Período: ${filtro.periodo || 'hoje'}`);

    // Calcular datas baseado no período
    const agora = new Date();
    let dataInicio: Date;

    switch (filtro.periodo) {
      case 'semana':
        dataInicio = new Date(agora);
        dataInicio.setDate(agora.getDate() - 7);
        break;
      case 'mes':
        dataInicio = new Date(agora);
        dataInicio.setDate(agora.getDate() - 30);
        break;
      case 'hoje':
      default:
        dataInicio = new Date(agora);
        dataInicio.setHours(0, 0, 0, 0);
        break;
    }

    // Buscar itens retirados no período
    const whereClause: any = {
      retiradoEm: MoreThanOrEqual(dataInicio),
    };

    const itensRetirados = await this.itemPedidoRepository.find({
      where: whereClause,
      relations: ['retiradoPorGarcom', 'produto', 'produto.ambiente'],
    });

    // Filtrar por ambiente se necessário
    let itensFiltrados = itensRetirados;
    if (filtro.ambienteId) {
      itensFiltrados = itensRetirados.filter(
        item => item.produto?.ambiente?.id === filtro.ambienteId
      );
    }

    // Mapear por garçom
    const garconsMap = new Map();

    itensFiltrados.forEach(item => {
      if (item.retiradoPorGarcom) {
        const key = item.retiradoPorGarcom.id;
        const existing = garconsMap.get(key) || {
          funcionarioId: item.retiradoPorGarcom.id,
          funcionarioNome: item.retiradoPorGarcom.nome,
          totalEntregas: 0,
          somaReacoes: 0,
          totalReacoes: 0,
          somaEntregasFinais: 0,
          totalEntregasFinais: 0,
          totalReacoesDentroSLA: 0, // < 2min
          totalEntregasRapidas: 0, // reação < 2min
        };

        existing.totalEntregas++;

        if (item.tempoReacaoMinutos !== null && item.tempoReacaoMinutos !== undefined) {
          existing.totalReacoes++;
          existing.somaReacoes += item.tempoReacaoMinutos;
          if (item.tempoReacaoMinutos < 2) {
            existing.totalReacoesDentroSLA++;
            existing.totalEntregasRapidas++;
          }
        }

        if (item.tempoEntregaFinalMinutos !== null && item.tempoEntregaFinalMinutos !== undefined) {
          existing.totalEntregasFinais++;
          existing.somaEntregasFinais += item.tempoEntregaFinalMinutos;
        }

        garconsMap.set(key, existing);
      }
    });

    // Calcular pontuação e ranking
    const garcons = Array.from(garconsMap.values()).map(g => {
      const tempoMedioReacao = g.totalReacoes > 0 ? g.somaReacoes / g.totalReacoes : 0;
      const percentualSLA = g.totalReacoes > 0 ? (g.totalReacoesDentroSLA / g.totalReacoes) * 100 : 0;

      // Fórmula de pontuação
      let pontos = g.totalEntregas * 10; // Base: 10 pontos por entrega

      // Bônus de velocidade (entrega rápida < 2min)
      pontos += g.totalEntregasRapidas * 5;

      // Bônus de volume
      if (g.totalEntregas >= 20) pontos += 50;
      if (g.totalEntregas >= 50) pontos += 100;
      if (g.totalEntregas >= 100) pontos += 200;

      // Bônus de SLA
      if (percentualSLA >= 95) pontos += 100;
      else if (percentualSLA >= 90) pontos += 50;

      // Penalidade por atraso (tempo médio > 5min)
      if (tempoMedioReacao > 5) {
        pontos -= Math.floor(tempoMedioReacao - 5) * 10;
      }

      // Garantir não negativo
      pontos = Math.max(pontos, 0);

      return {
        funcionarioId: g.funcionarioId,
        funcionarioNome: g.funcionarioNome,
        totalEntregas: g.totalEntregas,
        tempoMedioReacaoMinutos: Math.round(tempoMedioReacao * 10) / 10,
        tempoMedioEntregaFinalMinutos: g.totalEntregasFinais > 0 
          ? Math.round((g.somaEntregasFinais / g.totalEntregasFinais) * 10) / 10 
          : 0,
        percentualSLA: Math.round(percentualSLA),
        pontos: Math.round(pontos),
        entregasRapidas: g.totalEntregasRapidas,
      };
    });

    // Ordenar por pontos (maior para menor)
    garcons.sort((a, b) => b.pontos - a.pontos);

    // Adicionar posição e tendência
    const rankingFinal = garcons.slice(0, filtro.limite || 100).map((g, index) => ({
      ...g,
      posicao: index + 1,
      tendencia: 'estavel' as 'subindo' | 'descendo' | 'estavel', // TODO: Comparar com ranking anterior
      medalhas: [], // TODO: Buscar medalhas conquistadas
    }));

    this.logger.log(`✅ Ranking gerado | Total garçons: ${rankingFinal.length}`);

    return {
      periodo: filtro.periodo || 'hoje',
      dataInicio,
      dataFim: agora,
      ranking: rankingFinal,
    };
  }

  async getEstatisticasGarcom(garcomId: string, filtro: { periodo?: 'hoje' | 'semana' | 'mes' }) {
    this.logger.log(`📊 Buscando estatísticas do garçom ${garcomId}`);

    // Calcular datas
    const agora = new Date();
    let dataInicio: Date;

    switch (filtro.periodo) {
      case 'semana':
        dataInicio = new Date(agora);
        dataInicio.setDate(agora.getDate() - 7);
        break;
      case 'mes':
        dataInicio = new Date(agora);
        dataInicio.setDate(agora.getDate() - 30);
        break;
      case 'hoje':
      default:
        dataInicio = new Date(agora);
        dataInicio.setHours(0, 0, 0, 0);
        break;
    }

    // Buscar itens do garçom
    const itens = await this.itemPedidoRepository.find({
      where: {
        retiradoPorGarcomId: garcomId,
        retiradoEm: MoreThanOrEqual(dataInicio),
      },
      relations: ['produto', 'produto.ambiente'],
      order: { retiradoEm: 'ASC' },
    });

    // Calcular estatísticas
    const totalEntregas = itens.length;
    const itensComReacao = itens.filter(i => i.tempoReacaoMinutos !== null);
    const itensComEntregaFinal = itens.filter(i => i.tempoEntregaFinalMinutos !== null);

    const tempoMedioReacao = itensComReacao.length > 0
      ? itensComReacao.reduce((sum, i) => sum + i.tempoReacaoMinutos, 0) / itensComReacao.length
      : 0;

    const tempoMedioEntregaFinal = itensComEntregaFinal.length > 0
      ? itensComEntregaFinal.reduce((sum, i) => sum + i.tempoEntregaFinalMinutos, 0) / itensComEntregaFinal.length
      : 0;

    const entregasRapidas = itensComReacao.filter(i => i.tempoReacaoMinutos < 2).length;
    const percentualSLA = itensComReacao.length > 0
      ? (entregasRapidas / itensComReacao.length) * 100
      : 0;

    // Evolução por dia (últimos 7 dias)
    const evolucaoDiaria = [];
    for (let i = 6; i >= 0; i--) {
      const dia = new Date(agora);
      dia.setDate(agora.getDate() - i);
      dia.setHours(0, 0, 0, 0);
      
      const diaFim = new Date(dia);
      diaFim.setHours(23, 59, 59, 999);

      const itensDoDia = itens.filter(item => {
        const dataItem = new Date(item.retiradoEm);
        return dataItem >= dia && dataItem <= diaFim;
      });

      evolucaoDiaria.push({
        data: dia.toISOString().split('T')[0],
        totalEntregas: itensDoDia.length,
        pontos: itensDoDia.length * 10 + itensDoDia.filter(i => i.tempoReacaoMinutos < 2).length * 5,
      });
    }

    return {
      periodo: filtro.periodo || 'hoje',
      totalEntregas,
      tempoMedioReacaoMinutos: Math.round(tempoMedioReacao * 10) / 10,
      tempoMedioEntregaFinalMinutos: Math.round(tempoMedioEntregaFinal * 10) / 10,
      percentualSLA: Math.round(percentualSLA),
      entregasRapidas,
      evolucaoDiaria,
    };
  }
}
