// Caminho: backend/src/modulos/comanda/comanda.service.ts
import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Cliente } from '../cliente/entities/cliente.entity';
import { Mesa, MesaStatus } from '../mesa/entities/mesa.entity';
import { CreateComandaDto } from './dto/create-comanda.dto';
import { Comanda, ComandaStatus } from './entities/comanda.entity';
import { PedidosGateway } from '../pedido/pedidos.gateway';
import { PedidoStatus } from '../pedido/enums/pedido-status.enum';
import { PaginaEvento } from '../pagina-evento/entities/pagina-evento.entity';
import { Evento } from '../evento/entities/evento.entity';
import { Pedido } from '../pedido/entities/pedido.entity';
import { ItemPedido } from '../pedido/entities/item-pedido.entity';

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
    @InjectRepository(PaginaEvento)
    private readonly paginaEventoRepository: Repository<PaginaEvento>,
    private readonly pedidosGateway: PedidosGateway,
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    @InjectRepository(ItemPedido)
    private readonly itemPedidoRepository: Repository<ItemPedido>,
  ) {}

  async create(createComandaDto: CreateComandaDto): Promise<Comanda> {
    const { mesaId, clienteId, paginaEventoId, eventoId } = createComandaDto;

    if (!mesaId && !clienteId) {
      throw new BadRequestException('A comanda precisa estar associada a uma mesa ou a um cliente.');
    }

    let mesa: Mesa | null = null;
    if (mesaId) {
      mesa = await this.mesaRepository.findOne({ where: { id: mesaId } });
      if (!mesa) throw new NotFoundException(`Mesa com ID "${mesaId}" não encontrada.`);
      if (!clienteId && mesa.status !== MesaStatus.LIVRE) {
        throw new BadRequestException(`A Mesa ${mesa.numero} já está ocupada.`);
      }
    }

    let cliente: Cliente | null = null;
    if (clienteId) {
      cliente = await this.clienteRepository.findOne({ where: { id: clienteId } });
      if (!cliente) throw new NotFoundException(`Cliente com ID "${clienteId}" não encontrado.`);
      
      // LÓGICA DE FLEXIBILIDADE PARA REENTRADA (SEM MESA):
      // Se não houver mesa, permitimos que o cliente abra uma nova comanda, 
      // mesmo que já tenha uma aberta. Isso suporta o fluxo de reentrada após o checkout.
      if (!mesaId) {
          const comandaAbertaExistente = await this.comandaRepository.findOne({
              where: { cliente: { id: clienteId }, status: ComandaStatus.ABERTA }
          });
          
          if (comandaAbertaExistente) {
              this.logger.warn(`Cliente ${clienteId} está a criar uma nova comanda de evento, mas já tem uma comanda aberta: ${comandaAbertaExistente.id}.`);
              // Não bloqueia a criação, mas regista um aviso.
          }
      }
    }
    
    let paginaEvento: PaginaEvento | null = null;
    if (paginaEventoId) {
      paginaEvento = await this.paginaEventoRepository.findOne({ where: { id: paginaEventoId } });
      if (!paginaEvento) {
        this.logger.warn(`Página de Evento com ID "${paginaEventoId}" não encontrada.`);
      }
    }

    const comanda = this.comandaRepository.create({
      mesa,
      cliente,
      paginaEvento,
      status: ComandaStatus.ABERTA,
    });

    const novaComanda = await this.comandaRepository.save(comanda);

    // LÓGICA PARA ADICIONAR O VALOR DE ENTRADA DO EVENTO
    if (eventoId) {
      const evento = await this.eventoRepository.findOne({ where: { id: eventoId } });
      if (evento && evento.valor > 0) {
        this.logger.log(`Adicionando entrada de R$ ${evento.valor} do evento "${evento.titulo}" à comanda ${novaComanda.id}`);
        
        const itemEntrada = this.itemPedidoRepository.create({
          produto: null, 
          quantidade: 1,
          precoUnitario: evento.valor,
          observacao: `Entrada: ${evento.titulo}`, 
          status: PedidoStatus.ENTREGUE, 
        });

        const pedidoEntrada = this.pedidoRepository.create({
          comanda: novaComanda,
          itens: [itemEntrada],
          total: evento.valor,
          status: PedidoStatus.ENTREGUE,
        });
        
        await this.pedidoRepository.save(pedidoEntrada);
      }
    }
    
    if (mesa) {
      mesa.status = MesaStatus.OCUPADA;
      await this.mesaRepository.save(mesa);
    }
    
    // Recarregamos a comanda para garantir que ela retorne com o novo pedido de entrada incluído
    return this.findOne(novaComanda.id);
  }

  findAll(): Promise<Comanda[]> {
    return this.comandaRepository.find({ relations: ['mesa', 'cliente', 'paginaEvento'] });
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

  async findOne(id: string): Promise<Comanda> {
    const comanda = await this.comandaRepository.findOne({
        where: { id },
        relations: [
            'mesa', 
            'cliente', 
            'paginaEvento', 
            'pedidos', 
            'pedidos.itens', 
            'pedidos.itens.produto'
        ],
        order: {
            pedidos: {
                data: "ASC"
            }
        }
    });

    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`);
    }

    let totalComandaCalculado = 0;
    if (comanda.pedidos) {
      comanda.pedidos.forEach(pedido => {
        const totalPedidoCalculado = pedido.itens.reduce((sum, item) => {
          // Itens de entrada (sem produto) também devem ser somados
          if (item.status !== PedidoStatus.CANCELADO) {
            return sum + (Number(item.precoUnitario) * item.quantidade);
          }
          return sum;
        }, 0);
        
        pedido.total = totalPedidoCalculado;
        totalComandaCalculado += totalPedidoCalculado;
      });
    }
    (comanda as any).total = totalComandaCalculado;
    
    return comanda;
  }

  async findAbertaByMesaId(mesaId: string): Promise<Comanda> {
    const comanda = await this.comandaRepository.findOne({
      where: { mesa: { id: mesaId }, status: ComandaStatus.ABERTA },
    });
    if (!comanda) {
      throw new NotFoundException(
        `Nenhuma comanda aberta encontrada para a mesa com ID "${mesaId}".`,
      );
    }
    return this.findOne(comanda.id);
  }

  async findPublicOne(id: string) {
    const comanda = await this.findOne(id);
    
    // Simplificamos o retorno dos itens para o frontend não se confundir
    const pedidosSimplificados = comanda.pedidos.map(p => ({
        ...p,
        itens: p.itens.map(i => ({
            ...i,
            produto: i.produto ? { nome: i.produto.nome } : null, // Envia só o nome do produto
        }))
    }));

    return {
      id: comanda.id,
      status: comanda.status,
      mesa: comanda.mesa ? { numero: comanda.mesa.numero } : null,
      cliente: comanda.cliente ? { nome: comanda.cliente.nome } : null,
      pedidos: pedidosSimplificados, // Usa a versão simplificada
      totalComanda: (comanda as any).total,
      paginaEvento: comanda.paginaEvento 
    };
  }

  async fecharComanda(id: string): Promise<Comanda> {
    const comanda = await this.findOne(id);
    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`);
    }
    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new BadRequestException('Apenas comandas com status ABERTA podem ser fechadas.');
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

  async update(id: string, updateComandaDto: any): Promise<Comanda> {
    const comanda = await this.comandaRepository.preload({ id, ...updateComandaDto });
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