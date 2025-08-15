import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comanda } from '../comanda/entities/comanda.entity';
import { Produto } from '../produto/entities/produto.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { ItemPedido } from './entities/item-pedido.entity';
import { Pedido } from './entities/pedido.entity';

@Injectable()
export class PedidoService {
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

    // Passo 1: Validar a comanda
    const comanda = await this.comandaRepository.findOne({
      where: { id: comandaId },
    });
    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${comandaId}" não encontrada.`);
    }

    if (itens.length === 0) {
      throw new BadRequestException('Um pedido não pode ser criado sem itens.');
    }

    // Passo 2: Buscar todos os produtos e criar os Itens do Pedido
    const itensPedidoPromise = itens.map(async (itemDto) => {
      const produto = await this.produtoRepository.findOne({
        where: { id: itemDto.produtoId },
      });
      if (!produto) {
        throw new NotFoundException(
          `Produto com ID "${itemDto.produtoId}" não encontrado.`,
        );
      }
      const itemPedido = this.itemPedidoRepository.create({
        produto: produto,
        quantidade: itemDto.quantidade,
        precoUnitario: produto.preco, // Salva o preço no momento da compra
      });
      return itemPedido;
    });

    const itensPedido = await Promise.all(itensPedidoPromise);

    // Passo 3: Calcular o total do pedido
    const total = itensPedido.reduce((sum, item) => {
      return sum + item.quantidade * Number(item.precoUnitario);
    }, 0);

    // Passo 4: Criar o Pedido principal e salvar
    const pedido = this.pedidoRepository.create({
      comanda,
      itens: itensPedido,
      total,
    });

    return this.pedidoRepository.save(pedido);
  }

  findAll(): Promise<Pedido[]> {
    return this.pedidoRepository.find({
      relations: ['comanda', 'itens', 'itens.produto'],
    });
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

  // A lógica de update e remove pode ser bem complexa (ex: atualizar status, remover itens)
  // Por enquanto, vamos manter uma versão simples.
  async update(id: string, updatePedidoDto: UpdatePedidoDto): Promise<Pedido> {
    const pedido = await this.pedidoRepository.preload({
      id,
      ...updatePedidoDto,
    });
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