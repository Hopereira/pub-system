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
    private readonly pedidosGateway: PedidosGateway,
  ) {}

  async create(createPedidoDto: CreatePedidoDto): Promise<Pedido> {
    const { comandaId, itens } = createPedidoDto;
    const comanda = await this.comandaRepository.findOne({ where: { id: comandaId } });
    if (!comanda) { throw new NotFoundException(`Comanda com ID "${comandaId}" não encontrada.`); }
    if (itens.length === 0) { throw new BadRequestException('Um pedido não pode ser criado sem itens.'); }
    
    const itensPedidoPromise = itens.map(async (itemDto) => {
      const produto = await this.produtoRepository.findOne({ where: { id: itemDto.produtoId }, relations: ['ambiente'] });
      if (!produto) { throw new NotFoundException(`Produto com ID "${itemDto.produtoId}" não encontrado.`); }
      const itemPedido = this.itemPedidoRepository.create({
        produto: produto,
        quantidade: itemDto.quantidade,
        precoUnitario: produto.preco,
        observacao: itemDto.observacao,
      });
      return itemPedido;
    });
    const itensPedido = await Promise.all(itensPedidoPromise);
    const total = itensPedido.reduce((sum, item) => sum + item.quantidade * Number(item.precoUnitario), 0);
    const pedido = this.pedidoRepository.create({ comanda, itens: itensPedido, total });
    const novoPedido = await this.pedidoRepository.save(pedido);
    const pedidoCompleto = await this.findOne(novoPedido.id);
    this.pedidosGateway.emitNovoPedido(pedidoCompleto);
    return pedidoCompleto;
  }

  async findAll(ambienteId?: string): Promise<Pedido[]> {
    const queryBuilder = this.pedidoRepository.createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.comanda', 'comanda')
      .leftJoinAndSelect('comanda.mesa', 'mesa')
      .leftJoinAndSelect('pedido.itens', 'itemPedido')
      .leftJoinAndSelect('itemPedido.produto', 'produto')
      .leftJoinAndSelect('produto.ambiente', 'ambiente')
      .where('pedido.status IN (:...statuses)', { statuses: [PedidoStatus.FEITO, PedidoStatus.EM_PREPARO, PedidoStatus.PRONTO] })
      .orderBy('pedido.data', 'ASC');

    if (ambienteId) {
      queryBuilder.andWhere('ambiente.id = :ambienteId', { ambienteId });
      const pedidosComItensMisturados = await queryBuilder.getMany();
      const pedidosFiltrados = pedidosComItensMisturados
        .map(pedido => {
          const itensDoAmbiente = pedido.itens.filter(
            item => item.produto.ambiente && item.produto.ambiente.id === ambienteId
          );
          return { ...pedido, itens: itensDoAmbiente };
        })
        .filter(pedido => pedido.itens.length > 0);
      return pedidosFiltrados;
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Pedido> {
    const pedido = await this.pedidoRepository.findOne({
      where: { id },
      relations: ['comanda', 'comanda.mesa', 'itens', 'itens.produto', 'itens.produto.ambiente'],
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
    const pedido = await this.findOne(id);
    const { status, motivoCancelamento } = updatePedidoStatusDto;

    if (status === PedidoStatus.CANCELADO && !motivoCancelamento) {
      throw new BadRequestException('O motivo do cancelamento é obrigatório ao cancelar um pedido.');
    }
    if (status !== PedidoStatus.CANCELADO && motivoCancelamento) {
      throw new BadRequestException('Motivo de cancelamento só pode ser fornecido ao cancelar um pedido.');
    }

    pedido.status = status;
    pedido.motivoCancelamento = status === PedidoStatus.CANCELADO ? motivoCancelamento : null;
    const pedidoAtualizado = await this.pedidoRepository.save(pedido);
    this.pedidosGateway.emitStatusAtualizado(pedidoAtualizado);
    return pedidoAtualizado;
  }
  
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