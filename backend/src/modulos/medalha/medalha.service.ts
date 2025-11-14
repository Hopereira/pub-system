import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Medalha } from './entities/medalha.entity';
import { MedalhaGarcom } from './entities/medalha-garcom.entity';
import { ItemPedido } from '../pedido/entities/item-pedido.entity';
import { TipoMedalha } from './enums/tipo-medalha.enum';
import { NivelMedalha } from './enums/nivel-medalha.enum';

@Injectable()
export class MedalhaService {
  private readonly logger = new Logger(MedalhaService.name);

  constructor(
    @InjectRepository(Medalha)
    private medalhaRepository: Repository<Medalha>,
    @InjectRepository(MedalhaGarcom)
    private medalhaGarcomRepository: Repository<MedalhaGarcom>,
    @InjectRepository(ItemPedido)
    private itemPedidoRepository: Repository<ItemPedido>,
  ) {}

  async getMedalhasGarcom(garcomId: string) {
    this.logger.log(`🏅 Buscando medalhas do garçom ${garcomId}`);

    const medalhasConquistadas = await this.medalhaGarcomRepository.find({
      where: { funcionarioId: garcomId },
      relations: ['medalha'],
      order: { conquistadaEm: 'DESC' },
    });

    return medalhasConquistadas.map(mg => ({
      id: mg.medalha.id,
      tipo: mg.medalha.tipo,
      nome: mg.medalha.nome,
      descricao: mg.medalha.descricao,
      icone: mg.medalha.icone,
      nivel: mg.medalha.nivel,
      conquistadaEm: mg.conquistadaEm,
      metadata: mg.metadata,
    }));
  }

  async getProgressoMedalhas(garcomId: string) {
    this.logger.log(`📊 Calculando progresso de medalhas para ${garcomId}`);

    // Buscar todas as medalhas disponíveis
    const todasMedalhas = await this.medalhaRepository.find({
      where: { ativo: true },
      order: { tipo: 'ASC', nivel: 'ASC' },
    });

    // Buscar medalhas já conquistadas
    const medalhasConquistadas = await this.medalhaGarcomRepository.find({
      where: { funcionarioId: garcomId },
      relations: ['medalha'],
    });

    const medalhasConquistadasIds = new Set(
      medalhasConquistadas.map(mg => mg.medalhaId)
    );

    // Calcular estatísticas do garçom
    const stats = await this.calcularEstatisticas(garcomId);

    // Calcular progresso para cada medalha não conquistada
    const progressos = [];

    for (const medalha of todasMedalhas) {
      if (medalhasConquistadasIds.has(medalha.id)) {
        continue; // Já conquistou
      }

      const progresso = this.calcularProgresso(medalha, stats);
      progressos.push({
        medalha: {
          id: medalha.id,
          tipo: medalha.tipo,
          nome: medalha.nome,
          descricao: medalha.descricao,
          icone: medalha.icone,
          nivel: medalha.nivel,
        },
        progresso: progresso.percentual,
        valorAtual: progresso.valorAtual,
        valorNecessario: progresso.valorNecessario,
        faltam: progresso.faltam,
      });
    }

    // Ordenar por progresso (maior primeiro)
    progressos.sort((a, b) => b.progresso - a.progresso);

    return {
      medalhasConquistadas: medalhasConquistadas.length,
      totalMedalhas: todasMedalhas.length,
      proximasConquistas: progressos.slice(0, 5), // Top 5 mais próximas
    };
  }

  async verificarNovasMedalhas(garcomId: string) {
    this.logger.log(`🔍 Verificando novas medalhas para ${garcomId}`);

    const stats = await this.calcularEstatisticas(garcomId);
    const todasMedalhas = await this.medalhaRepository.find({
      where: { ativo: true },
    });

    const medalhasConquistadas = await this.medalhaGarcomRepository.find({
      where: { funcionarioId: garcomId },
    });

    const medalhasConquistadasIds = new Set(
      medalhasConquistadas.map(mg => mg.medalhaId)
    );

    const novasMedalhas = [];

    for (const medalha of todasMedalhas) {
      if (medalhasConquistadasIds.has(medalha.id)) {
        continue;
      }

      if (this.verificarRequisitos(medalha, stats)) {
        // Conquistou!
        const novaMedalha = await this.medalhaGarcomRepository.save({
          funcionarioId: garcomId,
          medalhaId: medalha.id,
          metadata: {
            valorAtingido: this.getValorAtingido(medalha, stats),
            periodo: new Date().toISOString().split('T')[0],
          },
        });

        novasMedalhas.push({
          id: medalha.id,
          tipo: medalha.tipo,
          nome: medalha.nome,
          icone: medalha.icone,
          nivel: medalha.nivel,
        });

        // TODO: Emitir evento WebSocket quando EventsModule estiver disponível
        // this.eventsGateway.server
        //   .to(`user:${garcomId}`)
        //   .emit('medalha_conquistada', { medalha: {...} });

        this.logger.log(
          `🏆 Nova medalha conquistada! ${medalha.nome} por ${garcomId}`
        );
      }
    }

    return novasMedalhas;
  }

  private async calcularEstatisticas(garcomId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const semanaAtras = new Date(hoje);
    semanaAtras.setDate(hoje.getDate() - 7);

    const mesAtras = new Date(hoje);
    mesAtras.setDate(hoje.getDate() - 30);

    // Buscar todos os itens retirados pelo garçom
    const itens = await this.itemPedidoRepository.find({
      where: {
        retiradoPorGarcomId: garcomId,
      },
      order: { retiradoEm: 'ASC' },
    });

    const itensHoje = itens.filter(
      i => new Date(i.retiradoEm) >= hoje
    );

    const itensRapidos = itens.filter(
      i => i.tempoReacaoMinutos !== null && i.tempoReacaoMinutos < 2
    );

    return {
      totalEntregas: itens.length,
      entregasHoje: itensHoje.length,
      entregasRapidas: itensRapidos.length,
      itens,
    };
  }

  private calcularProgresso(medalha: Medalha, stats: any) {
    const req = medalha.requisitos;

    switch (medalha.tipo) {
      case TipoMedalha.VELOCISTA:
        return {
          percentual: Math.min(
            100,
            (stats.entregasRapidas / req.entregasRapidas) * 100
          ),
          valorAtual: stats.entregasRapidas,
          valorNecessario: req.entregasRapidas,
          faltam: Math.max(0, req.entregasRapidas - stats.entregasRapidas),
        };

      case TipoMedalha.MARATONISTA:
        return {
          percentual: Math.min(
            100,
            (stats.entregasHoje / req.entregasPorDia) * 100
          ),
          valorAtual: stats.entregasHoje,
          valorNecessario: req.entregasPorDia,
          faltam: Math.max(0, req.entregasPorDia - stats.entregasHoje),
        };

      case TipoMedalha.ROOKIE:
        return {
          percentual: stats.totalEntregas > 0 ? 100 : 0,
          valorAtual: stats.totalEntregas,
          valorNecessario: 1,
          faltam: stats.totalEntregas > 0 ? 0 : 1,
        };

      default:
        return {
          percentual: 0,
          valorAtual: 0,
          valorNecessario: 1,
          faltam: 1,
        };
    }
  }

  private verificarRequisitos(medalha: Medalha, stats: any): boolean {
    const req = medalha.requisitos;

    switch (medalha.tipo) {
      case TipoMedalha.VELOCISTA:
        return stats.entregasRapidas >= req.entregasRapidas;

      case TipoMedalha.MARATONISTA:
        return stats.entregasHoje >= req.entregasPorDia;

      case TipoMedalha.ROOKIE:
        return stats.totalEntregas >= 1;

      // TODO: Implementar PONTUAL, MVP, CONSISTENTE

      default:
        return false;
    }
  }

  private getValorAtingido(medalha: Medalha, stats: any): number {
    switch (medalha.tipo) {
      case TipoMedalha.VELOCISTA:
        return stats.entregasRapidas;
      case TipoMedalha.MARATONISTA:
        return stats.entregasHoje;
      case TipoMedalha.ROOKIE:
        return 1;
      default:
        return 0;
    }
  }
}
