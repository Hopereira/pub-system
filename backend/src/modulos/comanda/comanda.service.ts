// Caminho: backend/src/modulos/comanda/comanda.service.ts
import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

// Entidades de Módulos Associados
import { Cliente } from '../cliente/entities/cliente.entity';
import { Mesa, MesaStatus } from '../mesa/entities/mesa.entity';
import { PaginaEvento } from '../pagina-evento/entities/pagina-evento.entity';
import { Evento } from '../evento/entities/evento.entity';
import { Pedido } from '../pedido/entities/pedido.entity';
import { ItemPedido } from '../pedido/entities/item-pedido.entity';
import { PontoEntrega } from '../ponto-entrega/entities/ponto-entrega.entity';
import { ComandaAgregado } from './entities/comanda-agregado.entity';

// Entidades e DTOs Locais
import { CreateComandaDto } from './dto/create-comanda.dto';
import { UpdatePontoEntregaComandaDto } from './dto/update-ponto-entrega.dto';
import { Comanda, ComandaStatus } from './entities/comanda.entity';
import { PedidoStatus } from '../pedido/enums/pedido-status.enum';

// Gateways
import { PedidosGateway } from '../pedido/pedidos.gateway';
import Decimal from 'decimal.js';

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
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    @InjectRepository(ItemPedido)
    private readonly itemPedidoRepository: Repository<ItemPedido>,
    @InjectRepository(PontoEntrega)
    private readonly pontoEntregaRepository: Repository<PontoEntrega>,
    @InjectRepository(ComandaAgregado)
    private readonly comandaAgregadoRepository: Repository<ComandaAgregado>,
    private readonly pedidosGateway: PedidosGateway,
  ) {}

  async create(createComandaDto: CreateComandaDto): Promise<Comanda> {
    const { mesaId, pontoEntregaId, clienteId, paginaEventoId, eventoId, agregados } = createComandaDto;

    // Validação: Mesa XOR Ponto de Entrega (não pode ter ambos)
    if (mesaId && pontoEntregaId) {
      throw new BadRequestException('A comanda não pode ter mesa E ponto de entrega ao mesmo tempo.');
    }
    
    // Validação: Se não tiver mesa, precisa ter cliente (balcão/delivery/ponto)
    if (!mesaId && !clienteId) {
      throw new BadRequestException('Comandas sem mesa precisam estar associadas a um cliente.');
    }

    // ✅ USAR TRANSAÇÃO COM LOCK PESSIMISTA PARA EVITAR RACE CONDITION
    return await this.comandaRepository.manager.transaction(async (transactionalEntityManager) => {
      let mesa: Mesa | null = null;
      if (mesaId) {
        // Lock pessimista para evitar que duas requisições simultâneas ocupem a mesma mesa
        mesa = await transactionalEntityManager.findOne(Mesa, {
          where: { id: mesaId },
          lock: { mode: 'pessimistic_write' }
        });
        if (!mesa) throw new NotFoundException(`Mesa com ID "${mesaId}" não encontrada.`);
        if (!clienteId && mesa.status !== MesaStatus.LIVRE) {
          throw new BadRequestException(`A Mesa ${mesa.numero} já está ocupada.`);
        }
      }

      let cliente: Cliente | null = null;
      if (clienteId) {
        cliente = await transactionalEntityManager.findOne(Cliente, { where: { id: clienteId } });
        if (!cliente) throw new NotFoundException(`Cliente com ID "${clienteId}" não encontrado.`);
        
        // ✅ REGRA DE NEGÓCIO: UMA COMANDA ABERTA POR CLIENTE (BLOQUEIO TOTAL)
        const comandaAbertaExistente = await transactionalEntityManager.findOne(Comanda, {
          where: { cliente: { id: clienteId }, status: ComandaStatus.ABERTA }
        });
      
        if (comandaAbertaExistente) {
          this.logger.warn(`BLOQUEIO: Cliente ${clienteId} tentou criar nova comanda, mas já possui comanda aberta: ${comandaAbertaExistente.id}.`);
          throw new BadRequestException(
            `O Cliente "${cliente.nome}" já possui uma comanda aberta (ID: ${comandaAbertaExistente.id}). Por favor, feche a comanda anterior.`
          );
        }
      }

      let paginaEvento: PaginaEvento | null = null;
      if (paginaEventoId) {
        paginaEvento = await transactionalEntityManager.findOne(PaginaEvento, { where: { id: paginaEventoId } });
        if (!paginaEvento) {
          this.logger.warn(`Página de Evento com ID "${paginaEventoId}" não encontrada.`);
        }
      }

      // Validar Ponto de Entrega
      let pontoEntrega: PontoEntrega | null = null;
      if (pontoEntregaId) {
        pontoEntrega = await transactionalEntityManager.findOne(PontoEntrega, { 
          where: { id: pontoEntregaId } 
        });
        if (!pontoEntrega) {
          throw new NotFoundException(`Ponto de entrega com ID "${pontoEntregaId}" não encontrado.`);
        }
        if (!pontoEntrega.ativo) {
          throw new BadRequestException(`O ponto de entrega "${pontoEntrega.nome}" está desativado.`);
        }
        this.logger.log(`📍 Comanda será criada no ponto: ${pontoEntrega.nome}`);
      }

      const comanda = transactionalEntityManager.create(Comanda, {
        mesa,
        cliente,
        pontoEntrega,
        paginaEvento,
        status: ComandaStatus.ABERTA,
      });

      const novaComanda = await transactionalEntityManager.save(comanda);

      // Criar agregados se fornecidos
      if (agregados && agregados.length > 0) {
        const agregadosEntities = agregados.map((agr, index) =>
          transactionalEntityManager.create(ComandaAgregado, {
            comandaId: novaComanda.id,
            nome: agr.nome,
            cpf: agr.cpf,
            ordem: index + 1,
          })
        );
        await transactionalEntityManager.save(agregadosEntities);
        this.logger.log(`✅ ${agregados.length} agregado(s) adicionado(s) à comanda ${novaComanda.id}`);
      }

      // ✅ LÓGICA PARA ADICIONAR O VALOR DE ENTRADA DO EVENTO (COVER ARTÍSTICO)
      if (eventoId) {
        const evento = await transactionalEntityManager.findOne(Evento, { where: { id: eventoId } });
        if (evento && evento.valor > 0) {
          this.logger.log(`Adicionando entrada de R$ ${evento.valor} do evento "${evento.titulo}" à comanda ${novaComanda.id}`);
          
          const itemEntrada = transactionalEntityManager.create(ItemPedido, {
            produto: null,
            quantidade: 1,
            precoUnitario: evento.valor,
            observacao: `Couvert Artístico - ${evento.titulo}`,
            status: PedidoStatus.ENTREGUE,
          });

          const pedidoEntrada = transactionalEntityManager.create(Pedido, {
            comanda: novaComanda,
            itens: [itemEntrada],
            total: evento.valor,
            status: PedidoStatus.ENTREGUE,
          });
          
          await transactionalEntityManager.save(itemEntrada);
          await transactionalEntityManager.save(pedidoEntrada);
        }
      }

      if (mesa) {
        mesa.status = MesaStatus.OCUPADA;
        await transactionalEntityManager.save(mesa);
      }
      
      return novaComanda;
    }).then(async (novaComanda) => {
      // Recarregamos a comanda para garantir que ela retorne com o novo pedido de entrada incluído
      return this.findOne(novaComanda.id);
    });
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
      const searchTerm = term.trim();
      queryBuilder.andWhere(
        new Brackets((qb) => {
          // Busca por nome do cliente (parcial, case-insensitive)
          qb.where('LOWER(cliente.nome) LIKE LOWER(:nomeTerm)', { nomeTerm: `%${searchTerm}%` });
          
          // Busca por CPF (parcial ou completo, apenas números)
          const cpfNumeros = searchTerm.replace(/\D/g, ''); // Remove tudo que não é número
          if (cpfNumeros) {
            qb.orWhere('cliente.cpf LIKE :cpfTerm', { cpfTerm: `%${cpfNumeros}%` });
          }
          
          // Busca por número de mesa (apenas se for um número pequeno, não um CPF)
          // CPF tem 11 dígitos, então só considera número de mesa se tiver menos de 5 dígitos
          const numeroMesa = parseInt(searchTerm, 10);
          if (!isNaN(numeroMesa) && searchTerm.length < 5) {
            qb.orWhere('mesa.numero = :numero', { numero: numeroMesa });
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
            'pontoEntrega',
            'pontoEntrega.mesaProxima',
            'pontoEntrega.ambientePreparo',
            'agregados',
            'pedidos', 
            'pedidos.itens', 
            'pedidos.itens.produto',
            'pedidos.itens.ambienteRetirada' // Carrega ambiente onde item foi deixado
        ],
        order: {
            agregados: {
                ordem: 'ASC',
            },
            pedidos: {
                data: "ASC"
            }
        }
    });

    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`);
    }

    let totalComandaCalculado = new Decimal(0);
    if (comanda.pedidos) {
      comanda.pedidos.forEach(pedido => {
        const totalPedidoCalculado = pedido.itens.reduce((sum, item) => {
          // Itens de entrada (sem produto) também devem ser somados
          if (item.status !== PedidoStatus.CANCELADO) {
            const itemTotal = new Decimal(item.precoUnitario).times(new Decimal(item.quantidade));
            return sum.plus(itemTotal);
          }
          return sum;
        }, new Decimal(0));
        
        pedido.total = totalPedidoCalculado.toNumber();
        totalComandaCalculado = totalComandaCalculado.plus(totalPedidoCalculado);
      });
    }
    (comanda as any).total = totalComandaCalculado.toNumber();
    
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
            ambienteRetirada: i.ambienteRetirada ? { 
              id: i.ambienteRetirada.id, 
              nome: i.ambienteRetirada.nome 
            } : null, // Inclui ambiente de retirada quando item foi deixado no ambiente
        }))
    }));

    return {
      id: comanda.id,
      status: comanda.status,
      mesa: comanda.mesa ? { id: comanda.mesa.id, numero: comanda.mesa.numero } : null,
      pontoEntrega: comanda.pontoEntrega ? {
        id: comanda.pontoEntrega.id,
        nome: comanda.pontoEntrega.nome,
        descricao: comanda.pontoEntrega.descricao
      } : null,
      agregados: comanda.agregados || [],
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

  async updatePontoEntrega(
    comandaId: string,
    dto: UpdatePontoEntregaComandaDto,
  ): Promise<Comanda> {
    const comanda = await this.findOne(comandaId);

    if (comanda.status !== ComandaStatus.ABERTA) {
      throw new BadRequestException('Apenas comandas abertas podem ter o ponto de entrega alterado.');
    }

    // Verifica se tem pedidos EM_PREPARO
    const pedidosEmPreparo = await this.pedidoRepository
      .createQueryBuilder('pedido')
      .leftJoin('pedido.itens', 'item')
      .where('pedido.comanda.id = :comandaId', { comandaId })
      .andWhere('item.status = :status', { status: PedidoStatus.EM_PREPARO })
      .getCount();

    if (pedidosEmPreparo > 0) {
      this.logger.warn(
        `⚠️ Cliente mudou ponto de entrega com ${pedidosEmPreparo} pedido(s) em preparo - Comanda ${comandaId}`
      );
      // Não bloqueia, apenas alerta
    }

    const novoPonto = await this.pontoEntregaRepository.findOne({
      where: { id: dto.pontoEntregaId },
    });

    if (!novoPonto) {
      throw new NotFoundException(`Ponto de entrega com ID "${dto.pontoEntregaId}" não encontrado.`);
    }

    if (!novoPonto.ativo) {
      throw new BadRequestException(`O ponto de entrega "${novoPonto.nome}" está desativado.`);
    }

    comanda.pontoEntrega = novoPonto;
    comanda.pontoEntregaId = dto.pontoEntregaId;

    const comandaAtualizada = await this.comandaRepository.save(comanda);

    this.logger.log(
      `🔄 Ponto de entrega alterado: Comanda ${comandaId} → ${novoPonto.nome}`
    );

    // Emite evento WebSocket para notificar mudança de local
    this.pedidosGateway.emitComandaAtualizada(comandaAtualizada);
    this.logger.log(`📡 Evento 'comanda_atualizada' emitido para comanda ${comandaId}`);

    return this.findOne(comandaId);
  }
}