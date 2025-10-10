import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';

@Injectable()
export class ClienteService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
  ) {}

  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    const clienteExistente = await this.clienteRepository.findOne({
      where: { cpf: createClienteDto.cpf },
    });

    if (clienteExistente) {
      // ✅ Lança 409 Conflict se o cliente tentar se recadastrar
      throw new ConflictException('Um cliente com este CPF já está cadastrado.');
    }

    const cliente = this.clienteRepository.create(createClienteDto);
    return this.clienteRepository.save(cliente);
  }

  findAll(): Promise<Cliente[]> {
    return this.clienteRepository.find();
  }

  // ✅ NOVO: Função para buscar o cliente pelo CPF (essencial para o fluxo de entrada pública)
  async findByCpf(cpf: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({ 
        where: { cpf } 
    });

    if (!cliente) {
      // ✅ ESSENCIAL: Lança 404 para que o frontend saiba que deve CRIAR o cliente.
      throw new NotFoundException(`Cliente com CPF "${cpf}" não encontrado.`);
    }

    return cliente;
  }

  async findOne(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({ where: { id } });
    if (!cliente) {
      throw new NotFoundException(`Cliente com ID "${id}" não encontrado.`);
    }
    return cliente;
  }

  async update(
    id: string,
    updateClienteDto: UpdateClienteDto,
  ): Promise<Cliente> {
    const cliente = await this.clienteRepository.preload({
      id,
      ...updateClienteDto,
    });
    if (!cliente) {
      throw new NotFoundException(`Cliente com ID "${id}" não encontrado.`);
    }
    return this.clienteRepository.save(cliente);
  }

  async remove(id: string): Promise<void> {
    const cliente = await this.findOne(id);
    await this.clienteRepository.remove(cliente);
  }
}