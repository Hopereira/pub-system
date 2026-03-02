import {
  Controller,
  Post,
  Body,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Funcionario } from '../modulos/funcionario/entities/funcionario.entity';
import { Cargo } from '../modulos/funcionario/enums/cargo.enum';
import { FuncionarioStatus } from '../modulos/funcionario/enums/funcionario-status.enum';
import * as bcrypt from 'bcrypt';

/**
 * Controller para criar Super Admin — protegido por env vars.
 *
 * Só funciona quando:
 *   ENABLE_SETUP=true  (habilita o endpoint)
 *   SETUP_TOKEN=<token> (token obrigatório no body para autorizar)
 *
 * Em produção, ENABLE_SETUP deve ser false ou ausente.
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
    @Body()
    body: { email: string; senha: string; nome: string; setup_token?: string },
  ) {
    // Bloqueia se ENABLE_SETUP não for explicitamente 'true'
    if (process.env.ENABLE_SETUP !== 'true') {
      this.logger.warn(
        `🚫 Tentativa de acesso a /setup/super-admin com ENABLE_SETUP desabilitado`,
      );
      throw new NotFoundException();
    }

    // Valida setup token se configurado
    const expectedToken = process.env.SETUP_TOKEN;
    if (expectedToken && body.setup_token !== expectedToken) {
      this.logger.warn(`🚫 Setup token inválido em /setup/super-admin`);
      throw new ForbiddenException('Setup token inválido');
    }

    const { email, senha, nome } = body;

    // Verificar se já existe
    const existing = await this.funcionarioRepository.findOne({
      where: { email },
    });

    if (existing) {
      // Atualizar para SUPER_ADMIN
      existing.cargo = Cargo.SUPER_ADMIN;
      existing.senha = await bcrypt.hash(senha, 10);
      existing.tenantId = null as any; // SUPER_ADMIN não pertence a nenhum tenant
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
