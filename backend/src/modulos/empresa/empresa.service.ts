import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  Scope,
} from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { Empresa } from './entities/empresa.entity';
import { EmpresaRepository } from './empresa.repository';

@Injectable({ scope: Scope.REQUEST })
export class EmpresaService {
  private readonly logger = new Logger(EmpresaService.name);

  constructor(
    private readonly empresaRepository: EmpresaRepository,
  ) {}

  async create(createEmpresaDto: CreateEmpresaDto): Promise<Empresa> {
    // Verificar se já existe empresa com este CNPJ
    if (createEmpresaDto.cnpj) {
      const existente = await this.empresaRepository.findByCnpj(createEmpresaDto.cnpj);
      if (existente) {
        throw new ConflictException(
          'Uma empresa com este CNPJ já está cadastrada.',
        );
      }
    }

    const empresa = this.empresaRepository.create(createEmpresaDto);
    return this.empresaRepository.save(empresa);
  }

  async findOne(): Promise<Empresa> {
    // Usa repositório tenant-aware para buscar empresa do tenant atual
    const empresa = await this.empresaRepository.findEmpresaAtual();
    
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
    // Buscar empresa com filtro de tenant (automático via repositório)
    const existingEmpresa = await this.empresaRepository.findOne({
      where: { id } as any,
    });
    
    if (!existingEmpresa) {
      throw new NotFoundException(`Empresa com ID "${id}" não encontrada para este tenant.`);
    }

    // Atualiza campos
    Object.assign(existingEmpresa, updateEmpresaDto);

    return this.empresaRepository.save(existingEmpresa);
  }
}
