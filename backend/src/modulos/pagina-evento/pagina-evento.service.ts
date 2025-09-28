// Caminho: backend/src/modulos/pagina-evento/pagina-evento.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaginaEventoDto } from './dto/create-pagina-evento.dto';
import { UpdatePaginaEventoDto } from './dto/update-pagina-evento.dto';
import { PaginaEvento } from './entities/pagina-evento.entity';
import { GcsStorageService } from 'src/shared/storage/gcs-storage.service'; // <-- 1. IMPORTAR

@Injectable()
export class PaginaEventoService {
  constructor(
    @InjectRepository(PaginaEvento)
    private readonly paginaEventoRepository: Repository<PaginaEvento>,
    private readonly gcsStorageService: GcsStorageService, // <-- 2. INJETAR O SERVIÇO
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
    // Antes de apagar do nosso banco, apaga o ficheiro do Google Storage
    if (paginaEvento.urlImagem) {
      await this.gcsStorageService.deleteFile(paginaEvento.urlImagem);
    }
    await this.paginaEventoRepository.remove(paginaEvento);
  }

  // --- 3. ADICIONAR O NOVO MÉTODO DE UPLOAD ---
  async uploadMedia(id: string, file: Express.Multer.File): Promise<PaginaEvento> {
    // Encontra a página de evento no banco de dados
    const paginaEvento = await this.findOne(id);

    // Se já existir uma mídia antiga, apaga-a do Google Storage para não acumular lixo
    if (paginaEvento.urlImagem) {
      await this.gcsStorageService.deleteFile(paginaEvento.urlImagem);
    }

    // Faz o upload do novo ficheiro e recebe a URL pública de volta
    const publicUrl = await this.gcsStorageService.uploadFile(file);

    // Atualiza o campo no nosso objeto e salva no banco de dados
    paginaEvento.urlImagem = publicUrl;
    return this.paginaEventoRepository.save(paginaEvento);
  }
}