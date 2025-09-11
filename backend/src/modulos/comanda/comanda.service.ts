// Caminho: backend/src/modulos/comanda/comanda.service.ts

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Cliente } from '../cliente/entities/cliente.entity';
import { Mesa, MesaStatus } from '../mesa/entities/mesa.entity';
import { Pedido, PedidoStatus } from '../pedido/entities/pedido.entity';
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
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
  ) {}

  async create(createComandaDto: CreateComandaDto): Promise<Comanda> {
    const { mesaId, clienteId } = createComandaDto;
    if (!mesaId && !clienteId) { throw new BadRequestException('A comanda precisa estar associada a uma mesa ou a um cliente.'); }
    if (mesaId && clienteId) { throw new BadRequestException('A comanda não pode ser associada a uma mesa e a um cliente simultaneamente.'); }
    let comandaData: Partial<Comanda> = {};
    if (mesaId) {
      const mesa = await this.mesaRepository.findOne({ where: { id: mesaId } });
      if (!mesa) { throw new NotFoundException(`Mesa com ID "${mesaId}" não encontrada.`); }
      if (mesa.status !== MesaStatus.LIVRE) { throw new BadRequestException(`A Mesa ${mesa.numero} já está ocupada.`); }
      mesa.status = MesaStatus.OCUPADA;
      await this.mesaRepository.save(mesa);
      comandaData.mesa = mesa;
    }
    if (clienteId) {
      const cliente = await this.clienteRepository.findOne({ where: { id: clienteId } });
      if (!cliente) { throw new NotFoundException(`Cliente com ID "${clienteId}" não encontrado.`); }
      comandaData.cliente = cliente;
    }
    const comanda = this.comandaRepository.create(comandaData);
    return this.comandaRepository.save(comanda);
  }

  async finalizarPedido(id: string): Promise<{ message: string }> {
    const comanda = await this.comandaRepository.findOne({ where: { id }, relations: ['pedidos'], });
    if (!comanda) { throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`); }
    const pedidosNoCarrinho = comanda.pedidos.filter((p) => p.status === PedidoStatus.CARRINHO,);
    if (pedidosNoCarrinho.length === 0) { throw new BadRequestException('Não há novos itens no carrinho para finalizar.'); }
    for (const pedido of pedidosNoCarrinho) {
      pedido.status = PedidoStatus.FEITO;
      await this.pedidoRepository.save(pedido);
    }
    return { message: 'Pedido finalizado e enviado para preparo com sucesso!' };
  }

  // --- NOVA FUNÇÃO PARA INSTRUÇÃO DE ENTREGA ---
  async definirInstrucaoEntrega(id: string, updateComandaDto: UpdateComandaDto): Promise<Comanda> {
    // Apenas os campos `tipoEntrega` e `localizacaoEntrega` serão permitidos no DTO
    // para esta rota, o que será validado no futuro no frontend.
    // Aqui, simplesmente reutilizamos a lógica de atualização genérica.
    return this.update(id, updateComandaDto);
  }
  // --- FIM DA NOVA FUNÇÃO ---

  findAll(): Promise<Comanda[]> {
    return this.comandaRepository.find({ relations: ['mesa', 'cliente'], });
  }

  async search(term: string): Promise<Comanda[]> {
    const queryBuilder = this.comandaRepository.createQueryBuilder('comanda');
    queryBuilder.leftJoinAndSelect('comanda.mesa', 'mesa').leftJoinAndSelect('comanda.cliente', 'cliente').where('comanda.status = :status', { status: ComandaStatus.ABERTA });
    if (term) {
      queryBuilder.andWhere(new Brackets(qb => {
        if (!isNaN(parseInt(term, 10))) {
          qb.where('mesa.numero = :numero', { numero: parseInt(term, 10) });
        } else {
          qb.where('cliente.nome ILIKE :term', { term: `%${term}%` }).orWhere('cliente.cpf = :term', { term });
        }
      }));
    }
    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Comanda> {
    const comanda = await this.comandaRepository.findOne({ where: { id }, relations: [ 'mesa', 'cliente', 'pedidos', 'pedidos.itens', 'pedidos.itens.produto', ], });
    if (!comanda) { throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`); }
    return comanda;
  }

  async findAbertaByMesaId(mesaId: string): Promise<Comanda> {
    const comanda = await this.comandaRepository.findOne({ where: { mesa: { id: mesaId }, status: ComandaStatus.ABERTA, }, });
    if (!comanda) { throw new NotFoundException( `Nenhuma comanda aberta encontrada para a mesa com ID "${mesaId}".`, ); }
    return comanda;
  }

  async findPublicOne(id: string) {
    const comanda = await this.comandaRepository.findOne({ where: { id }, relations: [ 'mesa', 'cliente', 'pedidos', 'pedidos.itens', 'pedidos.itens.produto', ], });
    if (!comanda) { throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`); }
    const totalComanda = comanda.pedidos.reduce((total, pedido) => { return total + Number(pedido.total); }, 0);
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
            preco: item.produto.preco, 
          },
        })),
      })),
      totalComanda,
    };
  }

  async fecharComanda(id: string): Promise<Comanda> {
    const comanda = await this.comandaRepository.findOne({ where: { id }, relations: ['mesa'], });
    if (!comanda) { throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`); }
    if (comanda.status !== ComandaStatus.ABERTA) { throw new BadRequestException('Apenas comandas com status ABERTA podem ser fechadas.'); }
    comanda.status = ComandaStatus.FECHADA;
    if (comanda.mesa) {
      comanda.mesa.status = MesaStatus.LIVRE;
      await this.mesaRepository.save(comanda.mesa);
    }
    return this.comandaRepository.save(comanda);
  }

  async update(id: string, updateComandaDto: UpdateComandaDto): Promise<Comanda> {
    const comanda = await this.comandaRepository.preload({ id, ...updateComandaDto, });
    if (!comanda) { throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`); }
    return this.comandaRepository.save(comanda);
  }

  async remove(id: string): Promise<void> {
    const comanda = await this.findOne(id);
    await this.comandaRepository.remove(comanda);
  }
}