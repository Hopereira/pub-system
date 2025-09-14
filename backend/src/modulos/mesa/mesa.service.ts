// Caminho: backend/src/modulos/mesa/mesa.service.ts

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'; // ALTERAÇÃO 1: Importamos o ConflictException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mesa, MesaStatus } from './entities/mesa.entity';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import { Ambiente } from '../ambiente/entities/ambiente.entity';

@Injectable()
export class MesaService {
  constructor(
    @InjectRepository(Mesa)
    private readonly mesaRepository: Repository<Mesa>,
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
  ) {}

  // --- MÉTODO ATUALIZADO COM TRATAMENTO DE ERRO ---
  async create(createMesaDto: CreateMesaDto): Promise<Mesa> {
    const { numero, ambienteId } = createMesaDto;

    const ambiente = await this.ambienteRepository.findOne({ where: { id: ambienteId } });
    if (!ambiente) {
      throw new NotFoundException(`Ambiente com ID "${ambienteId}" não encontrado.`);
    }

    const mesa = this.mesaRepository.create({
      numero,
      ambiente,
    });

    // ALTERAÇÃO 2: Envolvemos a operação de salvar em um bloco try...catch
    try {
      return await this.mesaRepository.save(mesa);
    } catch (error) {
      // ALTERAÇÃO 3: Verificamos se o código do erro é de duplicidade ('23505')
      if (error.code === '23505') {
        throw new ConflictException(
          'Já existe uma mesa com este número neste ambiente.',
        );
      }
      // Se for qualquer outro tipo de erro, nós o relançamos para ser tratado por outra camada
      throw error;
    }
  }

  async findAll(): Promise<Mesa[]> {
    const mesas = await this.mesaRepository.find({
      relations: ['ambiente', 'comandas'],
      order: { numero: 'ASC' },
    });
    return mesas.map(mesa => {
      const temComandaAberta = mesa.comandas?.some(comanda => comanda.status === 'ABERTA');
      return {
        ...mesa,
        status: temComandaAberta ? MesaStatus.OCUPADA : MesaStatus.LIVRE,
      };
    });
  }

  async findOne(id: string): Promise<Mesa> {
    const mesa = await this.mesaRepository.findOne({
      where: { id },
      relations: ['ambiente'],
    });
    if (!mesa) {
      throw new NotFoundException(`Mesa com ID "${id}" não encontrada.`);
    }
    return mesa;
  }

  async update(id: string, updateMesaDto: UpdateMesaDto): Promise<Mesa> {
    const { ambienteId, ...dadosUpdate } = updateMesaDto;
    
    const mesa = await this.mesaRepository.preload({
      id: id,
      ...dadosUpdate,
    });
    if (!mesa) {
      throw new NotFoundException(`Mesa com ID "${id}" não encontrada.`);
    }

    if (ambienteId) {
      const ambiente = await this.ambienteRepository.findOne({ where: { id: ambienteId } });
      if (!ambiente) {
        throw new NotFoundException(`Ambiente com ID "${ambienteId}" não encontrado.`);
      }
      mesa.ambiente = ambiente;
    }
    
    // NOTA: O update também poderia ter o mesmo tratamento de erro de duplicidade.
    // Vamos focar no create primeiro, mas saiba que seria bom adicionar aqui também.
    return this.mesaRepository.save(mesa);
  }

  async remove(id: string): Promise<void> {
    const mesa = await this.findOne(id);
    await this.mesaRepository.remove(mesa);
  }
}