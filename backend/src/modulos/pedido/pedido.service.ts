// Caminho: backend/src/modulos/pedido/pedido.service.ts

import {
  BadRequestException,
  Injectable,
  Logger, // ALTERADO: Importamos o Logger
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido, PedidoStatus } from './entities/pedido.entity';
import { UpdatePedidoStatusDto } from './dto/update-pedido-status.dto';
import { Comanda } from '../comanda/entities/comanda.entity';
import { Produto } from '../produto/entities/produto.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { ItemPedido } from './entities/item-pedido.entity';

@Injectable()
export class PedidoService {
  // ALTERADO: Iniciamos o Logger para este serviço
  private readonly logger = new Logger(PedidoService.name);

  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    @InjectRepository(ItemPedido)
    private readonly itemPedidoRepository: Repository<ItemPedido>,
    @InjectRepository(Comanda)
    private readonly comandaRepository: Repository<Comanda>,
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
  ) {}

  async create(createPedidoDto: CreatePedidoDto): Promise<Pedido> {
    const { comandaId, itens } = createPedidoDto;

    const comanda = await this.comandaRepository.findOne({ where: { id: comandaId } });
    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${comandaId}" não encontrada.`);
    }

    if (itens.length === 0) {
      throw new BadRequestException('Um pedido não pode ser criado sem itens.');
    }

    const itensPedidoPromise = itens.map(async (itemDto) => {
      const produto = await this.produtoRepository.findOne({ where: { id: itemDto.produtoId } });
      if (!produto) {
        throw new NotFoundException(`Produto com ID "${itemDto.produtoId}" não encontrado.`);
      }
      const itemPedido = this.itemPedidoRepository.create({
        produto: produto,
        quantidade: itemDto.quantidade,
        precoUnitario: produto.preco,
      });
      return itemPedido;
    });

    const itensPedido = await Promise.all(itensPedidoPromise);

    const total = itensPedido.reduce((sum, item) => {
      return sum + item.quantidade * Number(item.precoUnitario);
    }, 0);

    const pedido = this.pedidoRepository.create({
      comanda,
      itens: itensPedido,
      total,
    });

    return this.pedidoRepository.save(pedido);
  }

  async findAll(ambienteId?: string): Promise<Pedido[]> {
    const queryBuilder = this.pedidoRepository.createQueryBuilder('pedido');
    queryBuilder
      .leftJoinAndSelect('pedido.comanda', 'comanda')
      .leftJoinAndSelect('pedido.itens', 'itemPedido')
      .leftJoinAndSelect('itemPedido.produto', 'produto')
      .leftJoinAndSelect('produto.ambiente', 'ambiente');

    if (ambienteId) {
      queryBuilder.where('ambiente.id = :ambienteId', { ambienteId });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id },
      relations: ['comanda', 'itens', 'itens.produto'],
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido com ID "${id}" não encontrado.`);
    }
    return pedido;
  }

  // --- MÉTODO ATUALIZADO ---
  async updateStatus(
    id: string,
    updatePedidoStatusDto: UpdatePedidoStatusDto,
  ): Promise<Pedido> {
    this.logger.debug(`Tentando atualizar status do pedido ID: ${id}`, updatePedidoStatusDto);

    const pedido = await this.findOne(id);
    const { status, motivoCancelamento } = updatePedidoStatusDto;

    // Critério de Aceite #3: Validação da lógica de negócio
    if (status === PedidoStatus.CANCELADO && !motivoCancelamento) {
      throw new BadRequestException('O motivo do cancelamento é obrigatório ao cancelar um pedido.');
    }

    // Boa prática: garantir que o motivo só seja enviado quando o status for CANCELADO
    if (status !== PedidoStatus.CANCELADO && motivoCancelamento) {
      throw new BadRequestException('Motivo de cancelamento só pode ser fornecido ao cancelar um pedido.');
    }

    pedido.status = status;
    // Se o status for CANCELADO, salva o motivo. Senão, garante que o campo fique nulo.
    pedido.motivoCancelamento = status === PedidoStatus.CANCELADO ? motivoCancelamento : null;

    this.logger.debug(`Salvando pedido ID: ${id} com novos dados`, pedido);
    return this.pedidoRepository.save(pedido);
  }
  // --- FIM DO MÉTODO ATUALIZADO ---
  
  async update(id: string, updatePedidoDto: UpdatePedidoDto): Promise<Pedido> {
    const pedido = await this.pedidoRepository.preload({ id, ...updatePedidoDto });
    if (!pedido) {
      throw new NotFoundException(`Pedido com ID "${id}" não encontrada.`);
    }
    return this.pedidoRepository.save(pedido);
  }

  async remove(id: string): Promise<void> {
    const pedido = await this.findOne(id);
    await this.pedidoRepository.remove(pedido);
  }
}