// Caminho: backend/src/modulos/evento/evento.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { Evento } from './entities/evento.entity';
import { PaginaEvento } from '../pagina-evento/entities/pagina-evento.entity';
import { GcsStorageService } from '../../shared/storage/gcs-storage.service';
import { Express } from 'express';
// TODO: Criar EventoRepository quando necessário para multi-tenancy completo

@Injectable()
export class EventoService {
  private readonly logger = new Logger(EventoService.name);

  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
    @InjectRepository(PaginaEvento)
    private readonly paginaEventoRepository: Repository<PaginaEvento>,
    private readonly storageService: GcsStorageService,
  ) {}

  async create(createEventoDto: CreateEventoDto): Promise<Evento> {
    const { paginaEventoId, ...restoDoDto } = createEventoDto;

    let paginaEvento: PaginaEvento | null = null;
    if (paginaEventoId) {
      paginaEvento = await this.paginaEventoRepository.findOne({
        where: { id: paginaEventoId },
      });
      if (!paginaEvento) {
        throw new NotFoundException(
          `Página de Evento com ID "${paginaEventoId}" não encontrada.`,
        );
      }
    }

    const evento = this.eventoRepository.create({
      ...restoDoDto,
      paginaEvento,
    });
    return this.eventoRepository.save(evento);
  }

  findAll(): Promise<Evento[]> {
    // ✅ Garante que a paginaEvento (tema) seja sempre incluída na listagem
    return this.eventoRepository.find({
      relations: ['paginaEvento'],
      order: { dataEvento: 'DESC' },
    });
  }

  findAllPublic(): Promise<Evento[]> {
    return this.eventoRepository.find({
      where: { ativo: true },
      relations: ['paginaEvento'],
      order: { dataEvento: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Evento> {
    const evento = await this.eventoRepository.findOne({
      where: { id },
      relations: ['paginaEvento'],
    });
    if (!evento) {
      throw new NotFoundException(`Evento com ID "${id}" não encontrado.`);
    }
    return evento;
  }

  async update(id: string, updateEventoDto: UpdateEventoDto): Promise<Evento> {
    const { paginaEventoId, ...restoDoDto } = updateEventoDto;

    const evento = await this.eventoRepository.preload({
      id: id,
      ...restoDoDto,
    });
    if (!evento) {
      throw new NotFoundException(`Evento com ID "${id}" não encontrado.`);
    }

    if (updateEventoDto.hasOwnProperty('paginaEventoId')) {
      if (paginaEventoId) {
        const paginaEvento = await this.paginaEventoRepository.findOne({
          where: { id: paginaEventoId },
        });
        if (!paginaEvento) {
          throw new NotFoundException(
            `Página de Evento com ID "${paginaEventoId}" não encontrada.`,
          );
        }
        evento.paginaEvento = paginaEvento;
      } else {
        // Permite desassociar um tema ao enviar paginaEventoId: null
        evento.paginaEvento = null;
      }
    }

    return this.eventoRepository.save(evento);
  }

  async uploadImagem(id: string, file: Express.Multer.File): Promise<Evento> {
    const evento = await this.findOne(id);

    // Se já existir uma imagem antiga, apaga-a do Google Cloud Storage
    if (evento.urlImagem) {
      try {
        await this.storageService.deleteFile(evento.urlImagem);
        this.logger.log(`Imagem antiga do evento ${id} apagada do GCS.`);
      } catch (error) {
        this.logger.error(
          `Falha ao apagar a imagem antiga do GCS: ${evento.urlImagem}`,
          error,
        );
      }
    }

    // Faz o upload do novo ficheiro para a pasta 'eventos'
    const novaUrl = await this.storageService.uploadFile(file, 'eventos');

    // Atualiza a URL no registo do evento e salva no banco de dados
    evento.urlImagem = novaUrl;
    return this.eventoRepository.save(evento);
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Evento com ID "${id}" não encontrado.`);
    }
  }
}
