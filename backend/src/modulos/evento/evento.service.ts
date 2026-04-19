// Caminho: backend/src/modulos/evento/evento.service.ts
import { Injectable, NotFoundException, Logger, Optional } from '@nestjs/common';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { Evento } from './entities/evento.entity';
import { PaginaEvento } from '../pagina-evento/entities/pagina-evento.entity';
import { GcsStorageService } from '../../shared/storage/gcs-storage.service';
import { Express } from 'express';
import { EventoRepository } from './evento.repository';
import { PaginaEventoRepository } from '../pagina-evento/pagina-evento.repository';
import { PlanFeaturesService } from '../../common/tenant/services/plan-features.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';

@Injectable()
export class EventoService {
  private readonly logger = new Logger(EventoService.name);

  constructor(
    private readonly eventoRepository: EventoRepository,
    private readonly paginaEventoRepository: PaginaEventoRepository,
    private readonly storageService: GcsStorageService,
    @Optional() private readonly planFeaturesService?: PlanFeaturesService,
    @Optional() private readonly tenantContext?: TenantContextService,
  ) {}

  async create(createEventoDto: CreateEventoDto): Promise<Evento> {
    // Verificar limite do plano
    const tenantId = this.tenantContext?.getTenantIdOrNull?.() ?? null;
    if (tenantId && this.planFeaturesService) {
      const currentCount = await this.eventoRepository.count();
      await this.planFeaturesService.requireLimitForTenant(tenantId, 'maxEventos', currentCount);
    }

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
    return this.eventoRepository.find({
      relations: ['paginaEvento'],
      order: { dataEvento: 'DESC' } as any,
    });
  }

  findAllPublic(): Promise<Evento[]> {
    return this.eventoRepository.rawRepository.find({
      where: { ativo: true },
      relations: ['paginaEvento'],
      order: { dataEvento: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Evento> {
    const evento = await this.eventoRepository.rawRepository.findOne({
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
        evento.paginaEvento = null;
      }
    }

    return this.eventoRepository.save(evento);
  }

  async uploadImagem(id: string, file: Express.Multer.File): Promise<Evento> {
    const evento = await this.findOne(id);

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

    const novaUrl = await this.storageService.uploadFile(file, 'eventos');
    evento.urlImagem = novaUrl;
    return this.eventoRepository.save(evento);
  }

  async remove(id: string): Promise<void> {
    const evento = await this.findOne(id);
    await this.eventoRepository.remove(evento);
  }
}
