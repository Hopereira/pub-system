import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { ItemPedido } from '../pedido/entities/item-pedido.entity';
import { PedidoStatus } from '../pedido/enums/pedido-status.enum';
import { PedidosGateway } from '../pedido/pedidos.gateway';
import Decimal from 'decimal.js';

/**
 * Serviço responsável por marcar itens como QUASE_PRONTO
 * baseado no tempo médio de preparo histórico do produto
 */
@Injectable()
export class QuaseProntoScheduler {
  private readonly logger = new Logger(QuaseProntoScheduler.name);
  
  // Tempo de antecipação padrão (em segundos)
  private readonly ANTECIPACAO_PADRAO_SEGUNDOS = 45;
  
  // Percentual do tempo médio para considerar "quase pronto"
  private readonly PERCENTUAL_QUASE_PRONTO = 0.7; // 70%
  
  // Tempo de fallback para produtos sem histórico (5 minutos)
  private readonly TEMPO_FALLBACK_MINUTOS = 5;

  constructor(
    @InjectRepository(ItemPedido)
    private readonly itemPedidoRepository: Repository<ItemPedido>,
    private readonly pedidosGateway: PedidosGateway,
  ) {}

  /**
   * Job executado a cada 15 segundos para verificar itens próximos de ficarem prontos
   */
  @Cron('*/15 * * * * *') // A cada 15 segundos
  async verificarItensQuaseProntos(): Promise<void> {
    try {
      // Busca itens EM_PREPARO que ainda não foram marcados como quase prontos
      const itensEmPreparo = await this.itemPedidoRepository.find({
        where: {
          status: PedidoStatus.EM_PREPARO,
          quaseProntoEm: IsNull() as any,
          iniciadoEm: LessThan(new Date()) as any,
        },
        relations: ['produto', 'pedido', 'pedido.comanda'],
        take: 50, // Limita para não sobrecarregar
      });

      if (itensEmPreparo.length === 0) {
        return; // Sem itens para processar
      }

      const agora = new Date();
      let itensAtualizados = 0;

      for (const item of itensEmPreparo) {
        if (!item.iniciadoEm || !item.produto) {
          continue;
        }

        // Calcula tempo médio de preparo do produto
        const tempoMedioPreparo = await this.calcularTempoMedioPreparo(item.produto.id);
        
        // Tempo decorrido desde início do preparo (em minutos)
        const tempoDecorridoMs = agora.getTime() - new Date(item.iniciadoEm).getTime();
        const tempoDecorridoMin = tempoDecorridoMs / 60000;

        // Tempo alvo para marcar como quase pronto
        let tempoAlvoMin: number;
        
        if (tempoMedioPreparo > 0) {
          // Usa 70% do tempo médio histórico
          tempoAlvoMin = tempoMedioPreparo * this.PERCENTUAL_QUASE_PRONTO;
        } else {
          // Sem histórico: usa 80% do tempo fallback (5 min)
          tempoAlvoMin = this.TEMPO_FALLBACK_MINUTOS * 0.8;
        }

        // Se já passou do tempo alvo, marca como quase pronto
        if (tempoDecorridoMin >= tempoAlvoMin) {
          await this.marcarComoQuasePronto(item, tempoMedioPreparo);
          itensAtualizados++;
        }
      }

      if (itensAtualizados > 0) {
        this.logger.log(`✨ ${itensAtualizados} itens marcados como QUASE_PRONTO`);
      }
    } catch (error) {
      this.logger.error('❌ Erro ao verificar itens quase prontos:', error);
    }
  }

  /**
   * Calcula o tempo médio de preparo de um produto baseado no histórico
   */
  private async calcularTempoMedioPreparo(produtoId: string): Promise<number> {
    const resultado = await this.itemPedidoRepository
      .createQueryBuilder('item')
      .select('AVG(item.tempo_preparo_minutos)', 'media')
      .where('item.produtoId = :produtoId', { produtoId })
      .andWhere('item.tempo_preparo_minutos IS NOT NULL')
      .andWhere('item.status IN (:...status)', { 
        status: [PedidoStatus.PRONTO, PedidoStatus.ENTREGUE, PedidoStatus.RETIRADO] 
      })
      .getRawOne();

    return resultado?.media ? parseFloat(resultado.media) : 0;
  }

  /**
   * Marca um item como QUASE_PRONTO e emite eventos
   */
  private async marcarComoQuasePronto(
    item: ItemPedido, 
    tempoMedioPreparoMin: number
  ): Promise<void> {
    const agora = new Date();
    
    // Calcula ETA (tempo estimado até ficar PRONTO)
    let etaSegundos = this.ANTECIPACAO_PADRAO_SEGUNDOS;
    
    if (tempoMedioPreparoMin > 0 && item.iniciadoEm) {
      const tempoDecorridoMs = agora.getTime() - new Date(item.iniciadoEm).getTime();
      const tempoDecorridoMin = tempoDecorridoMs / 60000;
      const tempoRestanteMin = tempoMedioPreparoMin - tempoDecorridoMin;
      etaSegundos = Math.max(30, Math.round(tempoRestanteMin * 60));
    }

    // Atualiza o item
    item.status = PedidoStatus.QUASE_PRONTO;
    item.quaseProntoEm = agora;
    
    await this.itemPedidoRepository.save(item);

    this.logger.log(
      `⏳ Item quase pronto | Produto: ${item.produto?.nome || 'N/A'} | ` +
      `ETA: ${etaSegundos}s | Tempo médio: ${tempoMedioPreparoMin.toFixed(1)}min`
    );

    // Emite evento WebSocket
    const comanda = item.pedido?.comanda;
    if (comanda) {
      this.pedidosGateway.emitStatusAtualizado(item.pedido);
      
      // Evento específico de item quase pronto
      this.pedidosGateway.server.emit('item_quase_pronto', {
        itemId: item.id,
        pedidoId: item.pedido.id,
        comandaId: comanda.id,
        produtoNome: item.produto?.nome,
        ambienteId: item.ambienteRetiradaId,
        etaSegundos,
        quaseProntoEm: agora,
        statusAnterior: PedidoStatus.EM_PREPARO,
        statusAtual: PedidoStatus.QUASE_PRONTO,
      });

      // Emite também para sala de gestão
      this.pedidosGateway.server.to('gestao').emit('item_quase_pronto', {
        itemId: item.id,
        pedidoId: item.pedido.id,
        produtoNome: item.produto?.nome,
        etaSegundos,
      });
    }
  }

  /**
   * Método manual para forçar verificação (útil para testes)
   */
  async verificarManualmente(): Promise<{ itensProcessados: number }> {
    await this.verificarItensQuaseProntos();
    return { itensProcessados: 1 };
  }
}
