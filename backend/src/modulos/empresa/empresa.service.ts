import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { Empresa } from './entities/empresa.entity';
import { EmpresaRepository } from './empresa.repository';

@Injectable()
export class EmpresaService {
  private readonly logger = new Logger(EmpresaService.name);

  constructor(
    private readonly empresaRepository: EmpresaRepository,
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
    // BaseTenantRepository auto-filtra por tenant_id do contexto
    const empresas = await this.empresaRepository.find();
    const empresa = empresas[0] ?? null;

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
    // BaseTenantRepository auto-filtra por tenant_id
    const empresa = await this.empresaRepository.preload({
      id,
      ...updateEmpresaDto,
    });

    if (!empresa) {
      throw new NotFoundException(`Empresa com ID "${id}" não encontrada para este tenant.`);
    }

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
}
