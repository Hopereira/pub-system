import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { Evento } from './entities/evento.entity';

@Injectable()
export class EventoService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
  ) {}

  // Cria um novo evento
  create(createEventoDto: CreateEventoDto): Promise<Evento> {
    const evento = this.eventoRepository.create(createEventoDto);
    return this.eventoRepository.save(evento);
  }

  // Retorna TODOS os eventos (para o admin).
  findAll(): Promise<Evento[]> {
    return this.eventoRepository.find({
      order: {
        dataEvento: 'DESC', 
      },
    });
  }

  // Retorna apenas os eventos públicos e ativos (para o cliente).
  findAllPublic(): Promise<Evento[]> {
    return this.eventoRepository.find({
      where: {
        ativo: true,
      },
      order: {
        dataEvento: 'ASC', 
      },
    });
  }

  // Encontra um evento específico pelo ID
  async findOne(id: string): Promise<Evento> {
    const evento = await this.eventoRepository.findOne({ where: { id } });
    if (!evento) {
      throw new NotFoundException(`Evento com ID "${id}" não encontrado.`);
    }
    return evento;
  }

  // Atualiza um evento
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

  // Apaga um evento
  async remove(id: string): Promise<void> {
    const result = await this.eventoRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Evento com ID "${id}" não encontrado.`);
    }
  }
}