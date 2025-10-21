import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pedido } from './entities/pedido.entity';
import { Comanda } from '../comanda/entities/comanda.entity';
import { Produto } from '../produto/entities/produto.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { ItemPedido } from './entities/item-pedido.entity';
import { UpdateItemPedidoStatusDto } from './dto/update-item-pedido-status.dto';
import { PedidoStatus } from './enums/pedido-status.enum';
import { PedidosGateway } from './pedidos.gateway';

@Injectable()
export class PedidoService {
  private readonly logger = new Logger(PedidoService.name);

  // ... (construtor e outros métodos permanecem os mesmos)
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

  // ==================================================================
  // ## MÉTODO CREATE COM DIAGNÓSTICO ##
  // ==================================================================
  async create(createPedidoDto: CreatePedidoDto): Promise<Pedido> {
    const { comandaId, itens } = createPedidoDto;
    
    this.logger.log(`📝 Criando novo pedido | Comanda: ${comandaId} | ${itens.length} itens`);

    const comanda = await this.comandaRepository.findOne({ where: { id: comandaId } });
    if (!comanda) {
      this.logger.warn(`⚠️ Tentativa de criar pedido para comanda inexistente: ${comandaId}`);
      throw new NotFoundException(`Comanda com ID "${comandaId}" não encontrada.`);
    }
    if (!itens || itens.length === 0) {
      this.logger.warn(`⚠️ Tentativa de criar pedido sem itens | Comanda: ${comandaId}`);
      throw new BadRequestException('Um pedido não pode ser criado sem itens.');
    }

    const itensPedidoPromise = itens.map(async (itemDto) => {
      const produto = await this.produtoRepository.findOne({ where: { id: itemDto.produtoId } });
      if (!produto) {
        this.logger.warn(`⚠️ Tentativa de criar item de pedido para produto inexistente: ${itemDto.produtoId}`);
        throw new NotFoundException(`Produto com ID "${itemDto.produtoId}" não encontrado.`);
      }
      return this.itemPedidoRepository.create({
        produto,
        quantidade: itemDto.quantidade,
        precoUnitario: produto.preco,
        observacao: itemDto.observacao,
        status: PedidoStatus.FEITO,
      });
    });

    const itensPedido = await Promise.all(itensPedidoPromise);
    const total = itensPedido.reduce((sum, item) => sum + item.quantidade * Number(item.precoUnitario), 0);
    
    const pedido = this.pedidoRepository.create({
      comanda,
      itens: itensPedido,
      total,
      status: PedidoStatus.FEITO,
    });
    this.logger.debug('[DIAGNÓSTICO] - 2. Objeto Pedido criado em memória (antes de salvar)', JSON.stringify(pedido, null, 2));

    const novoPedido = await this.pedidoRepository.save(pedido);
    this.logger.debug('[DIAGNÓSTICO] - 3. Objeto Pedido retornado pelo .save()', JSON.stringify(novoPedido, null, 2));
    
    const pedidoCompleto = await this.findOne(novoPedido.id);
    this.logger.debug('[DIAGNÓSTICO] - 4. Objeto Pedido recarregado do DB com findOne()', JSON.stringify(pedidoCompleto, null, 2));

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
    .select([ // ✅ A CORREÇÃO ESTÁ AQUI
      'pedido',
      'comanda',
      'mesa',
      'itemPedido', // ✅ Isso garante que TODOS os campos de ItemPedido (incluindo id e status) sejam retornados
      'produto',
      'ambiente'
    ])
    .where('itemPedido.status IN (:...statuses)', {
      statuses: [PedidoStatus.FEITO, PedidoStatus.EM_PREPARO, PedidoStatus.PRONTO]
    })
    .orderBy('pedido.data', 'ASC');

  if (ambienteId) {
    queryBuilder.andWhere('ambiente.id = :ambienteId', { ambienteId });
  }

  const pedidos = await queryBuilder.getMany();
  let pedidosFiltrados = pedidos;

  if (ambienteId) {
    pedidosFiltrados = pedidos.map(pedido => ({
      ...pedido,
      itens: pedido.itens.filter(item => item.produto.ambiente?.id === ambienteId),
    })).filter(pedido => pedido.itens.length > 0);
  }

  // DIAGNÓSTICO DEFINITIVO NO BACKEND
  console.log(
    '[BACKEND DIAGNOSTIC] Dados que serão enviados para o frontend:',
    JSON.stringify(pedidosFiltrados, null, 2)
  );

  return pedidosFiltrados;
}
//----------------------------------------------------------
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

  async updateItemStatus(itemPedidoId: string, updateDto: UpdateItemPedidoStatusDto): Promise<ItemPedido> {
    const itemPedido = await this.itemPedidoRepository.findOne({
      where: { id: itemPedidoId },
      relations: ['pedido', 'produto'],
    });

    if (!itemPedido) {
      this.logger.warn(`⚠️ Tentativa de atualizar status de item inexistente: ${itemPedidoId}`);
      throw new NotFoundException(`Item de pedido com ID "${itemPedidoId}" não encontrado.`);
    }

    const statusAnterior = itemPedido.status;
    itemPedido.status = updateDto.status;
    
    if (updateDto.status === PedidoStatus.CANCELADO) {
      itemPedido.motivoCancelamento = updateDto.motivoCancelamento;
      this.logger.warn(`🚫 Item cancelado: ${itemPedido.produto?.nome || 'Produto'} | Motivo: ${updateDto.motivoCancelamento}`);
    } else {
      this.logger.log(`🔄 Status alterado: ${itemPedido.produto?.nome || 'Produto'} | ${statusAnterior} → ${updateDto.status}`);
    }

    const itemAtualizado = await this.itemPedidoRepository.save(itemPedido);
    
    const pedidoPaiCompleto = await this.findOne(itemAtualizado.pedido.id);
    this.pedidosGateway.emitStatusAtualizado(pedidoPaiCompleto);

    return itemAtualizado;
  }
  
  async update(id: string, updatePedidoDto: UpdatePedidoDto): Promise<Pedido> {
      const pedido = await this.pedidoRepository.preload({ id, ...updatePedidoDto });
      if (!pedido) {
        throw new NotFoundException(`Pedido com ID "${id}" não encontrado.`);
      }
      return this.pedidoRepository.save(pedido);
  }
  
  async remove(id: string): Promise<void> {
      const pedido = await this.findOne(id);
      await this.pedidoRepository.remove(pedido);
  }
}