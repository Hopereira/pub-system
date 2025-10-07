import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { Evento } from './entities/evento.entity';

@Injectable()
export class EventoService {
  // ✅ NOVO: Inicializamos o Logger
  private readonly logger = new Logger(EventoService.name);

  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
  ) {}

  async create(createEventoDto: CreateEventoDto): Promise<Evento> {
    this.logger.log(`Tentando criar evento no serviço...`);
    try {
      const evento = this.eventoRepository.create(createEventoDto);
      const savedEvento = await this.eventoRepository.save(evento);
      this.logger.log(`Evento criado com sucesso! ID: ${savedEvento.id}`);
      return savedEvento;
    } catch (error) {
      // ✅ NOVO: Log de erro detalhado
      this.logger.error(`Falha ao criar evento. Erro: ${error.message}`, error.stack);
      throw error; // Re-lança o erro para o controller
    }
  }

  // ... (o restante do ficheiro pode continuar igual, mas os logs nos outros métodos também ajudariam)
  // findAll, findAllPublic, findOne, update, remove

  async update(id: string, updateEventoDto: UpdateEventoDto): Promise<Evento> {
    this.logger.log(`Tentando atualizar evento ID ${id} no serviço...`);
    try {
      const evento = await this.eventoRepository.preload({
        id: id,
        ...updateEventoDto,
      });
      if (!evento) {
        throw new NotFoundException(`Evento com ID "${id}" não encontrado.`);
      }
      const updatedEvento = await this.eventoRepository.save(evento);
      this.logger.log(`Evento ID ${id} atualizado com sucesso!`);
      return updatedEvento;
    } catch (error) {
      this.logger.error(`Falha ao atualizar evento ID ${id}. Erro: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Tentando remover evento ID ${id} no serviço...`);
    const result = await this.eventoRepository.delete(id);
    if (result.affected === 0) {
      this.logger.warn(`Tentativa de remover evento ID ${id} não encontrou o registo.`);
      throw new NotFoundException(`Evento com ID "${id}" não encontrado.`);
    }
    this.logger.log(`Evento ID ${id} removido com sucesso.`);
  }
  
  // As funções findAll e findAllPublic não precisam de logs tão detalhados por agora.
  findAll(): Promise<Evento[]> { return this.eventoRepository.find({ order: { dataEvento: 'DESC' } }); }
  findAllPublic(): Promise<Evento[]> { return this.eventoRepository.find({ where: { ativo: true }, order: { dataEvento: 'ASC' } }); }
  async findOne(id: string): Promise<Evento> { const evento = await this.eventoRepository.findOne({ where: { id } }); if (!evento) { throw new NotFoundException(`Evento com ID "${id}" não encontrado.`); } return evento; }
}
