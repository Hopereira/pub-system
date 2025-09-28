// Caminho: backend/src/modulos/comanda/comanda.service.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Cliente } from '../cliente/entities/cliente.entity';
import { Mesa, MesaStatus } from '../mesa/entities/mesa.entity';
import { CreateComandaDto } from './dto/create-comanda.dto';
import { UpdateComandaDto } from './dto/update-comanda.dto';
import { Comanda, ComandaStatus } from './entities/comanda.entity';
import { PedidosGateway } from '../pedido/pedidos.gateway';
import { PedidoStatus } from '../pedido/enums/pedido-status.enum'; // Importamos o enum

@Injectable()
export class ComandaService {
  private readonly logger = new Logger(ComandaService.name);

  constructor(
    @InjectRepository(Comanda)
    private readonly comandaRepository: Repository<Comanda>,
    @InjectRepository(Mesa)
    private readonly mesaRepository: Repository<Mesa>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    private readonly pedidosGateway: PedidosGateway,
  ) {}

  // ... (métodos create, findAll, search continuam iguais)
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
      if (mesa.status !== MesaStatus.LIVRE) {
        throw new BadRequestException(`A Mesa ${mesa.numero} já está ocupada.`);
      }
      mesa.status = MesaStatus.OCUPADA;
      await this.mesaRepository.save(mesa);
      comandaData.mesa = mesa;
    }
    if (clienteId) {
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
    return this.comandaRepository.find({ relations: ['mesa', 'cliente'] });
  }

  async search(term: string): Promise<Comanda[]> {
    const queryBuilder = this.comandaRepository.createQueryBuilder('comanda');
    queryBuilder
      .leftJoinAndSelect('comanda.mesa', 'mesa')
      .leftJoinAndSelect('comanda.cliente', 'cliente')
      .where('comanda.status = :status', { status: ComandaStatus.ABERTA });
    if (term) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          if (!isNaN(parseInt(term, 10))) {
            qb.where('mesa.numero = :numero', { numero: parseInt(term, 10) });
          } else {
            qb.where('cliente.nome ILIKE :term', { term: `%${term}%` }).orWhere(
              'cliente.cpf = :term',
              { term },
            );
          }
        }),
      );
    }
    return queryBuilder.getMany();
  }


  // ==================================================================
  // ## CORREÇÃO PRINCIPAL ESTÁ AQUI ##
  // ==================================================================
  async findOne(id: string): Promise<Comanda> {
    const comanda = await this.comandaRepository
      .createQueryBuilder('comanda')
      .leftJoinAndSelect('comanda.mesa', 'mesa')
      .leftJoinAndSelect('comanda.cliente', 'cliente')
      .leftJoinAndSelect('comanda.pedidos', 'pedido')
      .leftJoinAndSelect('pedido.itens', 'itemPedido')
      .leftJoinAndSelect('itemPedido.produto', 'produto')
      .where('comanda.id = :id', { id })
      .orderBy('pedido.data', 'ASC')
      .getOne();

    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`);
    }

    // Recalcula dinamicamente os totais para garantir que estão sempre corretos
    let totalComandaCalculado = 0;
    if (comanda.pedidos) {
      comanda.pedidos.forEach(pedido => {
        const totalPedidoCalculado = pedido.itens.reduce((sum, item) => {
          if (item.status !== PedidoStatus.CANCELADO) {
            return sum + (Number(item.precoUnitario) * item.quantidade);
          }
          return sum;
        }, 0);
        
        pedido.total = totalPedidoCalculado; // Sobrescrevemos o total antigo do pedido
        totalComandaCalculado += totalPedidoCalculado;
      });
    }

    // Adicionamos uma propriedade 'total' à comanda para uso no frontend.
    // O 'as any' é um truque para adicionar uma propriedade que não está na entidade.
    (comanda as any).total = totalComandaCalculado;
    
    this.logger.debug(
      `[DIAGNÓSTICO findOne] Comanda ID ${id} com totais RECALCULADOS:`,
      JSON.stringify(comanda, null, 2),
    );

    return comanda;
  }

  // ... (método findAbertaByMesaId continua igual)
  async findAbertaByMesaId(mesaId: string): Promise<Comanda> {
    const comanda = await this.comandaRepository.findOne({
      where: { mesa: { id: mesaId }, status: ComandaStatus.ABERTA },
    });
    if (!comanda) {
      throw new NotFoundException(
        `Nenhuma comanda aberta encontrada para a mesa com ID "${mesaId}".`,
      );
    }
    return comanda;
  }

  // O findPublicOne também vai beneficiar do findOne recalculado
  async findPublicOne(id: string) {
    const comanda = await this.findOne(id); // Este agora já vem com os totais corretos!
    
    return {
      id: comanda.id,
      status: comanda.status,
      mesa: comanda.mesa ? { numero: comanda.mesa.numero } : null,
      cliente: comanda.cliente ? { nome: comanda.cliente.nome } : null,
      pedidos: comanda.pedidos, // Podemos enviar os pedidos completos
      totalComanda: (comanda as any).total,
    };
  }

  async fecharComanda(id: string): Promise<Comanda> {
    const comanda = await this.comandaRepository.findOne({
      where: { id },
      relations: ['mesa'],
    });
    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`);
    }
    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new BadRequestException(
        'Apenas comandas com status ABERTA podem ser fechadas.',
      );
    }
    comanda.status = ComandaStatus.FECHADA;
    if (comanda.mesa) {
      comanda.mesa.status = MesaStatus.LIVRE;
      await this.mesaRepository.save(comanda.mesa);
    }

    const comandaFechada = await this.comandaRepository.save(comanda);
    this.pedidosGateway.emitComandaAtualizada(comandaFechada);
    
    return comandaFechada;
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
    const comandaAtualizada = await this.comandaRepository.save(comanda);
    
    this.pedidosGateway.emitComandaAtualizada(comandaAtualizada);
    
    return comandaAtualizada;
  }

  async remove(id: string): Promise<void> {
    const comanda = await this.findOne(id);
    await this.comandaRepository.remove(comanda);
  }
}