// Caminho: backend/src/modulos/mesa/mesa.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mesa, MesaStatus } from './entities/mesa.entity';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import { Ambiente } from '../ambiente/entities/ambiente.entity'; // ALTERADO: Importamos a entidade Ambiente

@Injectable()
export class MesaService {
  constructor(
    @InjectRepository(Mesa)
    private readonly mesaRepository: Repository<Mesa>,
    // --- ALTERAÇÃO INSERIDA: Injetamos o repositório de Ambiente ---
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
  ) {}

  // --- MÉTODO ATUALIZADO ---
  async create(createMesaDto: CreateMesaDto): Promise<Mesa> {
    const { numero, ambienteId } = createMesaDto;

    // 1. Validamos se o ambiente fornecido existe
    const ambiente = await this.ambienteRepository.findOne({ where: { id: ambienteId } });
    if (!ambiente) {
      throw new NotFoundException(`Ambiente com ID "${ambienteId}" não encontrado.`);
    }

    // 2. Criamos a mesa e já associamos o objeto ambiente completo
    const mesa = this.mesaRepository.create({
      numero,
      ambiente, // Passamos o objeto, não o ID
    });

    // 3. Salvamos a mesa com a relação correta
    return this.mesaRepository.save(mesa);
  }

  // --- MÉTODO CORRIGIDO ---
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

  // --- MÉTODO ATUALIZADO ---
  async update(id: string, updateMesaDto: UpdateMesaDto): Promise<Mesa> {
    const { ambienteId, ...dadosUpdate } = updateMesaDto;
    
    // Primeiro, pré-carregamos a mesa com os dados simples (ex: numero)
    const mesa = await this.mesaRepository.preload({
      id: id,
      ...dadosUpdate,
    });
    if (!mesa) {
      throw new NotFoundException(`Mesa com ID "${id}" não encontrada.`);
    }

    // Se um novo ambienteId foi fornecido, validamos e atualizamos a relação
    if (ambienteId) {
      const ambiente = await this.ambienteRepository.findOne({ where: { id: ambienteId } });
      if (!ambiente) {
        throw new NotFoundException(`Ambiente com ID "${ambienteId}" não encontrado.`);
      }
      mesa.ambiente = ambiente;
    }
    
    return this.mesaRepository.save(mesa);
  }

  async remove(id: string): Promise<void> {
    const mesa = await this.findOne(id);
    await this.mesaRepository.remove(mesa);
  }
}