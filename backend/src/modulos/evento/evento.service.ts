// Caminho: backend/src/modulos/evento/evento.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { Evento } from './entities/evento.entity';
import { GcsStorageService } from '../../shared/storage/gcs-storage.service';

@Injectable()
export class EventoService {
  private readonly logger = new Logger(EventoService.name);

  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    private readonly storageService: GcsStorageService,
  ) {}

  async create(createEventoDto: CreateEventoDto): Promise<Evento> {
    const evento = this.eventoRepository.create(createEventoDto);
    return this.eventoRepository.save(evento);
  }

  findAll(): Promise<Evento[]> {
    return this.eventoRepository.find({ order: { dataEvento: 'DESC' } });
  }

  findAllPublic(): Promise<Evento[]> {
    return this.eventoRepository.find({ where: { ativo: true }, order: { dataEvento: 'ASC' } });
  }

  async findOne(id: string): Promise<Evento> {
    const evento = await this.eventoRepository.findOne({ where: { id } });
    if (!evento) {
      throw new NotFoundException(`Evento com ID "${id}" não encontrado.`);
    }
    return evento;
  }

  async update(id: string, updateEventoDto: UpdateEventoDto): Promise<Evento> {
    const evento = await this.eventoRepository.preload({
      id: id,
      ...updateEventoDto,
    });
    if (!evento) {
      throw new NotFoundException(`Evento com ID "${id}" não encontrado.`);
    }
    return this.eventoRepository.save(evento);
  }

  // =================================================================
  // ✅ CORREÇÃO 1: Lógica de exclusão robusta
  // =================================================================
  async remove(id: string): Promise<void> {
    // Primeiro, buscamos o evento completo
    const evento = await this.findOne(id);

    // Segundo, se ele tiver uma imagem, apagamos do Google Cloud Storage
    if (evento.urlImagem) {
      this.logger.log(`A apagar imagem do GCS: ${evento.urlImagem}`);
      try {
        await this.storageService.deleteFile(evento.urlImagem);
      } catch (error) {
        this.logger.error(`Falha ao apagar a imagem do GCS. O processo de exclusão do DB continuará. Erro: ${error.message}`);
      }
    }

    // Terceiro, após limpar o storage, apagamos do banco de dados
    const result = await this.eventoRepository.delete(id);
    if (result.affected === 0) {
      // Esta verificação é uma segurança extra, embora o findOne já valide
      throw new NotFoundException(`Evento com ID "${id}" não encontrado para exclusão.`);
    }
  }

  // =================================================================
  // ✅ CORREÇÃO 2: Renomeado de 'updateUrlImagem' para 'uploadImagem'
  // =================================================================
  async uploadImagem(id: string, file: Express.Multer.File): Promise<Evento> {
    this.logger.log(`A iniciar upload para o GCS para o evento ID ${id}`);
    const evento = await this.findOne(id);

    if (evento.urlImagem) {
      this.logger.log(`A apagar imagem antiga do GCS: ${evento.urlImagem}`);
      try {
        await this.storageService.deleteFile(evento.urlImagem);
      } catch (error) {
        this.logger.error(`Falha ao apagar a imagem antiga. O processo continuará. Erro: ${error.message}`);
      }
    }

    const publicUrl = await this.storageService.uploadFile(file);
    this.logger.log(`Upload para GCS concluído. URL pública: ${publicUrl}`);

    evento.urlImagem = publicUrl;
    return this.eventoRepository.save(evento);
  }
}