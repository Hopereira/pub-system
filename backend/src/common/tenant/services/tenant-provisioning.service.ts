import { Injectable, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant, TenantStatus, TenantPlano } from '../entities/tenant.entity';
import { Empresa } from '../../../modulos/empresa/entities/empresa.entity';
import { Ambiente } from '../../../modulos/ambiente/entities/ambiente.entity';
import { Mesa, MesaStatus } from '../../../modulos/mesa/entities/mesa.entity';
import { Funcionario } from '../../../modulos/funcionario/entities/funcionario.entity';
import * as bcrypt from 'bcrypt';
import { PlanFeaturesService } from './plan-features.service';

/**
 * DTO para criação de novo tenant
 */
export interface CreateTenantDto {
  nome: string;
  slug: string;
  cnpj?: string;
  plano?: TenantPlano;
  
  // Dados da empresa
  nomeFantasia: string;
  razaoSocial?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  
  // Dados do admin inicial
  adminNome: string;
  adminEmail: string;
  adminSenha: string;
}

/**
 * Resultado do provisionamento
 */
export interface ProvisioningResult {
  tenant: Tenant;
  empresa: Empresa;
  ambientes: Ambiente[];
  mesas: Mesa[];
  admin: Funcionario;
  credenciais: {
    email: string;
    senhaTemporaria: string;
  };
}

/**
 * TenantProvisioningService - Automação de Criação de Novos Bares
 * 
 * Cria toda a infraestrutura necessária para um novo cliente em uma
 * única transação ACID, garantindo atomicidade.
 * 
 * O que é criado:
 * 1. Registro na tabela tenants
 * 2. Empresa vinculada ao tenant
 * 3. Ambientes padrão (respeitando o limite maxAmbientes do plano)
 * 4. Mesas iniciais no Salão (respeitando o limite maxMesas do plano)
 * 5. Usuário ADMIN inicial
 */
@Injectable()
export class TenantProvisioningService {
  private readonly logger = new Logger(TenantProvisioningService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(Ambiente)
    private readonly ambienteRepository: Repository<Ambiente>,
    @InjectRepository(Mesa)
    private readonly mesaRepository: Repository<Mesa>,
    @InjectRepository(Funcionario)
    private readonly funcionarioRepository: Repository<Funcionario>,
    private readonly dataSource: DataSource,
    private readonly planFeaturesService: PlanFeaturesService,
  ) {}

  /**
   * Provisiona um novo tenant com toda a infraestrutura necessária
   * Executa em uma transação ACID - se algo falhar, nada é criado
   */
  async provisionTenant(dto: CreateTenantDto): Promise<ProvisioningResult> {
    this.logger.log(`🏗️ Iniciando provisionamento do tenant: ${dto.nome} (${dto.slug})`);

    // Validar slug
    this.validateSlug(dto.slug);

    // Verificar se slug já existe
    const existingTenant = await this.tenantRepository.findOne({
      where: { slug: dto.slug },
    });
    if (existingTenant) {
      throw new ConflictException(`Slug "${dto.slug}" já está em uso`);
    }

    // Verificar se já existe tenant ATIVO/TRIAL com o mesmo CNPJ
    if (dto.cnpj) {
      const existingCnpj = await this.tenantRepository.findOne({
        where: [
          { cnpj: dto.cnpj, status: TenantStatus.ATIVO },
          { cnpj: dto.cnpj, status: TenantStatus.TRIAL },
          { cnpj: dto.cnpj, status: TenantStatus.SUSPENSO },
        ],
      });
      if (existingCnpj) {
        throw new ConflictException(
          `Já existe um estabelecimento ativo com o CNPJ "${dto.cnpj}". Se você encerrou a conta anterior, entre em contato com o suporte.`,
        );
      }
    }

    // Verificar se email do admin já existe
    const existingAdmin = await this.funcionarioRepository.findOne({
      where: { email: dto.adminEmail },
    });
    if (existingAdmin) {
      throw new ConflictException(`Email "${dto.adminEmail}" já está cadastrado`);
    }

    // Executar em transação
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Criar Tenant (sem config hardcoded — limites vêm da tabela `plans`)
      const plano = dto.plano || TenantPlano.FREE;
      const tenant = queryRunner.manager.create(Tenant, {
        nome: dto.nome,
        slug: dto.slug,
        cnpj: dto.cnpj,
        status: TenantStatus.TRIAL,
        plano,
        config: {},
      });
      await queryRunner.manager.save(tenant);
      this.logger.log(`✅ Tenant criado: ${tenant.id} (plano: ${plano})`);

      // Buscar limites do plano (banco, com fallback para PLAN_LIMITS hardcoded)
      const planLimits = await this.planFeaturesService.getLimitsFromDb(plano);
      const allowedAmbientes =
        planLimits.maxAmbientes === -1 ? Infinity : planLimits.maxAmbientes;
      const allowedMesas =
        planLimits.maxMesas === -1 ? Infinity : planLimits.maxMesas;
      this.logger.log(
        `📊 Limites do plano ${plano}: ambientes=${planLimits.maxAmbientes}, mesas=${planLimits.maxMesas}`,
      );

      // 2. Criar Empresa
      const empresa = queryRunner.manager.create(Empresa, {
        nomeFantasia: dto.nomeFantasia,
        razaoSocial: dto.razaoSocial || dto.nomeFantasia,
        cnpj: dto.cnpj,
        telefone: dto.telefone,
        email: dto.email,
        endereco: dto.endereco,
        slug: dto.slug,
        ativo: true,
        tenantId: tenant.id,
      });
      await queryRunner.manager.save(empresa);
      this.logger.log(`✅ Empresa criada: ${empresa.id}`);

      // 3. Criar Ambientes Padrão (respeitando limite do plano)
      // Salão é prioritário porque é onde as mesas ficam.
      const ambientesConfig = [
        { nome: 'Salão', descricao: 'Área principal de atendimento', cor: '#4ECDC4' },
        { nome: 'Cozinha', descricao: 'Área de preparo de alimentos', cor: '#FF6B6B' },
        { nome: 'Bar', descricao: 'Área de bebidas', cor: '#45B7D1' },
      ].slice(0, allowedAmbientes);

      const ambientes: Ambiente[] = [];
      for (const config of ambientesConfig) {
        const ambiente = queryRunner.manager.create(Ambiente, {
          nome: config.nome,
          descricao: config.descricao,
          cor: config.cor,
          tenantId: tenant.id,
        });
        await queryRunner.manager.save(ambiente);
        ambientes.push(ambiente);
      }
      this.logger.log(
        `✅ ${ambientes.length} ambiente(s) criado(s) (limite do plano: ${planLimits.maxAmbientes})`,
      );

      // 4. Criar Mesas Iniciais no Salão (respeitando limite do plano)
      const salao = ambientes.find((a) => a.nome === 'Salão');
      const mesas: Mesa[] = [];

      if (salao) {
        // Default sugerido = 10, mas limitado ao máximo do plano
        const mesasACriar = Math.min(10, allowedMesas);
        for (let i = 1; i <= mesasACriar; i++) {
          const mesa = queryRunner.manager.create(Mesa, {
            numero: i,
            status: MesaStatus.LIVRE,
            ambiente: salao,
            tenantId: tenant.id,
          } as any);
          await queryRunner.manager.save(mesa);
          mesas.push(mesa);
        }
      }
      this.logger.log(
        `✅ ${mesas.length} mesa(s) criada(s) (limite do plano: ${planLimits.maxMesas})`,
      );

      // 5. Criar Usuário ADMIN
      const senhaHash = await bcrypt.hash(dto.adminSenha, 10);
      const admin = queryRunner.manager.create(Funcionario, {
        nome: dto.adminNome,
        email: dto.adminEmail,
        senha: senhaHash,
        cargo: 'ADMIN',
        status: 'ATIVO',
        empresa: empresa,
        tenantId: tenant.id,
      } as any);
      await queryRunner.manager.save(admin);
      this.logger.log(`✅ Admin criado: ${admin.email}`);

      // Commit da transação
      await queryRunner.commitTransaction();
      this.logger.log(`🎉 Provisionamento concluído com sucesso para: ${dto.slug}`);

      return {
        tenant,
        empresa,
        ambientes,
        mesas,
        admin,
        credenciais: {
          email: dto.adminEmail,
          senhaTemporaria: dto.adminSenha,
        },
      };
    } catch (error) {
      // Rollback em caso de erro
      await queryRunner.rollbackTransaction();
      this.logger.error(`❌ Erro no provisionamento: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Valida o formato do slug
   * - Apenas letras minúsculas, números e hífens
   * - Deve começar com letra
   * - Mínimo 3, máximo 50 caracteres
   */
  private validateSlug(slug: string): void {
    const slugRegex = /^[a-z][a-z0-9-]{2,49}$/;
    
    if (!slugRegex.test(slug)) {
      throw new BadRequestException(
        'Slug inválido. Use apenas letras minúsculas, números e hífens. ' +
        'Deve começar com letra e ter entre 3 e 50 caracteres. ' +
        'Exemplo: bar-do-ze, restaurante-bom-sabor'
      );
    }

    // Palavras reservadas
    const reserved = ['admin', 'api', 'www', 'app', 'dashboard', 'login', 'super-admin'];
    if (reserved.includes(slug)) {
      throw new BadRequestException(`Slug "${slug}" é reservado e não pode ser usado`);
    }
  }

  /**
   * Gera um slug a partir do nome
   */
  generateSlug(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Espaços viram hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, '') // Remove hífens no início/fim
      .substring(0, 50);
  }

  /**
   * Verifica se um slug está disponível
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    const existing = await this.tenantRepository.findOne({
      where: { slug },
    });
    return !existing;
  }

  /**
   * Sugere slugs alternativos se o desejado não estiver disponível
   */
  async suggestSlugs(baseSlug: string): Promise<string[]> {
    const suggestions: string[] = [];
    
    for (let i = 1; i <= 5; i++) {
      const suggestion = `${baseSlug}-${i}`;
      if (await this.isSlugAvailable(suggestion)) {
        suggestions.push(suggestion);
      }
    }

    // Adiciona sugestão com cidade/região
    const withCity = `${baseSlug}-sp`;
    if (await this.isSlugAvailable(withCity)) {
      suggestions.push(withCity);
    }

    return suggestions;
  }
}
