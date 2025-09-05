// Caminho: backend/src/modulos/ambiente/ambiente.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

  // --- MÉTODO 'findAll' ATUALIZADO PARA CONTAR PRODUTOS E MESAS ---
  async findAll(): Promise<any[]> {
    const ambientes = await this.ambienteRepository
      .createQueryBuilder('ambiente')
      .leftJoin('ambiente.produtos', 'produto') // Faz a junção com produtos
      .leftJoin('ambiente.mesas', 'mesa')       // Faz a junção com mesas
      .select('ambiente.id', 'id')
      .addSelect('ambiente.nome', 'nome')
      .addSelect('COUNT(DISTINCT produto.id)', 'productCount') // Conta produtos distintos
      .addSelect('COUNT(DISTINCT mesa.id)', 'tableCount')       // Conta mesas distintas
      .groupBy('ambiente.id')
      .orderBy('ambiente.nome', 'ASC')
      .getRawMany();

    // Converte as contagens de string para número
    return ambientes.map(ambiente => ({
      ...ambiente,
      productCount: parseInt(ambiente.productCount, 10),
      tableCount: parseInt(ambiente.tableCount, 10),
    }));
  }
  // --- FIM DA ATUALIZAÇÃO ---

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
    try {
      await this.ambienteRepository.remove(ambiente);
    } catch (error) {
      if (error.code === '23503') {
        throw new ConflictException(
          'Este ambiente não pode ser apagado pois está em uso por produtos ou mesas.',
        );
      }
      throw error;
    }
  }
}