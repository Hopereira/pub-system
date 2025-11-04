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
import { DeixarNoAmbienteDto } from './dto/deixar-no-ambiente.dto';
import { PedidoStatus } from './enums/pedido-status.enum';
import { PedidosGateway } from './pedidos.gateway';
import { Ambiente } from '../ambiente/entities/ambiente.entity';
import Decimal from 'decimal.js';

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
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
    private readonly pedidosGateway: PedidosGateway,
  ) {}

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
    
    // Usar Decimal.js para cálculos monetários precisos
    const total = itensPedido.reduce((sum, item) => {
      const itemTotal = new Decimal(item.quantidade).times(new Decimal(item.precoUnitario));
      return sum.plus(itemTotal);
    }, new Decimal(0));
    
    const pedido = this.pedidoRepository.create({
      comanda,
      itens: itensPedido,
      total: total.toNumber(),
      status: PedidoStatus.FEITO,
    });

    const novoPedido = await this.pedidoRepository.save(pedido);
    const pedidoCompleto = await this.findOne(novoPedido.id);
    
    this.logger.log(`✅ Pedido criado com sucesso | ID: ${pedidoCompleto.id} | Total: R$ ${total.toFixed(2)} | Itens: ${itensPedido.length}`);

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
    .leftJoinAndSelect('itemPedido.ambienteRetirada', 'ambienteRetirada')
    .select([ // ✅ A CORREÇÃO ESTÁ AQUI
      'pedido',
      'comanda',
      'mesa',
      'itemPedido', // ✅ Isso garante que TODOS os campos de ItemPedido (incluindo id e status) sejam retornados
      'produto',
      'ambiente',
      'ambienteRetirada'
    ])
    .where('itemPedido.status IN (:...statuses)', {
      statuses: [PedidoStatus.FEITO, PedidoStatus.EM_PREPARO, PedidoStatus.PRONTO, PedidoStatus.DEIXADO_NO_AMBIENTE]
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
    this.logger.debug(`🔍 Filtro por ambiente aplicado | Ambiente: ${ambienteId} | Pedidos: ${pedidosFiltrados.length}`);
  }

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
    
    // Registra timestamps para cálculo de tempo de preparo
    const agora = new Date();
    if (updateDto.status === PedidoStatus.EM_PREPARO && !itemPedido.iniciadoEm) {
      itemPedido.iniciadoEm = agora;
      this.logger.log(`⏱️ Preparo iniciado: ${itemPedido.produto?.nome || 'Produto'}`);
    } else if (updateDto.status === PedidoStatus.PRONTO && !itemPedido.prontoEm) {
      itemPedido.prontoEm = agora;
      const tempoPreparo = itemPedido.iniciadoEm 
        ? Math.round((agora.getTime() - itemPedido.iniciadoEm.getTime()) / 60000)
        : null;
      this.logger.log(`✅ Item pronto: ${itemPedido.produto?.nome || 'Produto'} | Tempo: ${tempoPreparo || '?'} min`);
    } else if (updateDto.status === PedidoStatus.ENTREGUE && !itemPedido.entregueEm) {
      itemPedido.entregueEm = agora;
      const tempoTotal = itemPedido.iniciadoEm
        ? Math.round((agora.getTime() - itemPedido.iniciadoEm.getTime()) / 60000)
        : null;
      this.logger.log(`🎉 Item entregue: ${itemPedido.produto?.nome || 'Produto'} | Tempo total: ${tempoTotal || '?'} min`);
    }
    
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

  // ==================== NOVOS MÉTODOS ====================

  /**
   * Lista pedidos prontos para entrega (status PRONTO)
   * Formatado com informações de localização (Mesa ou Ponto de Entrega)
   */
  async findProntos(ambienteId?: string): Promise<any[]> {
    const queryBuilder = this.pedidoRepository.createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.comanda', 'comanda')
      .leftJoinAndSelect('comanda.mesa', 'mesa')
      .leftJoinAndSelect('mesa.ambiente', 'mesaAmbiente')
      .leftJoinAndSelect('comanda.pontoEntrega', 'pontoEntrega')
      .leftJoinAndSelect('pontoEntrega.mesaProxima', 'mesaProxima')
      .leftJoinAndSelect('pontoEntrega.ambientePreparo', 'ambientePreparo')
      .leftJoinAndSelect('comanda.cliente', 'cliente')
      .leftJoinAndSelect('pedido.itens', 'itemPedido')
      .leftJoinAndSelect('itemPedido.produto', 'produto')
      .where('itemPedido.status = :status', { status: PedidoStatus.PRONTO })
      .orderBy('pedido.data', 'ASC');

    if (ambienteId) {
      queryBuilder
        .leftJoinAndSelect('produto.ambiente', 'produtoAmbiente')
        .andWhere('produtoAmbiente.id = :ambienteId', { ambienteId });
    }

    const pedidos = await queryBuilder.getMany();

    this.logger.log(`📋 Listando pedidos prontos | Ambiente: ${ambienteId || 'Todos'} | Quantidade: ${pedidos.length}`);

    // Formata resposta com informações de localização
    return pedidos.map(pedido => {
      const tempoEspera = Math.floor((Date.now() - new Date(pedido.data).getTime()) / 60000);

      return {
        pedidoId: pedido.id,
        comandaId: pedido.comanda.id,
        cliente: pedido.comanda.cliente?.nome || 'Cliente Avulso',
        local: pedido.comanda.mesa
          ? {
              tipo: 'MESA',
              mesa: {
                numero: pedido.comanda.mesa.numero,
                ambiente: pedido.comanda.mesa.ambiente?.nome,
              },
            }
          : {
              tipo: 'PONTO_ENTREGA',
              pontoEntrega: {
                nome: pedido.comanda.pontoEntrega?.nome || 'N/A',
                mesaProxima: pedido.comanda.pontoEntrega?.mesaProxima?.numero,
                ambientePreparo: pedido.comanda.pontoEntrega?.ambientePreparo?.nome,
              },
            },
        itens: pedido.itens.filter(item => item.status === PedidoStatus.PRONTO),
        tempoEspera: `${tempoEspera} min`,
        data: pedido.data,
      };
    });
  }

  /**
   * Marca item como DEIXADO_NO_AMBIENTE quando cliente não é encontrado
   * Notifica cliente via WebSocket
   */
  async deixarNoAmbiente(
    itemPedidoId: string,
    dto: DeixarNoAmbienteDto,
  ): Promise<ItemPedido> {
    const item = await this.itemPedidoRepository.findOne({
      where: { id: itemPedidoId },
      relations: [
        'pedido',
        'pedido.comanda',
        'pedido.comanda.pontoEntrega',
        'pedido.comanda.pontoEntrega.ambientePreparo',
        'pedido.comanda.mesa',
        'pedido.comanda.mesa.ambiente',
        'produto',
      ],
    });

    if (!item) {
      this.logger.warn(`⚠️ Tentativa de deixar no ambiente - Item não encontrado: ${itemPedidoId}`);
      throw new NotFoundException('Item de pedido não encontrado');
    }

    if (item.status !== PedidoStatus.PRONTO) {
      throw new BadRequestException('Apenas itens com status PRONTO podem ser deixados no ambiente');
    }

    const { comanda } = item.pedido;
    let ambienteRetirada: Ambiente;

    // Busca ambiente de retirada baseado no tipo de comanda
    if (comanda.pontoEntrega) {
      ambienteRetirada = await this.ambienteRepository.findOne({
        where: { id: comanda.pontoEntrega.ambientePreparoId },
      });
    } else if (comanda.mesa) {
      // Mesa tem relação 'ambiente', não 'ambienteId'
      ambienteRetirada = comanda.mesa.ambiente;
    }

    if (!ambienteRetirada) {
      throw new NotFoundException('Ambiente de retirada não encontrado');
    }

    // Atualiza item
    item.status = PedidoStatus.DEIXADO_NO_AMBIENTE;
    item.ambienteRetiradaId = ambienteRetirada.id;
    item.ambienteRetirada = ambienteRetirada;

    await this.itemPedidoRepository.save(item);

    this.logger.log(
      `📦 Item deixado no ambiente | Produto: ${item.produto?.nome || 'Item'} → ${ambienteRetirada.nome} | Motivo: ${dto.motivo || 'Cliente não encontrado'}`,
    );

    // Notifica cliente via WebSocket
    this.pedidosGateway.server
      .to(`comanda_${comanda.id}`)
      .emit('item_deixado_no_ambiente', {
        itemId: item.id,
        produtoNome: item.produto?.nome,
        ambiente: ambienteRetirada.nome,
        mensagem: `Seu pedido está pronto para retirada no ${ambienteRetirada.nome}`,
      });

    return item;
  }
}