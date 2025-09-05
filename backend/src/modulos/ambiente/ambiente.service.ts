import { Injectable, NotFoundException } from '@nestjs/common';
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

  async remove(id: string): Promise<void> {
    const ambiente = await this.findOne(id);
    await this.ambienteRepository.remove(ambiente);
  }
}