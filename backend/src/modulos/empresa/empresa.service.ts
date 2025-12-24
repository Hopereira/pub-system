import {
  Injectable,
  NotFoundException,
  ConflictException,
  Optional,
  Logger,
  Scope,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Repository } from 'typeorm';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { Empresa } from './entities/empresa.entity';
import { TenantContextService } from '../../common/tenant/tenant-context.service';

@Injectable({ scope: Scope.REQUEST })
export class EmpresaService {
  private readonly logger = new Logger(EmpresaService.name);

  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @Optional() private readonly tenantContext?: TenantContextService,
    @Optional() @Inject(REQUEST) private readonly request?: any,
  ) {}

  async create(createEmpresaDto: CreateEmpresaDto): Promise<Empresa> {
    const empresa = this.empresaRepository.create(createEmpresaDto);
    try {
      return await this.empresaRepository.save(empresa);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(
          'Uma empresa com este CNPJ já está cadastrada.',
        );
      }
      throw error;
    }
  }

  async findOne(): Promise<Empresa> {
    // Filtrar por tenant_id para garantir isolamento multi-tenant
    // Prioridade: 1. TenantContext, 2. request.user.tenantId, 3. request.tenant.id
    let tenantId: string | null = null;
    
    // Tentar obter do TenantContextService
    try {
      tenantId = this.tenantContext?.getTenantId?.() ?? null;
    } catch {
      // Ignorar erro
    }
    
    // Fallback: obter do request.user (JWT decodificado)
    if (!tenantId && this.request?.user?.tenantId) {
      tenantId = this.request.user.tenantId;
    }
    
    // Fallback: obter do request.tenant (definido pelo TenantInterceptor)
    if (!tenantId && this.request?.tenant?.id) {
      tenantId = this.request.tenant.id;
    }

    this.logger.log(`🏢 EmpresaService.findOne() - tenantId: ${tenantId}`);

    const whereClause = tenantId ? { tenantId } : {};
    const empresa = await this.empresaRepository.findOneBy(whereClause);
    
    if (!empresa) {
      throw new NotFoundException('Nenhuma empresa encontrada para este tenant.');
    }
    
    this.logger.log(`✅ Empresa encontrada: ${empresa.nomeFantasia}`);
    return empresa;
  }

  async update(
    id: string,
    updateEmpresaDto: UpdateEmpresaDto,
  ): Promise<Empresa> {
    // Verificar se a empresa pertence ao tenant atual
    let tenantId: string | null = null;
    try {
      tenantId = this.tenantContext?.getTenantId?.() ?? null;
    } catch {
      // Tenant não definido
    }

    // Buscar empresa verificando tenant
    const whereClause = tenantId ? { id, tenantId } : { id };
    const existingEmpresa = await this.empresaRepository.findOneBy(whereClause);
    
    if (!existingEmpresa) {
      throw new NotFoundException(`Empresa com ID "${id}" não encontrada para este tenant.`);
    }

    const empresa = await this.empresaRepository.preload({
      id: id,
      ...updateEmpresaDto,
    });

    return this.empresaRepository.save(empresa);
  }
}
