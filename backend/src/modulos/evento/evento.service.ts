import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { Evento } from './entities/evento.entity';

@Injectable()
export class EventoService {
  // 1. Injetar o "repositório" do Evento.
  // Pense no repositório como o nosso portão de acesso direto à tabela "eventos" no banco de dados.
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
  ) {}

  // O método create agora recebe o DTO, cria uma instância da entidade e a salva no banco.
  create(createEventoDto: CreateEventoDto): Promise<Evento> {
    const evento = this.eventoRepository.create(createEventoDto);
    return this.eventoRepository.save(evento);
  }

  // O findAll agora busca todos os eventos e os ordena pela data, do mais antigo para o mais recente.
  findAll(): Promise<Evento[]> {
    return this.eventoRepository.find({
      order: {
        dataEvento: 'ASC',
      },
    });
  }

  // O findOne agora busca um único evento pelo seu ID.
  // Se não encontrar, lança um erro 404 (NotFoundException), uma prática recomendada do NestJS.
  async findOne(id: string): Promise<Evento> {
    const evento = await this.eventoRepository.findOne({ where: { id } });
    if (!evento) {
      throw new NotFoundException(`Evento com ID "${id}" não encontrado.`);
    }
    return evento;
  }

  // O update usa `preload` para carregar o evento existente e mesclar os novos dados do DTO.
  // Isso evita que campos não enviados sejam apagados e também verifica se o evento existe.
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

  // O remove primeiro busca o evento para garantir que ele existe (lançando 404 se não existir) e depois o remove.
  async remove(id: string): Promise<void> {
    const evento = await this.findOne(id);
    await this.eventoRepository.remove(evento);
  }
}