// backend/src/modulos/comanda/comanda.service.ts
import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Cliente } from '../cliente/entities/cliente.entity';
import { Mesa, MesaStatus } from '../mesa/entities/mesa.entity';
import { CreateComandaDto } from './dto/create-comanda.dto';
import { Comanda, ComandaStatus } from './entities/comanda.entity';
import { PedidosGateway } from '../pedido/pedidos.gateway';
import { PedidoStatus } from '../pedido/enums/pedido-status.enum';
// ✅ 1. IMPORTAR a entidade PaginaEvento
import { PaginaEvento } from '../pagina-evento/entities/pagina-evento.entity';

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
    // ✅ 2. INJETAR o repositório que faltava
    @InjectRepository(PaginaEvento)
    private readonly paginaEventoRepository: Repository<PaginaEvento>,
    private readonly pedidosGateway: PedidosGateway,
  ) {}

  async create(createComandaDto: CreateComandaDto): Promise<Comanda> {
    // ✅ 3. OBTER o paginaEventoId que vem do frontend
    const { mesaId, clienteId, paginaEventoId } = createComandaDto;

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
    }
    
    // ✅ 4. LÓGICA para buscar e associar a PaginaEvento
    let paginaEvento: PaginaEvento | null = null;
    if (paginaEventoId) {
      paginaEvento = await this.paginaEventoRepository.findOne({ where: { id: paginaEventoId } });
      if (!paginaEvento) {
        this.logger.warn(`Página de Evento com ID "${paginaEventoId}" não encontrada, a comanda será criada sem ela.`);
      }
    }

    const comanda = this.comandaRepository.create({
      mesa: mesa,
      cliente: cliente,
      paginaEvento: paginaEvento, // ✅ 5. ASSOCIAR a paginaEvento ao criar
      status: ComandaStatus.ABERTA,
    });

    if (mesa) {
      mesa.status = MesaStatus.OCUPADA;
      await this.mesaRepository.save(mesa);
    }
    
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

  async findOne(id: string): Promise<Comanda> {
    const comanda = await this.comandaRepository
      .createQueryBuilder('comanda')
      .leftJoinAndSelect('comanda.mesa', 'mesa')
      .leftJoinAndSelect('comanda.cliente', 'cliente')
      // ✅ 6. ADICIONAR a junção que faltava no SEU QueryBuilder
      .leftJoinAndSelect('comanda.paginaEvento', 'paginaEvento')
      .leftJoinAndSelect('comanda.pedidos', 'pedido')
      .leftJoinAndSelect('pedido.itens', 'itemPedido')
      .leftJoinAndSelect('itemPedido.produto', 'produto')
      .where('comanda.id = :id', { id })
      .orderBy('pedido.data', 'ASC')
      .getOne();

    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`);
    }

    let totalComandaCalculado = 0;
    if (comanda.pedidos) {
      comanda.pedidos.forEach(pedido => {
        const totalPedidoCalculado = pedido.itens.reduce((sum, item) => {
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
    
    this.logger.debug(
      `[DIAGNÓSTICO findOne] Comanda ID ${id} com totais RECALCULADOS:`,
      JSON.stringify(comanda, null, 2),
    );

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
    
    return {
      id: comanda.id,
      status: comanda.status,
      mesa: comanda.mesa ? { numero: comanda.mesa.numero } : null,
      cliente: comanda.cliente ? { nome: comanda.cliente.nome } : null,
      pedidos: comanda.pedidos,
      totalComanda: (comanda as any).total,
      // ✅ 7. GARANTIR que a paginaEvento é retornada para o público
      paginaEvento: comanda.paginaEvento
    };
  }

  async fecharComanda(id: string): Promise<Comanda> {
    const comanda = await this.findOne(id); // Usar findOne para carregar todas as relações
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

  async update(id: string, updateComandaDto: any): Promise<Comanda> {
    // Usar findOne para garantir que todas as relações sejam carregadas antes do preload
    const comandaExistente = await this.findOne(id);
    const comanda = await this.comandaRepository.preload({
      ...comandaExistente,
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