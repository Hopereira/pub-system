import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cliente } from '../cliente/entities/cliente.entity';
import { Mesa } from '../mesa/entities/mesa.entity';
import { CreateComandaDto } from './dto/create-comanda.dto';
import { UpdateComandaDto } from './dto/update-comanda.dto';
import { Comanda } from './entities/comanda.entity';

@Injectable()
export class ComandaService {
  constructor(
    @InjectRepository(Comanda)
    private readonly comandaRepository: Repository<Comanda>,
    @InjectRepository(Mesa)
    private readonly mesaRepository: Repository<Mesa>,
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
  ) {}

  async create(createComandaDto: CreateComandaDto): Promise<Comanda> {
    const { mesaId, clienteId } = createComandaDto;

    // Regra 1: Não pode criar uma comanda sem mesa E sem cliente.
    if (!mesaId && !clienteId) {
      throw new BadRequestException(
        'A comanda precisa estar associada a uma mesa ou a um cliente.',
      );
    }

    // Regra 2: Não pode criar uma comanda com mesa E com cliente ao mesmo tempo.
    if (mesaId && clienteId) {
      throw new BadRequestException(
        'A comanda não pode ser associada a uma mesa e a um cliente simultaneamente.',
      );
    }

    let comandaData: Partial<Comanda> = {};

    if (mesaId) {
      const mesa = await this.mesaRepository.findOne({ where: { id: mesaId } });
      if (!mesa) {
        throw new NotFoundException(`Mesa com ID "${mesaId}" não encontrada.`);
      }
      comandaData.mesa = mesa;
    }

    if (clienteId) {
      const cliente = await this.clienteRepository.findOne({
        where: { id: clienteId },
      });
      if (!cliente) {
        throw new NotFoundException(
          `Cliente com ID "${clienteId}" não encontrado.`,
        );
      }
      comandaData.cliente = cliente;
    }

    const comanda = this.comandaRepository.create(comandaData);
    return this.comandaRepository.save(comanda);
  }

  findAll(): Promise<Comanda[]> {
    return this.comandaRepository.find({
      relations: ['mesa', 'cliente'],
    });
  }

  async findOne(id: string): Promise<Comanda> {
    const comanda = await this.comandaRepository.findOne({
      where: { id },
      relations: ['mesa', 'cliente'],
    });
    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`);
    }
    return comanda;
  }

  async update(
    id: string,
    updateComandaDto: UpdateComandaDto,
  ): Promise<Comanda> {
    const comanda = await this.comandaRepository.preload({
      id,
      ...updateComandaDto,
    });
    if (!comanda) {
      throw new NotFoundException(`Comanda com ID "${id}" não encontrada.`);
    }
    return this.comandaRepository.save(comanda);
  }

  async remove(id: string): Promise<void> {
    const comanda = await this.findOne(id);
    await this.comandaRepository.remove(comanda);
  }
}
