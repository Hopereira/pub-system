import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm'; // <--- ESTA É A LINHA QUE FALTAVA
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { Empresa } from './entities/empresa.entity';

@Injectable()
export class EmpresaService {
  // Aqui pedimos ao NestJS para nos dar a ferramenta para acessar a tabela 'Empresa'
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  // Lógica para CRIAR uma empresa
  async create(createEmpresaDto: CreateEmpresaDto): Promise<Empresa> {
    // Primeiro, contamos quantas empresas já existem
    const count = await this.empresaRepository.count();
    // Se já existir mais de 0 (ou seja, 1), nós lançamos um erro
    if (count > 0) {
      throw new ConflictException('Já existe uma empresa cadastrada no sistema.');
    }
    // Se não existir nenhuma, criamos e salvamos
    const empresa = this.empresaRepository.create(createEmpresaDto);
    return this.empresaRepository.save(empresa);
  }

  // Lógica para BUSCAR a empresa
  async find(): Promise<Empresa> {
    // Buscamos todas as empresas (sabemos que só haverá uma)
    const empresas = await this.empresaRepository.find();
    if (empresas.length === 0) {
      throw new NotFoundException('Nenhuma empresa encontrada.');
    }
    // Retornamos a primeira (e única) da lista
    return empresas[0];
  }

  // Lógica para ATUALIZAR a empresa
  async update(id: string, updateEmpresaDto: UpdateEmpresaDto): Promise<Empresa> {
    // Carregamos a empresa existente e aplicamos as novas informações
    const empresa = await this.empresaRepository.preload({
      id: id,
      ...updateEmpresaDto,
    });
    if (!empresa) {
      throw new NotFoundException(`Empresa com ID "${id}" não encontrada.`);
    }
    // Salvamos as alterações
    return this.empresaRepository.save(empresa);
  }
}