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
      relations: ['entreguePor'],
    });

    const garconsMap = new Map();
    
    pedidos.forEach(pedido => {
      if (pedido.entreguePor) {
        const key = pedido.entreguePor.id;
        const existing = garconsMap.get(key) || {
          funcionarioId: pedido.entreguePor.id,
          funcionarioNome: pedido.entreguePor.nome,
          totalEntregas: 0,
          tempoMedioMinutos: 0,
          totalTempos: 0,
        };
        existing.totalEntregas++;
        if (pedido.tempoTotalMinutos) {
          existing.totalTempos += pedido.tempoTotalMinutos;
        }
        garconsMap.set(key, existing);
      }
    });

    const garcons = Array.from(garconsMap.values()).map(g => ({
      ...g,
      tempoMedioMinutos: g.totalEntregas > 0 ? Math.round(g.totalTempos / g.totalEntregas) : 0,
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
}
