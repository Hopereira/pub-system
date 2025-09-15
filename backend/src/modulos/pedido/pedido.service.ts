// Caminho: backend/src/modulos/pedido/pedido.service.ts

import {
  BadRequestException,
  Injectable,
  Logger,
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
// --- ADIÇÃO: Importamos o nosso gateway ---
import { PedidosGateway } from './pedidos.gateway';

@Injectable()
export class PedidoService {
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
    // --- ALTERAÇÃO: Injetamos o PedidosGateway para que o serviço possa usá-lo ---
    private readonly pedidosGateway: PedidosGateway,
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

    // ... (lógica para criar os itens do pedido não foi alterada)
    const itensPedidoPromise = itens.map(async (itemDto) => {
      const produto = await this.produtoRepository.findOne({ where: { id: itemDto.produtoId } });
      if (!produto) {
        throw new NotFoundException(`Produto com ID "${itemDto.produtoId}" não encontrado.`);
      }
      const itemPedido = this.itemPedidoRepository.create({
        produto: produto,
        quantidade: itemDto.quantidade,
        precoUnitario: produto.preco,
        observacao: itemDto.observacao, // Garantir que a observação seja salva
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

    const novoPedido = await this.pedidoRepository.save(pedido);

    // --- ADIÇÃO: Após salvar, emitimos o evento de novo pedido ---
    // Precisamos buscar o pedido com as relações para enviar dados completos
    const pedidoCompleto = await this.findOne(novoPedido.id);
    this.pedidosGateway.emitNovoPedido(pedidoCompleto);
    // --- FIM DA ADIÇÃO ---

    return pedidoCompleto;
  }

  async findAll(ambienteId?: string): Promise<Pedido[]> {
    // ... (código do findAll não foi alterado)
    const queryBuilder = this.pedidoRepository.createQueryBuilder('pedido');
    queryBuilder
      .leftJoinAndSelect('pedido.comanda', 'comanda')
      .leftJoinAndSelect('comanda.mesa', 'mesa') // Incluído para ter o número da mesa
      .leftJoinAndSelect('pedido.itens', 'itemPedido')
      .leftJoinAndSelect('itemPedido.produto', 'produto')
      .leftJoinAndSelect('produto.ambiente', 'ambiente')
      .orderBy('pedido.data', 'ASC'); // Ordena por mais antigo primeiro

    if (ambienteId) {
      queryBuilder.where('ambiente.id = :ambienteId', { ambienteId });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id },
      relations: ['comanda', 'comanda.mesa', 'itens', 'itens.produto'],
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido com ID "${id}" não encontrado.`);
    }
    return pedido;
  }

  async updateStatus(
    id: string,
    updatePedidoStatusDto: UpdatePedidoStatusDto,
  ): Promise<Pedido> {
    this.logger.debug(`Tentando atualizar status do pedido ID: ${id}`, updatePedidoStatusDto);

    const pedido = await this.findOne(id);
    const { status, motivoCancelamento } = updatePedidoStatusDto;

    // ... (lógica de validação não foi alterada)
    if (status === PedidoStatus.CANCELADO && !motivoCancelamento) {
      throw new BadRequestException('O motivo do cancelamento é obrigatório ao cancelar um pedido.');
    }
    if (status !== PedidoStatus.CANCELADO && motivoCancelamento) {
      throw new BadRequestException('Motivo de cancelamento só pode ser fornecido ao cancelar um pedido.');
    }

    pedido.status = status;
    pedido.motivoCancelamento = status === PedidoStatus.CANCELADO ? motivoCancelamento : null;

    const pedidoAtualizado = await this.pedidoRepository.save(pedido);
    
    // --- ADIÇÃO: Após atualizar, emitimos o evento de status atualizado ---
    this.pedidosGateway.emitStatusAtualizado(pedidoAtualizado);
    // --- FIM DA ADIÇÃO ---
    
    this.logger.debug(`Pedido ID: ${id} salvo com novos dados`, pedidoAtualizado);
    return pedidoAtualizado;
  }
  
  // ... (métodos update e remove não foram alterados)
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