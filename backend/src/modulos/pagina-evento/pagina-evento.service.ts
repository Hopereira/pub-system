// Caminho: backend/src/modulos/pagina-evento/pagina-evento.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaginaEventoDto } from './dto/create-pagina-evento.dto';
import { UpdatePaginaEventoDto } from './dto/update-pagina-evento.dto';
import { PaginaEvento } from './entities/pagina-evento.entity';

@Injectable()
export class PaginaEventoService {
  constructor(
    @InjectRepository(PaginaEvento)
    private readonly paginaEventoRepository: Repository<PaginaEvento>,
  ) {}

  // --- Criar (Create) ---
  create(createPaginaEventoDto: CreatePaginaEventoDto): Promise<PaginaEvento> {
    const paginaEvento = this.paginaEventoRepository.create(createPaginaEventoDto);
    return this.paginaEventoRepository.save(paginaEvento);
  }

  // --- Ler Todos (Read All) ---
  findAll(): Promise<PaginaEvento[]> {
    return this.paginaEventoRepository.find({ order: { criadoEm: 'DESC' } });
  }

  // --- Ler Um (Read One) ---
  async findOne(id: string): Promise<PaginaEvento> {
    const paginaEvento = await this.paginaEventoRepository.findOne({ where: { id } });
    if (!paginaEvento) {
      throw new NotFoundException(`Página de Evento com ID "${id}" não encontrada.`);
    }
    return paginaEvento;
  }

  // --- Atualizar (Update) ---
  async update(id: string, updatePaginaEventoDto: UpdatePaginaEventoDto): Promise<PaginaEvento> {
    const paginaEvento = await this.paginaEventoRepository.preload({
      id,
      ...updatePaginaEventoDto,
    });
    if (!paginaEvento) {
      throw new NotFoundException(`Página de Evento com ID "${id}" não encontrada.`);
    }
    return this.paginaEventoRepository.save(paginaEvento);
  }

  // --- Apagar (Remove) ---
  async remove(id: string): Promise<void> {
    const paginaEvento = await this.findOne(id);
    await this.paginaEventoRepository.remove(paginaEvento);
  }
}