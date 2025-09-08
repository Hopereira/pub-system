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
    const { numero, ambienteId } = createMesaDto;

    const mesaExistente = await this.mesaRepository.findOne({
      where: {
        numero: numero,
        ambiente: { id: ambienteId },
      },
    });

    if (mesaExistente) {
      throw new ConflictException(
        `A mesa número ${numero} já está cadastrada neste ambiente.`,
      );
    }

    const mesa = this.mesaRepository.create({
      numero: numero,
      ambiente: { id: ambienteId },
    });
    
    const mesaSalva = await this.mesaRepository.save(mesa);

    return this.findOne(mesaSalva.id);
  }

  findAll(): Promise<Mesa[]> {
    return this.mesaRepository.find({
      relations: ['ambiente'],
      order: {
        numero: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<Mesa> {
    const mesa = await this.mesaRepository.findOne({
      where: { id },
      relations: ['ambiente'],
    });
    if (!mesa) {
      throw new NotFoundException(`Mesa com ID "${id}" não encontrada.`);
    }
    return mesa;
  }

  async update(id: string, updateMesaDto: UpdateMesaDto): Promise<Mesa> {
    // --- CORREÇÃO AQUI ---

    // Prepara a entidade para atualização, garantindo que o ambiente seja tratado como relação
    const mesa = await this.mesaRepository.preload({
      id: id,
      numero: updateMesaDto.numero,
      ambiente: updateMesaDto.ambienteId ? { id: updateMesaDto.ambienteId } : undefined,
    });
    
    if (!mesa) {
      throw new NotFoundException(`Mesa com ID "${id}" não encontrada.`);
    }

    try {
      // 1. Salva as alterações
      await this.mesaRepository.save(mesa);
      // 2. Retorna a entidade completa usando o findOne
      return this.findOne(id);
    } catch (error) {
      // Adicionamos o mesmo tratamento de erro da função 'create'
      if (error.code === '23505') {
        throw new ConflictException(
          `A mesa número ${mesa.numero} já está cadastrada neste ambiente.`,
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const mesa = await this.findOne(id);
    await this.mesaRepository.remove(mesa);
  }
}