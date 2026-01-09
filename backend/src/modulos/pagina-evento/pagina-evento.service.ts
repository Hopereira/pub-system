// Caminho: backend/src/modulos/pagina-evento/pagina-evento.service.ts

import { Injectable, NotFoundException, Scope } from '@nestjs/common';
import { CreatePaginaEventoDto } from './dto/create-pagina-evento.dto';
import { UpdatePaginaEventoDto } from './dto/update-pagina-evento.dto';
import { PaginaEvento } from './entities/pagina-evento.entity';
import { GcsStorageService } from 'src/shared/storage/gcs-storage.service';
import { PaginaEventoRepository } from './pagina-evento.repository';

@Injectable({ scope: Scope.REQUEST })
export class PaginaEventoService {
  constructor(
    private readonly paginaEventoRepository: PaginaEventoRepository,
    private readonly gcsStorageService: GcsStorageService,
  ) {}

  // --- Criar (Create) ---
  create(createPaginaEventoDto: CreatePaginaEventoDto): Promise<PaginaEvento> {
    const paginaEvento = this.paginaEventoRepository.create(
      createPaginaEventoDto,
    );
    return this.paginaEventoRepository.save(paginaEvento);
  }

  // --- Ler Todos (Read All) ---
  findAll(): Promise<PaginaEvento[]> {
    return this.paginaEventoRepository.find({ order: { criadoEm: 'DESC' } });
  }

  // --- Ler Um (Read One) ---
  async findOne(id: string): Promise<PaginaEvento> {
    const paginaEvento = await this.paginaEventoRepository.findOne({
      where: { id },
    });
    if (!paginaEvento) {
      throw new NotFoundException(
        `Página de Evento com ID "${id}" não encontrada.`,
      );
    }
    return paginaEvento;
  }

  // --- Ler Um Público (Read One Public) ---
  /**
   * Busca página de evento por ID sem filtro de tenant
   * ⚠️ Usado apenas para rotas públicas (QR Code/Link)
   */
  async findOnePublic(id: string): Promise<PaginaEvento> {
    const paginaEvento = await this.paginaEventoRepository.findByIdPublic(id);
    if (!paginaEvento) {
      throw new NotFoundException(
        `Página de Evento com ID "${id}" não encontrada.`,
      );
    }
    return paginaEvento;
  }

  // --- Atualizar (Update) ---
  async update(
    id: string,
    updatePaginaEventoDto: UpdatePaginaEventoDto,
  ): Promise<PaginaEvento> {
    const paginaEvento = await this.paginaEventoRepository.preload({
      id,
      ...updatePaginaEventoDto,
    });
    if (!paginaEvento) {
      throw new NotFoundException(
        `Página de Evento com ID "${id}" não encontrada.`,
      );
    }
    return this.paginaEventoRepository.save(paginaEvento);
  }

  // --- Apagar (Remove) ---
  async remove(id: string): Promise<void> {
    const paginaEvento = await this.findOne(id);
    if (paginaEvento.urlImagem) {
      await this.gcsStorageService.deleteFile(paginaEvento.urlImagem);
    }
    await this.paginaEventoRepository.remove(paginaEvento);
  }

  // --- Upload de Mídia ---
  async uploadMedia(
    id: string,
    file: Express.Multer.File,
  ): Promise<PaginaEvento> {
    const paginaEvento = await this.findOne(id);

    if (paginaEvento.urlImagem) {
      await this.gcsStorageService.deleteFile(paginaEvento.urlImagem);
    }

    const publicUrl = await this.gcsStorageService.uploadFile(file);

    paginaEvento.urlImagem = publicUrl;
    return this.paginaEventoRepository.save(paginaEvento);
  }

  // --- NOVO MÉTODO ADICIONADO ---
  /**
   * Encontra a primeira página de evento que está marcada como "ativa".
   * Retorna nulo se nenhuma for encontrada.
   * ⚠️ Usado em rota pública - sem filtro de tenant
   */
  async findAtiva(): Promise<PaginaEvento | null> {
    const paginasAtivas = await this.paginaEventoRepository.findWithoutTenant({ 
      where: { ativa: true } as any 
    });
    return paginasAtivas.length > 0 ? paginasAtivas[0] : null;
  }
}
