import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { Empresa } from './entities/empresa.entity';

@Injectable()
export class EmpresaService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}

  /**
   * Cria o registro da empresa no banco de dados.
   * Apenas um registro com um CNPJ único é permitido.
   * @param createEmpresaDto Os dados para criar a empresa.
   * @returns A entidade Empresa criada.
   * @throws {ConflictException} Se uma empresa com o mesmo CNPJ já estiver cadastrada.
   */
  async create(createEmpresaDto: CreateEmpresaDto): Promise<Empresa> {
    const empresa = this.empresaRepository.create(createEmpresaDto);
    try {
      // Nós simplesmente tentamos salvar. A verificação fica por conta do banco de dados.
      return await this.empresaRepository.save(empresa);
    } catch (error) {
      // O PostgreSQL retorna o código '23505' para violação de constraint UNIQUE.
      if (error.code === '23505') {
        throw new ConflictException('Uma empresa com este CNPJ já está cadastrada.');
      }
      // Se for outro tipo de erro, nós o relançamos para ser tratado genericamente.
      throw error;
    }
  }

  /**
   * Busca o único registro da empresa no banco de dados.
   * @returns A entidade Empresa.
   * @throws {NotFoundException} Se nenhuma empresa for encontrada.
   */
  async findOne(): Promise<Empresa> {
    const empresa = await this.empresaRepository.findOneBy({});
    if (!empresa) {
      throw new NotFoundException('Nenhuma empresa encontrada.');
    }
    return empresa;
  }

  /**
   * Atualiza os dados da empresa.
   * @param id O ID da empresa a ser atualizada.
   * @param updateEmpresaDto Os dados para atualizar.
   * @returns A entidade Empresa atualizada.
   * @throws {NotFoundException} Se a empresa com o ID fornecido não for encontrada.
   */
  async update(id: string, updateEmpresaDto: UpdateEmpresaDto): Promise<Empresa> {
    const empresa = await this.empresaRepository.preload({
      id: id,
      ...updateEmpresaDto,
    });
    if (!empresa) {
      throw new NotFoundException(`Empresa com ID "${id}" não encontrada.`);
    }

    return this.empresaRepository.save(empresa);
  }
}