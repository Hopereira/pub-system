// Caminho: backend/src/modulos/ponto-entrega/ponto-entrega.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PontoEntrega } from './entities/ponto-entrega.entity';
import { Empresa } from '../empresa/entities/empresa.entity';
import { CreatePontoEntregaDto } from './dto/create-ponto-entrega.dto';
import { UpdatePontoEntregaDto } from './dto/update-ponto-entrega.dto';
import { AtualizarPosicaoMesaDto } from '../mesa/dto/mapa.dto';

@Injectable()
export class PontoEntregaService {
  private readonly logger = new Logger(PontoEntregaService.name);

  constructor(
    @InjectRepository(PontoEntrega)
    private readonly pontoEntregaRepository: Repository<PontoEntrega>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  async create(
    createDto: CreatePontoEntregaDto,
    empresaId?: string,
  ): Promise<PontoEntrega> {
    this.logger.log(`📍 Criando ponto de entrega: ${createDto.nome}`);

    // Se empresaId não foi fornecido, buscar a primeira empresa
    let finalEmpresaId = empresaId;
    if (!finalEmpresaId) {
      const empresa = await this.empresaRepository.findOne({ where: {} });
      if (!empresa) {
        throw new BadRequestException('Nenhuma empresa cadastrada no sistema');
      }
      finalEmpresaId = empresa.id;
      this.logger.log(
        `🏢 Usando empresa padrão: ${empresa.nomeFantasia} (${finalEmpresaId})`,
      );
    }

    const ponto = this.pontoEntregaRepository.create({
      ...createDto,
      empresaId: finalEmpresaId,
    });

    const novoPonto = await this.pontoEntregaRepository.save(ponto);

    this.logger.log(
      `✅ Ponto de entrega criado: ${novoPonto.nome} (ID: ${novoPonto.id})`,
    );

    return this.findOne(novoPonto.id);
  }

  async findAll(empresaId?: string): Promise<PontoEntrega[]> {
    // Se empresaId não foi fornecido, buscar a primeira empresa
    let finalEmpresaId = empresaId;
    if (!finalEmpresaId) {
      const empresa = await this.empresaRepository.findOne({ where: {} });
      if (empresa) {
        finalEmpresaId = empresa.id;
      }
    }

    const pontos = await this.pontoEntregaRepository.find({
      where: finalEmpresaId ? { empresaId: finalEmpresaId } : {},
      relations: ['mesaProxima', 'ambienteAtendimento', 'ambientePreparo'],
      order: { nome: 'ASC' },
    });

    this.logger.log(`📋 Listando ${pontos.length} pontos de entrega`);

    return pontos;
  }

  async findAllAtivos(empresaId?: string): Promise<PontoEntrega[]> {
    // Se empresaId não foi fornecido, buscar a primeira empresa
    let finalEmpresaId = empresaId;
    if (!finalEmpresaId) {
      const empresa = await this.empresaRepository.findOne({ where: {} });
      if (empresa) {
        finalEmpresaId = empresa.id;
      }
    }

    const pontos = await this.pontoEntregaRepository.find({
      where: finalEmpresaId
        ? { empresaId: finalEmpresaId, ativo: true }
        : { ativo: true },
      relations: ['mesaProxima', 'ambienteAtendimento', 'ambientePreparo'],
      order: { nome: 'ASC' },
    });

    return pontos;
  }

  async findByAmbiente(ambienteId: string): Promise<PontoEntrega[]> {
    this.logger.log(`🔍 Buscando pontos de entrega do ambiente: ${ambienteId}`);

    // Buscar pontos que estão fisicamente neste ambiente (atendimento)
    // OU que têm este ambiente como preparo (para compatibilidade)
    const pontos = await this.pontoEntregaRepository.find({
      where: [
        { ambienteAtendimentoId: ambienteId },
        { ambientePreparoId: ambienteId },
      ],
      relations: ['mesaProxima', 'ambienteAtendimento', 'ambientePreparo'],
      order: { nome: 'ASC' },
    });

    this.logger.log(`📋 Encontrados ${pontos.length} pontos no ambiente`);

    return pontos;
  }

  async findOne(id: string): Promise<PontoEntrega> {
    const ponto = await this.pontoEntregaRepository.findOne({
      where: { id },
      relations: [
        'mesaProxima',
        'ambienteAtendimento',
        'ambientePreparo',
        'empresa',
      ],
    });

    if (!ponto) {
      this.logger.warn(`⚠️ Ponto de entrega não encontrado: ${id}`);
      throw new NotFoundException(
        `Ponto de entrega com ID "${id}" não encontrado.`,
      );
    }

    return ponto;
  }

  async update(
    id: string,
    updateDto: UpdatePontoEntregaDto,
  ): Promise<PontoEntrega> {
    const ponto = await this.findOne(id);

    this.logger.log(`🔄 Atualizando ponto de entrega: ${ponto.nome}`);

    Object.assign(ponto, updateDto);
    await this.pontoEntregaRepository.save(ponto);

    this.logger.log(`✅ Ponto de entrega atualizado: ${ponto.nome}`);

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const ponto = await this.findOne(id);

    // Verifica se há comandas usando este ponto
    const comandasUsando = await this.pontoEntregaRepository
      .createQueryBuilder('ponto')
      .leftJoin('ponto.comandas', 'comanda')
      .where('ponto.id = :id', { id })
      .andWhere('comanda.status = :status', { status: 'ABERTA' })
      .getCount();

    if (comandasUsando > 0) {
      this.logger.warn(
        `⚠️ Tentativa de excluir ponto com ${comandasUsando} comandas ativas`,
      );
      throw new BadRequestException(
        `Não é possível excluir o ponto "${ponto.nome}" pois existem ${comandasUsando} comandas ativas usando-o.`,
      );
    }

    this.logger.log(`🗑️ Excluindo ponto de entrega: ${ponto.nome}`);

    await this.pontoEntregaRepository.remove(ponto);

    this.logger.log(`✅ Ponto de entrega excluído: ${ponto.nome}`);
  }

  async toggleAtivo(id: string): Promise<PontoEntrega> {
    const ponto = await this.findOne(id);

    ponto.ativo = !ponto.ativo;
    await this.pontoEntregaRepository.save(ponto);

    this.logger.log(
      `🔄 Ponto ${ponto.nome} ${ponto.ativo ? 'ativado' : 'desativado'}`,
    );

    return ponto;
  }

  async atualizarPosicao(
    id: string,
    dto: AtualizarPosicaoMesaDto,
  ): Promise<PontoEntrega> {
    const ponto = await this.findOne(id);

    ponto.posicao = dto.posicao;
    if (dto.tamanho) {
      ponto.tamanho = dto.tamanho;
    }

    const pontoAtualizado = await this.pontoEntregaRepository.save(ponto);
    this.logger.log(
      `📍 Ponto ${ponto.nome} posição atualizada: (${dto.posicao.x}, ${dto.posicao.y})`,
    );

    return pontoAtualizado;
  }
}
