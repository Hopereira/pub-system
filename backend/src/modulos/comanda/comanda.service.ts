import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../cliente/entities/cliente.entity';
// NOVO: Importamos também o MesaStatus
import { Mesa, MesaStatus } from '../mesa/entities/mesa.entity';
import { CreateComandaDto } from './dto/create-comanda.dto';
import { UpdateComandaDto } from './dto/update-comanda.dto';
import { Comanda, ComandaStatus } from './entities/comanda.entity';

@Injectable()
export class ComandaService {
  constructor(
    @InjectRepository(Comanda)
    private readonly comandaRepository: Repository<Comanda>,
    @InjectRepository(Mesa)
    private readonly mesaRepository: Repository<Mesa>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
  ) {}

  async create(createComandaDto: CreateComandaDto): Promise<Comanda> {
    const { mesaId, clienteId } = createComandaDto;

    if (!mesaId && !clienteId) {
      throw new BadRequestException(
        'A comanda precisa estar associada a uma mesa ou a um cliente.',
      );
    }

    if (mesaId && clienteId) {
      throw new BadRequestException(
        'A comanda não pode ser associada a uma mesa e a um cliente simultaneamente.',
      );
    }

    let comandaData: Partial<Comanda> = {};

    if (mesaId) {
      const mesa = await this.mesaRepository.findOne({ where: { id: mesaId } });
      if (!mesa) {
        throw new NotFoundException(`Mesa com ID "${mesaId}" não encontrada.`);
      }

      // --- LÓGICA DE NEGÓCIO ADICIONADA AQUI ---
      // 1. Verifica se a mesa já não está ocupada
      if (mesa.status !== MesaStatus.LIVRE) {
        throw new BadRequestException(`A Mesa ${mesa.numero} já está ocupada.`);
      }

      // 2. Atualiza o status da mesa para OCUPADA e salva a alteração
      mesa.status = MesaStatus.OCUPADA;
      await this.mesaRepository.save(mesa);

      comandaData.mesa = mesa;
    }

    if (clienteId) {
      // ... (lógica de cliente permanece a mesma)
      const cliente = await this.clienteRepository.findOne({
        where: { id: clienteId },
      });
      if (!cliente) {
        throw new NotFoundException(
          `Cliente com ID "${clienteId}" não encontrado.`,
        );
      }
      comandaData.cliente = cliente;
    }

    const comanda = this.comandaRepository.create(comandaData);
    return this.comandaRepository.save(comanda);
  }

  findAll(): Promise<Comanda[]> {
    return this.comandaRepository.find({
      relations: ['mesa', 'cliente'],
    });
  }

  async findOne(id: string): Promise<Comanda> {
    const comanda = await this.comandaRepository.findOne({
      where: { id },
      relations: [
        'mesa',
        'cliente',
        'pedidos',
        'pedidos.itens',
        'pedidos.itens.produto',
      ],
    });
    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`);
    }
    return comanda;
  }
  
  async findAbertaByMesaId(mesaId: string): Promise<Comanda> {
    const comanda = await this.comandaRepository.findOne({
      where: {
        mesa: { id: mesaId },
        status: ComandaStatus.ABERTA,
      },
    });

    if (!comanda) {
      throw new NotFoundException(
        `Nenhuma comanda aberta encontrada para a mesa com ID "${mesaId}".`,
      );
    }
    return comanda;
  }

  async findPublicOne(id: string) {
    // ... (este método permanece igual)
    const comanda = await this.comandaRepository.findOne({
      where: { id },
      relations: [
        'mesa',
        'cliente',
        'pedidos',
        'pedidos.itens',
        'pedidos.itens.produto',
      ],
    });

    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`);
    }

    const totalComanda = comanda.pedidos.reduce((total, pedido) => {
      return total + Number(pedido.total);
    }, 0);

    return {
      id: comanda.id,
      status: comanda.status,
      mesa: comanda.mesa ? { numero: comanda.mesa.numero } : null,
      cliente: comanda.cliente ? { nome: comanda.cliente.nome } : null,
      pedidos: comanda.pedidos.map((pedido) => ({
        id: pedido.id,
        status: pedido.status,
        total: pedido.total,
        itens: pedido.itens.map((item) => ({
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          produto: {
            nome: item.produto.nome,
            descricao: item.produto.descricao,
          },
        })),
      })),
      totalComanda,
    };
  }

  async update(
    id: string,
    updateComandaDto: UpdateComandaDto,
  ): Promise<Comanda> {
    const comanda = await this.comandaRepository.preload({
      id,
      ...updateComandaDto,
    });
    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`);
    }
    return this.comandaRepository.save(comanda);
  }

  async remove(id: string): Promise<void> {
    const comanda = await this.findOne(id);
    await this.comandaRepository.remove(comanda);
  }
}