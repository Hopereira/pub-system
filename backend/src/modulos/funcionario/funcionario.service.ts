import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { Funcionario } from './entities/funcionario.entity';
import { Cargo } from './enums/cargo.enum';

@Injectable()
export class FuncionarioService implements OnModuleInit {
  constructor(
    @InjectRepository(Funcionario)
    private readonly funcionarioRepository: Repository<Funcionario>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const contador = await this.funcionarioRepository.count();

    if (contador === 0) {
      console.log('Banco de dados de funcionários vazio. Criando usuário ADMIN padrão...');

      const senhaPlana = this.configService.get<string>('ADMIN_SENHA');
      const senhaHash = await bcrypt.hash(senhaPlana, 10);

      const admin = this.funcionarioRepository.create({
        nome: 'Administrador Padrão',
        email: this.configService.get<string>('ADMIN_EMAIL'),
        senha: senhaHash,
        cargo: Cargo.ADMIN,
      });

      await this.funcionarioRepository.save(admin);
      console.log('Usuário ADMIN padrão criado com sucesso!');
    }
  }

  async create(createFuncionarioDto: CreateFuncionarioDto): Promise<Funcionario> {
    const senhaHash = await bcrypt.hash(createFuncionarioDto.senha, 10);
    const novoFuncionario = this.funcionarioRepository.create({
      ...createFuncionarioDto,
      senha: senhaHash,
    });
    return this.funcionarioRepository.save(novoFuncionario);
  }

  findAll(): Promise<Funcionario[]> {
    return this.funcionarioRepository.find();
  }

  findOne(id: string): Promise<Funcionario> {
    return this.funcionarioRepository.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<Funcionario> {
    return this.funcionarioRepository.findOne({ where: { email } });
  }

  async update(id: string, updateFuncionarioDto: UpdateFuncionarioDto): Promise<Funcionario> {
    const funcionario = await this.funcionarioRepository.preload({
      id,
      ...updateFuncionarioDto,
    });
    return this.funcionarioRepository.save(funcionario);
  }

  async remove(id: string): Promise<void> {
    const funcionario = await this.findOne(id);
    await this.funcionarioRepository.remove(funcionario);
  }
}