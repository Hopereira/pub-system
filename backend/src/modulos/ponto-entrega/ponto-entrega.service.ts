// Caminho: backend/src/modulos/ponto-entrega/ponto-entrega.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Scope,
  Inject,
  Optional,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { PontoEntrega } from './entities/ponto-entrega.entity';
import { PontoEntregaRepository } from './ponto-entrega.repository';
import { CreatePontoEntregaDto } from './dto/create-ponto-entrega.dto';
import { UpdatePontoEntregaDto } from './dto/update-ponto-entrega.dto';
import { AtualizarPosicaoMesaDto } from '../mesa/dto/mapa.dto';

@Injectable({ scope: Scope.REQUEST })
export class PontoEntregaService {
  private readonly logger = new Logger(PontoEntregaService.name);

  constructor(
    private readonly pontoEntregaRepository: PontoEntregaRepository,
    @Optional() @Inject(REQUEST) private readonly request?: any,
  ) {}

  async create(createDto: CreatePontoEntregaDto): Promise<PontoEntrega> {
    this.logger.log(`📍 Criando ponto de entrega: ${createDto.nome}`);

    // Obter empresaId do usuário autenticado
    const empresaId = this.request?.user?.empresaId;
    if (!empresaId) {
      this.logger.error('❌ empresaId não encontrado no usuário autenticado');
      throw new BadRequestException('Empresa não identificada. Faça login novamente.');
    }

    // O tenant_id é injetado automaticamente pelo BaseTenantRepository
    // Mas precisamos adicionar o empresaId manualmente
    const ponto = this.pontoEntregaRepository.create({
      ...createDto,
      empresaId,
    });
    const novoPonto = await this.pontoEntregaRepository.save(ponto);

    this.logger.log(
      `✅ Ponto de entrega criado: ${novoPonto.nome} (ID: ${novoPonto.id}) | empresaId: ${empresaId}`,
    );

    return this.findOne(novoPonto.id);
  }

  async findAll(): Promise<PontoEntrega[]> {
    // O filtro de tenant é aplicado automaticamente pelo BaseTenantRepository
    const pontos = await this.pontoEntregaRepository.findComRelacoes();
    this.logger.log(`📋 Listando ${pontos.length} pontos de entrega`);
    return pontos;
  }

  async findAllAtivos(): Promise<PontoEntrega[]> {
    // Obter tenantId do header X-Tenant-ID ou do request.tenant
    const tenantId = this.request?.tenant?.id || this.request?.headers?.['x-tenant-id'];
    
    // Construir where clause com filtro de tenant
    const whereClause: any = { ativo: true };
    if (tenantId) {
      whereClause.tenantId = tenantId;
      this.logger.log(`🔒 Pontos de entrega públicos filtrando por tenantId: ${tenantId}`);
    } else {
      this.logger.warn(`⚠️ Pontos de entrega públicos SEM tenantId - retornando TODOS!`);
    }
    
    return this.pontoEntregaRepository.rawRepository.find({
      where: whereClause,
      relations: ['mesaProxima', 'ambienteAtendimento', 'ambientePreparo'],
      order: { nome: 'ASC' },
    });
  }

  async findByAmbiente(ambienteId: string): Promise<PontoEntrega[]> {
    this.logger.log(`🔍 Buscando pontos de entrega do ambiente: ${ambienteId}`);
    const pontos = await this.pontoEntregaRepository.findByAmbiente(ambienteId);
    this.logger.log(`📋 Encontrados ${pontos.length} pontos no ambiente`);
    return pontos;
  }

  async findOne(id: string): Promise<PontoEntrega> {
    const ponto = await this.pontoEntregaRepository.findByIdComRelacoes(id);

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
