// Caminho: backend/src/modulos/mesa/mesa.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mesa, MesaStatus } from './entities/mesa.entity';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import { Ambiente } from '../ambiente/entities/ambiente.entity';
import {
  AtualizarPosicaoMesaDto,
  AtualizarPosicoesBatchDto,
  MesaMapaDto,
  MapaCompletoDto,
} from './dto/mapa.dto';
import { PontoEntrega } from '../ponto-entrega/entities/ponto-entrega.entity';
import { Pedido } from '../pedido/entities/pedido.entity';
import { PedidoStatus } from '../pedido/enums/pedido-status.enum';

@Injectable()
export class MesaService {
  constructor(
    @InjectRepository(Mesa)
    private readonly mesaRepository: Repository<Mesa>,
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
  ) {}

  // --- MÉTODO ATUALIZADO: Aceita posição, tamanho e rotação opcionais ---
  async create(createMesaDto: CreateMesaDto): Promise<Mesa> {
    const { numero, ambienteId, posicao, tamanho, rotacao } = createMesaDto;

    // Valida se ambiente existe
    const ambiente = await this.ambienteRepository.findOne({
      where: { id: ambienteId },
    });
    if (!ambiente) {
      throw new NotFoundException(
        `Ambiente com ID "${ambienteId}" não encontrado.`,
      );
    }

    // Verifica se já existe uma mesa com este número em qualquer ambiente
    const mesaExistente = await this.mesaRepository.findOne({
      where: { numero },
      relations: ['ambiente'],
    });

    if (mesaExistente) {
      if (mesaExistente.ambiente.id === ambienteId) {
        throw new ConflictException(
          `A mesa ${numero} já existe no ambiente "${ambiente.nome}".`
        );
      } else {
        throw new ConflictException(
          `A mesa ${numero} já existe no ambiente "${mesaExistente.ambiente.nome}". Por favor, escolha outro número.`
        );
      }
    }

    // Cria mesa com posição, tamanho e rotação (se fornecidos)
    const mesa = this.mesaRepository.create({
      numero,
      ambiente,
      posicao: posicao || { x: 100, y: 100 }, // Posição padrão
      tamanho: tamanho || { width: 80, height: 80 }, // Tamanho padrão
      rotacao: rotacao !== undefined ? rotacao : 0, // Rotação padrão
    });

    try {
      const mesaSalva = await this.mesaRepository.save(mesa);

      Logger.log(
        `✅ Mesa ${mesa.numero} criada no ambiente "${ambiente.nome}" com posição (${mesa.posicao.x}, ${mesa.posicao.y})`,
        'MesaService',
      );

      return mesaSalva;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(
          `A mesa ${numero} já existe no ambiente "${ambiente.nome}".`,
        );
      }
      throw error;
    }
  }

  async findAll(): Promise<Mesa[]> {
    const mesas = await this.mesaRepository.find({
      relations: ['ambiente', 'comandas', 'comandas.cliente'],
      order: { numero: 'ASC' },
    });
    return mesas.map((mesa) => {
      const comandaAberta = mesa.comandas?.find(
        (comanda) => comanda.status === 'ABERTA',
      );
      return {
        ...mesa,
        status: comandaAberta ? MesaStatus.OCUPADA : MesaStatus.LIVRE,
        comanda: comandaAberta
          ? {
              id: comandaAberta.id,
              cliente: comandaAberta.cliente
                ? {
                    id: comandaAberta.cliente.id,
                    nome: comandaAberta.cliente.nome,
                  }
                : undefined,
              dataAbertura: comandaAberta.dataAbertura,
            }
          : undefined,
      };
    });
  }

  // Endpoint público para clientes - retorna apenas mesas livres
  async findMesasLivres(): Promise<Mesa[]> {
    const mesas = await this.mesaRepository.find({
      relations: ['ambiente', 'comandas'],
      order: { numero: 'ASC' },
    });
    
    // Filtra apenas mesas sem comanda aberta (livres)
    return mesas
      .filter((mesa) => {
        const comandaAberta = mesa.comandas?.find(
          (comanda) => comanda.status === 'ABERTA',
        );
        return !comandaAberta;
      })
      .map((mesa) => ({
        ...mesa,
        status: MesaStatus.LIVRE,
        comandas: undefined, // Remove comandas da resposta pública
      }));
  }

  // --- NOVO: Buscar mesas por ambiente ---
  async findByAmbiente(ambienteId: string): Promise<Mesa[]> {
    const ambiente = await this.ambienteRepository.findOne({
      where: { id: ambienteId },
    });
    if (!ambiente) {
      throw new NotFoundException(
        `Ambiente com ID "${ambienteId}" não encontrado.`,
      );
    }

    const mesas = await this.mesaRepository.find({
      where: { ambiente: { id: ambienteId } },
      relations: ['ambiente', 'comandas'],
      order: { numero: 'ASC' },
    });

    Logger.log(
      `🔍 Buscadas ${mesas.length} mesas do ambiente "${ambiente.nome}"`,
      'MesaService',
    );

    return mesas.map((mesa) => {
      const temComandaAberta = mesa.comandas?.some(
        (comanda) => comanda.status === 'ABERTA',
      );
      return {
        ...mesa,
        status: temComandaAberta ? MesaStatus.OCUPADA : MesaStatus.LIVRE,
      };
    });
  }

  async findOne(id: string): Promise<Mesa> {
    const mesa = await this.mesaRepository.findOne({
      where: { id },
      relations: ['ambiente'],
    });
    if (!mesa) {
      throw new NotFoundException(`Mesa com ID "${id}" não encontrada.`);
    }
    return mesa;
  }

  async update(id: string, updateMesaDto: UpdateMesaDto): Promise<Mesa> {
    const { ambienteId, ...dadosUpdate } = updateMesaDto;

    const mesa = await this.mesaRepository.preload({
      id: id,
      ...dadosUpdate,
    });
    if (!mesa) {
      throw new NotFoundException(`Mesa com ID "${id}" não encontrada.`);
    }

    if (ambienteId) {
      const ambiente = await this.ambienteRepository.findOne({
        where: { id: ambienteId },
      });
      if (!ambiente) {
        throw new NotFoundException(
          `Ambiente com ID "${ambienteId}" não encontrado.`,
        );
      }
      mesa.ambiente = ambiente;
    }

    // NOTA: O update também poderia ter o mesmo tratamento de erro de duplicidade.
    // Vamos focar no create primeiro, mas saiba que seria bom adicionar aqui também.
    return this.mesaRepository.save(mesa);
  }

  async remove(id: string): Promise<void> {
    const mesa = await this.findOne(id);
    await this.mesaRepository.remove(mesa);
  }

  // ===== MÉTODOS DE MAPA VISUAL =====

  async atualizarPosicao(
    id: string,
    dto: AtualizarPosicaoMesaDto,
  ): Promise<Mesa> {
    const mesa = await this.findOne(id);

    mesa.posicao = dto.posicao;
    if (dto.tamanho) {
      mesa.tamanho = dto.tamanho;
    }
    if (dto.rotacao !== undefined) {
      mesa.rotacao = dto.rotacao;
    }

    const mesaAtualizada = await this.mesaRepository.save(mesa);
    Logger.log(
      `Mesa ${mesa.numero} posição atualizada: (${dto.posicao.x}, ${dto.posicao.y})`,
    );

    return mesaAtualizada;
  }

  /**
   * Atualiza posições de múltiplas mesas em uma única operação
   * Evita rate limiting ao fazer batch update
   */
  async atualizarPosicoesBatch(
    dto: AtualizarPosicoesBatchDto,
  ): Promise<{ atualizadas: number }> {
    let atualizadas = 0;

    for (const item of dto.mesas) {
      const mesa = await this.mesaRepository.findOne({ where: { id: item.id } });
      if (mesa) {
        mesa.posicao = item.posicao;
        if (item.tamanho) {
          mesa.tamanho = item.tamanho;
        }
        if (item.rotacao !== undefined) {
          mesa.rotacao = item.rotacao;
        }
        await this.mesaRepository.save(mesa);
        atualizadas++;
      }
    }

    Logger.log(`Batch update: ${atualizadas} mesas atualizadas`);
    return { atualizadas };
  }

  async getMapa(ambienteId: string): Promise<MapaCompletoDto> {
    // Buscar mesas do ambiente
    const mesas = await this.mesaRepository.find({
      where: { ambiente: { id: ambienteId } },
      relations: ['comandas', 'comandas.pedidos'],
      order: { numero: 'ASC' },
    });

    // Buscar pontos de entrega do ambiente
    const pontosEntrega = await this.mesaRepository.manager.find(PontoEntrega, {
      where: { ambientePreparoId: ambienteId },
      relations: ['comandas', 'comandas.pedidos'],
    });

    // Mapear mesas com informações de pedidos
    const mesasMapa: MesaMapaDto[] = mesas.map((mesa) => {
      const comandaAberta = mesa.comandas?.find((c) => c.status === 'ABERTA');

      let pedidosProntos = 0;
      let totalPedidos = 0;

      if (comandaAberta) {
        totalPedidos = comandaAberta.pedidos?.length || 0;
        pedidosProntos =
          comandaAberta.pedidos?.filter((p) => p.status === PedidoStatus.FEITO)
            .length || 0;
      }

      return {
        id: mesa.id,
        numero: mesa.numero,
        status: comandaAberta ? 'OCUPADA' : 'LIVRE',
        posicao: mesa.posicao,
        tamanho: mesa.tamanho || { width: 80, height: 80 },
        rotacao: mesa.rotacao || 0,
        comanda: comandaAberta
          ? {
              id: comandaAberta.id,
              pedidosProntos,
              totalPedidos,
            }
          : undefined,
      };
    });

    // Mapear pontos de entrega
    const pontosEntregaMapa = pontosEntrega.map((ponto) => {
      const comandasAtivas =
        ponto.comandas?.filter((c) => c.status === 'ABERTA') || [];

      let pedidosProntos = 0;
      comandasAtivas.forEach((comanda) => {
        pedidosProntos +=
          comanda.pedidos?.filter((p) => p.status === PedidoStatus.FEITO)
            .length || 0;
      });

      return {
        id: ponto.id,
        nome: ponto.nome,
        ativo: ponto.ativo,
        posicao: ponto.posicao,
        tamanho: ponto.tamanho || { width: 100, height: 60 },
        pedidosProntos,
      };
    });

    return {
      mesas: mesasMapa,
      pontosEntrega: pontosEntregaMapa,
      layout: {
        width: 1200,
        height: 800,
        gridSize: 20,
      },
    };
  }
}
