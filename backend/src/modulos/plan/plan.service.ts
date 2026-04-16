import { Injectable, Logger, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan, ALL_FEATURES } from './entities/plan.entity';
import { CreatePlanDto, UpdatePlanDto } from './dto/create-plan.dto';

@Injectable()
export class PlanService implements OnModuleInit {
  private readonly logger = new Logger(PlanService.name);

  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultPlans();
  }

  /**
   * Cria planos padrão se não existirem
   */
  private async seedDefaultPlans() {
    const count = await this.planRepository.count();
    if (count > 0) {
      this.logger.log('Planos já existem no banco');
      return;
    }

    const defaultPlans: Partial<Plan>[] = [
      {
        code: 'FREE',
        name: 'Free',
        description: 'Para começar',
        priceMonthly: 0,
        priceYearly: 0,
        features: ['pedidos', 'comandas', 'mesas', 'produtos', 'funcionarios'],
        limits: { maxMesas: 5, maxFuncionarios: 2, maxProdutos: 30, maxAmbientes: 1, maxEventos: 0, storageGB: 1 },
        isActive: true,
        isPopular: false,
        sortOrder: 0,
      },
      {
        code: 'BASIC',
        name: 'Basic',
        description: 'Para bares pequenos',
        priceMonthly: 99,
        priceYearly: 990,
        features: ['pedidos', 'comandas', 'mesas', 'produtos', 'funcionarios', 'clientes', 'avaliacoes', 'eventos', 'pontos_entrega', 'turnos'],
        limits: { maxMesas: 20, maxFuncionarios: 10, maxProdutos: 100, maxAmbientes: 3, maxEventos: 5, storageGB: 5 },
        isActive: true,
        isPopular: false,
        sortOrder: 1,
      },
      {
        code: 'PRO',
        name: 'Pro',
        description: 'Para bares médios',
        priceMonthly: 199,
        priceYearly: 1990,
        features: ['pedidos', 'comandas', 'mesas', 'produtos', 'funcionarios', 'clientes', 'avaliacoes', 'eventos', 'pontos_entrega', 'turnos', 'analytics', 'relatorios_avancados', 'medalhas', 'caixa_avancado'],
        limits: { maxMesas: -1, maxFuncionarios: -1, maxProdutos: -1, maxAmbientes: -1, maxEventos: 20, storageGB: 20 },
        isActive: true,
        isPopular: true,
        sortOrder: 2,
      },
      {
        code: 'ENTERPRISE',
        name: 'Enterprise',
        description: 'Para redes e franquias',
        priceMonthly: 499,
        priceYearly: 4990,
        features: ALL_FEATURES.map(f => f.key),
        limits: { maxMesas: -1, maxFuncionarios: -1, maxProdutos: -1, maxAmbientes: -1, maxEventos: -1, storageGB: 100 },
        isActive: true,
        isPopular: false,
        sortOrder: 3,
      },
    ];

    for (const planData of defaultPlans) {
      await this.planRepository
        .createQueryBuilder()
        .insert()
        .into(Plan)
        .values(planData)
        .orIgnore()
        .execute();
    }

    this.logger.log('✅ Planos padrão criados com sucesso');
  }

  /**
   * Lista todos os planos
   */
  async findAll(includeInactive = false): Promise<Plan[]> {
    const where = includeInactive ? {} : { isActive: true };
    return this.planRepository.find({
      where,
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Busca plano por ID
   */
  async findOne(id: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }
    return plan;
  }

  /**
   * Busca plano por código
   */
  async findByCode(code: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { code: code.toUpperCase() } });
    if (!plan) {
      throw new NotFoundException(`Plano ${code} não encontrado`);
    }
    return plan;
  }

  /**
   * Cria novo plano
   */
  async create(dto: CreatePlanDto): Promise<Plan> {
    const existing = await this.planRepository.findOne({ where: { code: dto.code.toUpperCase() } });
    if (existing) {
      throw new ConflictException(`Plano com código ${dto.code} já existe`);
    }

    const plan = this.planRepository.create({
      ...dto,
      code: dto.code.toUpperCase(),
    });

    const saved = await this.planRepository.save(plan);
    this.logger.log(`✅ Plano ${saved.name} criado`);
    return saved;
  }

  /**
   * Atualiza plano
   */
  async update(id: string, dto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);
    Object.assign(plan, dto);
    const saved = await this.planRepository.save(plan);
    this.logger.log(`✅ Plano ${saved.name} atualizado`);
    return saved;
  }

  /**
   * Remove plano (soft delete - desativa)
   */
  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    plan.isActive = false;
    await this.planRepository.save(plan);
    this.logger.log(`✅ Plano ${plan.name} desativado`);
  }

  /**
   * Retorna todas as features disponíveis
   */
  getAllFeatures() {
    return ALL_FEATURES;
  }

  /**
   * Retorna planos para exibição pública (landing page)
   */
  async getPublicPlans(): Promise<Partial<Plan>[]> {
    const plans = await this.findAll();
    return plans.map(p => ({
      code: p.code,
      name: p.name,
      description: p.description,
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      features: p.features,
      limits: p.limits,
      isPopular: p.isPopular,
    }));
  }
}
