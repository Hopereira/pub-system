import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { Funcionario } from './entities/funcionario.entity';

// Criamos um tipo para representar o funcionário sem a senha, para ser mais fácil de usar
export type FuncionarioSemSenha = Omit<Funcionario, 'senha' | 'hashPassword'>;

@Injectable()
export class FuncionarioService {
  constructor(
    @InjectRepository(Funcionario)
    private readonly funcionarioRepository: Repository<Funcionario>,
  ) {}

  // Função auxiliar para remover a senha do objeto
  private toResponseObject(funcionario: Funcionario): FuncionarioSemSenha {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { senha, hashPassword, ...result } = funcionario;
    return result;
  }

  async create(createFuncionarioDto: CreateFuncionarioDto): Promise<FuncionarioSemSenha> {
    const funcionario = this.funcionarioRepository.create(createFuncionarioDto);
    const savedFuncionario = await this.funcionarioRepository.save(funcionario);
    return this.toResponseObject(savedFuncionario);
  }

  async findAll(): Promise<FuncionarioSemSenha[]> {
    const funcionarios = await this.funcionarioRepository.find();
    return funcionarios.map(f => this.toResponseObject(f));
  }

  async findOne(id: string): Promise<FuncionarioSemSenha> {
    const funcionario = await this.funcionarioRepository.findOne({ where: { id } });

    if (!funcionario) {
      throw new NotFoundException(`Funcionário com ID "${id}" não encontrado.`);
    }
    return this.toResponseObject(funcionario);
  }

  // Este método continua o mesmo, pois precisa da senha para a validação do login
  async findByEmail(email: string): Promise<Funcionario | undefined> {
    return this.funcionarioRepository.findOne({ where: { email } });
  }

  async update(id: string, updateFuncionarioDto: UpdateFuncionarioDto): Promise<FuncionarioSemSenha> {
    if (updateFuncionarioDto.senha) {
      updateFuncionarioDto.senha = await bcrypt.hash(updateFuncionarioDto.senha, 10);
    }

    const funcionario = await this.funcionarioRepository.preload({
      id,
      ...updateFuncionarioDto,
    });

    if (!funcionario) {
      throw new NotFoundException(`Funcionário com ID "${id}" não encontrado.`);
    }

    const updatedFuncionario = await this.funcionarioRepository.save(funcionario);
    return this.toResponseObject(updatedFuncionario);
  }

  async remove(id: string): Promise<void> {
    // CORREÇÃO: Buscamos o funcionário COMPLETO antes de remover.
    const funcionario = await this.funcionarioRepository.findOne({ where: { id } });
    if (!funcionario) {
      throw new NotFoundException(`Funcionário com ID "${id}" não encontrado.`);
    }
    await this.funcionarioRepository.remove(funcionario);
  }
}