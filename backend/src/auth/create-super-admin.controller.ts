import { Controller, Post, Body, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Funcionario } from '../modulos/funcionario/entities/funcionario.entity';
import { Cargo } from '../modulos/funcionario/enums/cargo.enum';
import { FuncionarioStatus } from '../modulos/funcionario/enums/funcionario-status.enum';
import * as bcrypt from 'bcrypt';

/**
 * Controller temporário para criar Super Admin
 * REMOVER EM PRODUÇÃO
 */
@Controller('setup')
export class CreateSuperAdminController {
  private readonly logger = new Logger(CreateSuperAdminController.name);

  constructor(
    @InjectRepository(Funcionario)
    private readonly funcionarioRepository: Repository<Funcionario>,
  ) {}

  @Post('super-admin')
  async createSuperAdmin(
    @Body() body: { email: string; senha: string; nome: string },
  ) {
    const { email, senha, nome } = body;

    // Verificar se já existe
    const existing = await this.funcionarioRepository.findOne({
      where: { email },
    });

    if (existing) {
      // Atualizar para SUPER_ADMIN
      existing.cargo = Cargo.SUPER_ADMIN;
      existing.senha = await bcrypt.hash(senha, 10);
      existing.empresaId = null;
      await this.funcionarioRepository.save(existing);
      this.logger.log(`✅ Super Admin atualizado: ${email}`);
      return { message: 'Super Admin atualizado', email };
    }

    // Criar novo
    const hash = await bcrypt.hash(senha, 10);
    const superAdmin = this.funcionarioRepository.create({
      nome: nome || 'Super Admin',
      email,
      senha: hash,
      cargo: Cargo.SUPER_ADMIN,
      status: FuncionarioStatus.ATIVO,
    });

    await this.funcionarioRepository.save(superAdmin);
    this.logger.log(`✅ Super Admin criado: ${email}`);
    return { message: 'Super Admin criado', email };
  }
}
