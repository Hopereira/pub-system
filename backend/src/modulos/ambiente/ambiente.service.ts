// Caminho: backend/src/modulos/ambiente/ambiente.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'; // 1. Importamos ConflictException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAmbienteDto } from './dto/create-ambiente.dto';
import { UpdateAmbienteDto } from './dto/update-ambiente.dto';
import { Ambiente } from './entities/ambiente.entity';

@Injectable()
export class AmbienteService {
  constructor(
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
  ) {}

  create(createAmbienteDto: CreateAmbienteDto): Promise<Ambiente> {
    const ambiente = this.ambienteRepository.create(createAmbienteDto);
    return this.ambienteRepository.save(ambiente);
  }

  findAll(): Promise<Ambiente[]> {
    return this.ambienteRepository.find();
  }

  async findOne(id: string): Promise<Ambiente> {
    const ambiente = await this.ambienteRepository.findOne({ where: { id } });
    if (!ambiente) {
      throw new NotFoundException(`Ambiente com ID "${id}" não encontrado.`);
    }
    return ambiente;
  }

  async update(id: string, updateAmbienteDto: UpdateAmbienteDto): Promise<Ambiente> {
    const ambiente = await this.ambienteRepository.preload({
      id,
      ...updateAmbienteDto,
    });
    if (!ambiente) {
      throw new NotFoundException(`Ambiente com ID "${id}" não encontrado.`);
    }
    return this.ambienteRepository.save(ambiente);
  }

  // --- MÉTODO 'remove' ATUALIZADO COM TRATAMENTO DE ERRO ---
  async remove(id: string): Promise<void> {
    const ambiente = await this.findOne(id);
    try {
      await this.ambienteRepository.remove(ambiente);
    } catch (error) {
      // O código de erro '23503' é específico do PostgreSQL para violação de chave estrangeira
      if (error.code === '23503') {
        throw new ConflictException(
          'Este ambiente não pode ser apagado pois está em uso por produtos ou funcionários.',
        );
      }
      // Se for um erro diferente, nós o relançamos para não esconder outros possíveis bugs
      throw error;
    }
  }
  // --- FIM DA ATUALIZAÇÃO ---
}