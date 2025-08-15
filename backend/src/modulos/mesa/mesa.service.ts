import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMesaDto } from './dto/create-mesa.dto';
import { UpdateMesaDto } from './dto/update-mesa.dto';
import { Mesa } from './entities/mesa.entity';

@Injectable()
export class MesaService {
  constructor(
    @InjectRepository(Mesa)
    private readonly mesaRepository: Repository<Mesa>,
  ) {}

  async create(createMesaDto: CreateMesaDto): Promise<Mesa> {
    const mesaExistente = await this.mesaRepository.findOne({
      where: { numero: createMesaDto.numero },
    });

    if (mesaExistente) {
      throw new ConflictException(
        `A mesa número ${createMesaDto.numero} já está cadastrada.`,
      );
    }

    const mesa = this.mesaRepository.create(createMesaDto);
    return this.mesaRepository.save(mesa);
  }

  findAll(): Promise<Mesa[]> {
    // Adicionando uma ordenação para que as mesas venham em ordem
    return this.mesaRepository.find({
      order: {
        numero: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Mesa> {
    const mesa = await this.mesaRepository.findOne({ where: { id } });
    if (!mesa) {
      throw new NotFoundException(`Mesa com ID "${id}" não encontrada.`);
    }
    return mesa;
  }

  async update(id: string, updateMesaDto: UpdateMesaDto): Promise<Mesa> {
    const mesa = await this.mesaRepository.preload({
      id,
      ...updateMesaDto,
    });
    if (!mesa) {
      throw new NotFoundException(`Mesa com ID "${id}" não encontrada.`);
    }
    return this.mesaRepository.save(mesa);
  }

  async remove(id: string): Promise<void> {
    const mesa = await this.findOne(id);
    await this.mesaRepository.remove(mesa);
  }
}