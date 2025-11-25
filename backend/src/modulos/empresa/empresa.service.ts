import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { Empresa } from './entities/empresa.entity';

@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
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
    const empresa = await this.empresaRepository.findOneBy({});
    if (!empresa) {
      throw new NotFoundException('Nenhuma empresa encontrada.');
    }
    return empresa;
  }

  async update(
    id: string,
    updateEmpresaDto: UpdateEmpresaDto,
  ): Promise<Empresa> {
    const empresa = await this.empresaRepository.preload({
      id: id,
      ...updateEmpresaDto,
    });
    if (!empresa) {
      throw new NotFoundException(`Empresa com ID "${id}" não encontrada.`);
    }

    return this.empresaRepository.save(empresa);
  }
}
