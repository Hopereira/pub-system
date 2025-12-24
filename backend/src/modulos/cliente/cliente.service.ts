import {
  ConflictException,
  Injectable,
  NotFoundException,
  // ✅ Importar BadRequestException para o erro de validação (futuro)
  BadRequestException,
} from '@nestjs/common';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { CreateClienteRapidoDto } from './dto/create-cliente-rapido.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Cliente } from './entities/cliente.entity';
import { ClienteRepository } from './cliente.repository';

@Injectable()
export class ClienteService {
  constructor(
    private readonly clienteRepository: ClienteRepository,
  ) {}

  async create(createClienteDto: CreateClienteDto): Promise<Cliente> {
    // ==========================================================
    // ✅ VALIDAÇÃO DE CPF (Comentada para Futuro Desbloqueio)
    // ==========================================================
    /*
    if (!this.validarCpf(createClienteDto.cpf)) {
        throw new BadRequestException('O CPF fornecido não é válido.');
    }
    */
    // ==========================================================

    const clienteExistente = await this.clienteRepository.findOne({
      where: { cpf: createClienteDto.cpf },
    });

    if (clienteExistente) {
      // Lança 409 Conflict se o cliente tentar se recadastrar
      throw new ConflictException(
        'Um cliente com este CPF já está cadastrado.',
      );
    }

    const cliente = this.clienteRepository.create(createClienteDto);
    return this.clienteRepository.save(cliente);
  }

  // ✅ NOVO: Criar cliente rápido (campos mínimos)
  async createRapido(dto: CreateClienteRapidoDto): Promise<Cliente> {
    // Se CPF foi fornecido, verifica se já existe
    if (dto.cpf) {
      const clienteExistente = await this.clienteRepository.findOne({
        where: { cpf: dto.cpf },
      });

      if (clienteExistente) {
        // Retorna o cliente existente ao invés de erro
        return clienteExistente;
      }
    }

    // Gera CPF temporário se não fornecido (para permitir criação rápida)
    const cpfFinal = dto.cpf || this.gerarCpfTemporario();

    const cliente = this.clienteRepository.create({
      nome: dto.nome,
      cpf: cpfFinal,
      celular: dto.telefone || null,
      email: null, // Opcional
      ambienteId: dto.ambienteId || null,
      pontoEntregaId: dto.pontoEntregaId || null,
    });

    return this.clienteRepository.save(cliente);
  }

  // Gera CPF temporário único
  private gerarCpfTemporario(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `999${timestamp.slice(-8)}`.slice(0, 11);
  }

  findAll(): Promise<Cliente[]> {
    return this.clienteRepository.find();
  }

  // Função para buscar o cliente pelo CPF (essencial para o fluxo de entrada pública)
  async findByCpf(cpf: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({
      where: { cpf },
    });

    if (!cliente) {
      // ESSENCIAL: Lança 404 para que o frontend saiba que deve CRIAR o cliente.
      throw new NotFoundException(`Cliente com CPF "${cpf}" não encontrado.`);
    }

    return cliente;
  }

  // ✅ NOVO: Busca flexível por nome ou CPF
  async buscar(termo: string): Promise<Cliente[]> {
    // Remove formatação do CPF se for número
    const termoLimpo = termo.replace(/[^\d]/g, '');

    // Se for um CPF (11 dígitos), busca por CPF
    if (termoLimpo.length === 11) {
      const cliente = await this.clienteRepository.findOne({
        where: { cpf: termoLimpo },
      });
      return cliente ? [cliente] : [];
    }

    // Caso contrário, busca por nome (case-insensitive, parcial)
    const clientes = await this.clienteRepository
      .createQueryBuilder('cliente')
      .where('LOWER(cliente.nome) LIKE LOWER(:termo)', {
        termo: `%${termo}%`,
      })
      .orderBy('cliente.nome', 'ASC')
      .limit(10) // Limita a 10 resultados
      .getMany();

    return clientes;
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

  // ✅ MÉTODO ADICIONADO: Função privada para validação de CPF
  /**
   * Valida se um número de CPF é logicamente válido.
   * Fonte: Algoritmo padrão de validação de CPF.
   */
  private validarCpf(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]/g, ''); // Remove caracteres não numéricos

    if (cpf.length !== 11) return false;
    // Bloqueia CPFs com dígitos repetidos (ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    let remainder;

    // Cálculo do 1º dígito verificador
    for (let i = 1; i <= 9; i++) {
      sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;

    sum = 0;
    // Cálculo do 2º dígito verificador
    for (let i = 1; i <= 10; i++) {
      sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;

    return true;
  }
}
