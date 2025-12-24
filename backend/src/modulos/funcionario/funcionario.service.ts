// Caminho: backend/src/modulos/funcionario/funcionario.service.ts

import {
  Injectable,
  OnModuleInit,
  Logger,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { AlterarSenhaDto } from './dto/alterar-senha.dto';
import { Funcionario } from './entities/funcionario.entity';
import { Cargo } from './enums/cargo.enum';
import { GcsStorageService } from 'src/shared/storage/gcs-storage.service';
import { FuncionarioRepository } from './funcionario.repository';

@Injectable()
export class FuncionarioService implements OnModuleInit {
  private readonly logger = new Logger(FuncionarioService.name);

  constructor(
    private readonly funcionarioRepository: FuncionarioRepository,
    private readonly configService: ConfigService,
    private readonly storageService: GcsStorageService,
  ) {}

  async onModuleInit() {
    const contador = await this.funcionarioRepository.count();
    if (contador === 0) {
      this.logger.log(
        'Banco de dados de funcionários vazio. Criando usuário ADMIN padrão...',
      );
      
      // Buscar o primeiro tenant disponível para associar o admin
      const tenantResult = await this.funcionarioRepository.manager.query(
        'SELECT id FROM tenants LIMIT 1'
      );
      const tenantId = tenantResult[0]?.id;
      
      if (!tenantId) {
        this.logger.warn('⚠️ Nenhum tenant encontrado. Admin será criado sem tenant.');
      }
      
      const senhaPlana = this.configService.get<string>('ADMIN_SENHA');
      const senhaHash = await bcrypt.hash(senhaPlana, 10);
      const admin = this.funcionarioRepository.create({
        nome: 'Administrador Padrão',
        email: this.configService.get<string>('ADMIN_EMAIL'),
        senha: senhaHash,
        cargo: Cargo.ADMIN,
        tenantId: tenantId || null,
      });
      await this.funcionarioRepository.save(admin);
      this.logger.log(`✅ Usuário ADMIN padrão criado com sucesso! (tenant: ${tenantId || 'nenhum'})`);
    }
  }

  /**
   * Verifica se é o primeiro acesso (não há usuários no sistema)
   */
  async isFirstAccess(): Promise<boolean> {
    const count = await this.funcionarioRepository.count();
    return count === 0;
  }

  /**
   * Registro público - Primeiro usuário vira ADMIN automaticamente
   * Depois do primeiro, bloqueia e exige que seja criado por ADMIN
   */
  async registroPrimeiroAcesso(
    createFuncionarioDto: CreateFuncionarioDto,
  ): Promise<Funcionario> {
    // Verifica se já existe algum usuário
    const contador = await this.funcionarioRepository.count();

    if (contador > 0) {
      this.logger.warn(
        '❌ Tentativa de registro bloqueada - já existe usuário no sistema',
      );
      throw new ForbiddenException(
        'Já existe um usuário no sistema. Novos funcionários devem ser criados por um administrador.',
      );
    }

    // Primeiro usuário - força cargo ADMIN
    this.logger.log('🎉 Primeiro acesso! Criando usuário ADMIN...');
    const senhaHash = await bcrypt.hash(createFuncionarioDto.senha, 10);
    const primeiroUsuario = this.funcionarioRepository.create({
      ...createFuncionarioDto,
      senha: senhaHash,
      cargo: Cargo.ADMIN, // Força ADMIN independente do que foi enviado
    });

    try {
      const usuarioCriado =
        await this.funcionarioRepository.save(primeiroUsuario);
      this.logger.log(
        `✅ Primeiro usuário ADMIN criado: ${usuarioCriado.email}`,
      );
      return usuarioCriado;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Este e-mail já está cadastrado.');
      }
      throw error;
    }
  }

  async create(
    createFuncionarioDto: CreateFuncionarioDto,
  ): Promise<Funcionario> {
    const senhaHash = await bcrypt.hash(createFuncionarioDto.senha, 10);
    const novoFuncionario = this.funcionarioRepository.create({
      ...createFuncionarioDto,
      senha: senhaHash,
    });
    try {
      return await this.funcionarioRepository.save(novoFuncionario);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Este e-mail já está cadastrado.');
      }
      throw error;
    }
  }

  /**
   * Lista funcionários do tenant, excluindo SUPER_ADMIN
   * SUPER_ADMIN são usuários do sistema SaaS, não funcionários da empresa
   */
  async findAll(): Promise<Funcionario[]> {
    const funcionarios = await this.funcionarioRepository.find();
    // Filtra SUPER_ADMIN da listagem - eles não são funcionários do tenant
    return funcionarios.filter(f => f.cargo !== Cargo.SUPER_ADMIN);
  }

  findOne(id: string): Promise<Funcionario> {
    return this.funcionarioRepository.findOne({ where: { id } });
  }

  /**
   * Busca funcionário por email para autenticação
   * ⚠️ Este método NÃO usa filtro de tenant porque o login
   * acontece ANTES do tenant ser identificado.
   */
  findByEmail(email: string): Promise<Funcionario> {
    return this.funcionarioRepository.findByEmailForAuth(email);
  }

  async update(
    id: string,
    updateFuncionarioDto: UpdateFuncionarioDto,
  ): Promise<Funcionario> {
    // Se a senha foi enviada, faz o hash antes de salvar
    if (updateFuncionarioDto.senha) {
      updateFuncionarioDto.senha = await bcrypt.hash(
        updateFuncionarioDto.senha,
        10,
      );
      this.logger.log(`🔐 Senha do funcionário ${id} será atualizada (hash)`);
    }

    const funcionario = await this.funcionarioRepository.preload({
      id,
      ...updateFuncionarioDto,
    });
    if (!funcionario) {
      throw new NotFoundException(`Funcionário com ID "${id}" não encontrado.`);
    }
    try {
      return await this.funcionarioRepository.save(funcionario);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Este e-mail já está cadastrado.');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const funcionario = await this.findOne(id);
    if (!funcionario) {
      throw new NotFoundException(`Funcionário com ID "${id}" não encontrado.`);
    }
    await this.funcionarioRepository.remove(funcionario);
  }

  /**
   * Altera a senha do próprio funcionário logado
   */
  async alterarSenha(
    funcionarioId: string,
    alterarSenhaDto: AlterarSenhaDto,
  ): Promise<{ message: string }> {
    // Busca o funcionário com a senha (que normalmente não é retornada)
    const funcionario = await this.funcionarioRepository
      .createQueryBuilder('funcionario')
      .where('funcionario.id = :id', { id: funcionarioId })
      .addSelect('funcionario.senha')
      .getOne();

    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado.');
    }

    // Verifica se a senha atual está correta
    const senhaCorreta = await bcrypt.compare(
      alterarSenhaDto.senhaAtual,
      funcionario.senha,
    );

    if (!senhaCorreta) {
      throw new BadRequestException('Senha atual incorreta.');
    }

    // Gera hash da nova senha e salva
    const novaSenhaHash = await bcrypt.hash(alterarSenhaDto.novaSenha, 10);
    funcionario.senha = novaSenhaHash;
    await this.funcionarioRepository.save(funcionario);

    this.logger.log(`🔐 Funcionário ${funcionarioId} alterou sua senha`);
    return { message: 'Senha alterada com sucesso!' };
  }

  /**
   * Upload de foto do funcionário para Google Cloud Storage
   */
  async uploadFoto(
    funcionarioId: string,
    file: Express.Multer.File,
  ): Promise<Funcionario> {
    const funcionario = await this.findOne(funcionarioId);
    if (!funcionario) {
      throw new NotFoundException('Funcionário não encontrado.');
    }

    // Se já existir uma foto antiga, apaga do GCS
    if (funcionario.fotoUrl) {
      try {
        await this.storageService.deleteFile(funcionario.fotoUrl);
        this.logger.log(`🗑️ Foto antiga do funcionário ${funcionarioId} apagada do GCS.`);
      } catch (error) {
        this.logger.error(
          `Falha ao apagar foto antiga do GCS: ${funcionario.fotoUrl}`,
          error,
        );
      }
    }

    // Faz upload do novo arquivo para a pasta 'funcionarios'
    const novaUrl = await this.storageService.uploadFile(file, 'funcionarios');

    // Atualiza a URL no registro do funcionário
    funcionario.fotoUrl = novaUrl;
    this.logger.log(`📸 Foto do funcionário ${funcionarioId} atualizada: ${novaUrl}`);
    return this.funcionarioRepository.save(funcionario);
  }
}
