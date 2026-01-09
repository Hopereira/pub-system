import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Between } from 'typeorm';
import { Avaliacao } from './entities/avaliacao.entity';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import {
  AvaliacaoResponseDto,
  EstatisticasSatisfacaoDto,
} from './dto/avaliacao-response.dto';
import { Comanda } from '../comanda/entities/comanda.entity';
import { ComandaRepository } from '../comanda/comanda.repository';
import { AvaliacaoRepository } from './avaliacao.repository';

@Injectable()
export class AvaliacaoService {
  private readonly logger = new Logger(AvaliacaoService.name);

  constructor(
    private readonly avaliacaoRepository: AvaliacaoRepository,
    private readonly comandaRepository: ComandaRepository,
  ) {}

  async create(createAvaliacaoDto: CreateAvaliacaoDto): Promise<Avaliacao> {
    const { comandaId, nota, comentario } = createAvaliacaoDto;

    this.logger.log(`⭐ Criando avaliação para comanda: ${comandaId}`);

    // Busca a comanda SEM filtro de tenant (rota pública)
    // O cliente acessa via página pública e não tem contexto de tenant
    const comanda = await this.comandaRepository.findByIdPublic(comandaId, [
      'cliente',
      'mesa',
      'mesa.ambiente',
      'pedidos',
      'pedidos.itens',
    ]);

    if (!comanda) {
      this.logger.warn(`❌ Comanda não encontrada: ${comandaId}`);
      throw new NotFoundException('Comanda não encontrada');
    }

    this.logger.log(`✅ Comanda encontrada: ${comandaId.slice(0, 8)}... - Status: ${comanda.status}`);

    if (comanda.status !== 'FECHADA') {
      throw new BadRequestException(
        'Apenas comandas fechadas podem ser avaliadas',
      );
    }

    // Verifica se já existe avaliação para esta comanda (SEM filtro de tenant)
    const avaliacaoExistente = await this.avaliacaoRepository.findByComandaIdPublic(comandaId);

    if (avaliacaoExistente) {
      throw new BadRequestException('Esta comanda já foi avaliada');
    }

    // Calcula tempo de estadia em minutos (do momento da abertura até agora)
    const tempoEstadia = comanda.dataAbertura
      ? Math.round(
          (new Date().getTime() - comanda.dataAbertura.getTime()) / 60000,
        )
      : null;

    // Calcula valor total da comanda somando todos os itens dos pedidos
    const valorGasto =
      comanda.pedidos?.reduce((total, pedido) => {
        const valorPedido =
          pedido.itens?.reduce((subtotal, item) => {
            return subtotal + Number(item.precoUnitario) * item.quantidade;
          }, 0) || 0;
        return total + valorPedido;
      }, 0) || 0;

    // Cria a avaliação usando o tenantId da comanda
    const avaliacaoSalva = await this.avaliacaoRepository.createPublic(
      {
        comandaId,
        clienteId: comanda.cliente?.id,
        nota,
        comentario: comentario || null,
        tempoEstadia,
        valorGasto,
      },
      comanda.tenantId, // Usa o tenantId da comanda
    );

    this.logger.log(
      `⭐ Nova avaliação | Nota: ${nota}/5 | Comanda: ${comandaId.slice(0, 8)} | Cliente: ${comanda.cliente?.nome || 'Anônimo'}`,
    );

    return avaliacaoSalva;
  }

  async findAll(
    dataInicio?: Date,
    dataFim?: Date,
  ): Promise<AvaliacaoResponseDto[]> {
    const queryBuilder = this.avaliacaoRepository
      .createQueryBuilder('avaliacao')
      .leftJoinAndSelect('avaliacao.comanda', 'comanda')
      .leftJoinAndSelect('comanda.cliente', 'cliente')
      .leftJoinAndSelect('comanda.mesa', 'mesa')
      .leftJoinAndSelect('mesa.ambiente', 'ambiente')
      .orderBy('avaliacao.criadoEm', 'DESC');

    if (dataInicio && dataFim) {
      // 🔒 CORREÇÃO: Usar andWhere para NÃO sobrescrever filtro de tenant
      queryBuilder.andWhere(
        'avaliacao.criadoEm BETWEEN :dataInicio AND :dataFim',
        {
          dataInicio,
          dataFim,
        },
      );
    }

    const avaliacoes = await queryBuilder.getMany();

    return avaliacoes.map((av) => ({
      id: av.id,
      comandaId: av.comandaId,
      clienteNome: av.comanda?.cliente?.nome || 'Cliente Anônimo',
      nota: av.nota,
      comentario: av.comentario,
      tempoEstadia: av.tempoEstadia,
      valorGasto: Number(av.valorGasto),
      criadoEm: av.criadoEm,
      mesaNumero: av.comanda?.mesa?.numero,
      ambienteNome: av.comanda?.mesa?.ambiente?.nome,
    }));
  }

  async getEstatisticas(
    dataInicio?: Date,
    dataFim?: Date,
  ): Promise<EstatisticasSatisfacaoDto> {
    const queryBuilder =
      this.avaliacaoRepository.createQueryBuilder('avaliacao');

    if (dataInicio && dataFim) {
      // 🔒 CORREÇÃO: Usar andWhere para NÃO sobrescrever filtro de tenant
      queryBuilder.andWhere(
        'avaliacao.criadoEm BETWEEN :dataInicio AND :dataFim',
        {
          dataInicio,
          dataFim,
        },
      );
    }

    const avaliacoes = await queryBuilder.getMany();

    if (avaliacoes.length === 0) {
      return {
        mediaSatisfacao: 0,
        totalAvaliacoes: 0,
        distribuicao: {
          nota1: 0,
          nota2: 0,
          nota3: 0,
          nota4: 0,
          nota5: 0,
        },
        tempoMedioEstadia: 0,
        valorMedioGasto: 0,
        taxaSatisfacao: 0,
      };
    }

    // Calcula média de satisfação
    const somaNotas = avaliacoes.reduce((sum, av) => sum + av.nota, 0);
    const mediaSatisfacao = Number((somaNotas / avaliacoes.length).toFixed(2));

    // Distribuição por nota
    const distribuicao = {
      nota1: avaliacoes.filter((av) => av.nota === 1).length,
      nota2: avaliacoes.filter((av) => av.nota === 2).length,
      nota3: avaliacoes.filter((av) => av.nota === 3).length,
      nota4: avaliacoes.filter((av) => av.nota === 4).length,
      nota5: avaliacoes.filter((av) => av.nota === 5).length,
    };

    // Tempo médio de estadia
    const avaliacoesComTempo = avaliacoes.filter(
      (av) => av.tempoEstadia !== null,
    );
    const tempoMedioEstadia =
      avaliacoesComTempo.length > 0
        ? Math.round(
            avaliacoesComTempo.reduce((sum, av) => sum + av.tempoEstadia, 0) /
              avaliacoesComTempo.length,
          )
        : 0;

    // Valor médio gasto
    const valorMedioGasto = Number(
      (
        avaliacoes.reduce((sum, av) => sum + Number(av.valorGasto), 0) /
        avaliacoes.length
      ).toFixed(2),
    );

    // Taxa de satisfação (% de notas 4 e 5)
    const notasPositivas = avaliacoes.filter((av) => av.nota >= 4).length;
    const taxaSatisfacao = Number(
      ((notasPositivas / avaliacoes.length) * 100).toFixed(1),
    );

    this.logger.log(
      `📊 Estatísticas calculadas | Média: ${mediaSatisfacao}/5 | Taxa: ${taxaSatisfacao}% | Total: ${avaliacoes.length}`,
    );

    return {
      mediaSatisfacao,
      totalAvaliacoes: avaliacoes.length,
      distribuicao,
      tempoMedioEstadia,
      valorMedioGasto,
      taxaSatisfacao,
    };
  }

  async getEstatisticasDoDia(): Promise<EstatisticasSatisfacaoDto> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    return this.getEstatisticas(hoje, amanha);
  }
}
