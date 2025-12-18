import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../entities/tenant.entity';
import { Funcionario } from '../../../modulos/funcionario/entities/funcionario.entity';
import { Pedido } from '../../../modulos/pedido/entities/pedido.entity';
import { Comanda } from '../../../modulos/comanda/entities/comanda.entity';

/**
 * Métricas globais da plataforma
 */
export interface PlatformMetrics {
  totalTenants: number;
  tenantsByStatus: Record<TenantStatus, number>;
  tenantsByPlano: Record<string, number>;
  pedidosHoje: number;
  comandasAbertas: number;
  faturamentoHoje: number;
  mrr: number; // Monthly Recurring Revenue
}

/**
 * Resumo de um tenant para listagem
 */
export interface TenantSummary {
  id: string;
  nome: string;
  slug: string;
  status: TenantStatus;
  plano: string;
  createdAt: Date;
  pedidosHoje: number;
  comandasAbertas: number;
  funcionariosAtivos: number;
}

/**
 * SuperAdminService - Serviço para gestão da plataforma
 * 
 * Este serviço ignora o filtro de tenant e acessa dados de TODOS os bares.
 * Deve ser usado APENAS por usuários com cargo SUPER_ADMIN.
 */
@Injectable()
export class SuperAdminService {
  private readonly logger = new Logger(SuperAdminService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(Funcionario)
    private readonly funcionarioRepository: Repository<Funcionario>,
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    @InjectRepository(Comanda)
    private readonly comandaRepository: Repository<Comanda>,
  ) {}

  /**
   * Obtém métricas globais da plataforma
   */
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    this.logger.log('📊 Calculando métricas globais da plataforma');

    // Total de tenants
    const totalTenants = await this.tenantRepository.count();

    // Tenants por status
    const tenantsByStatus = {} as Record<TenantStatus, number>;
    for (const status of Object.values(TenantStatus)) {
      tenantsByStatus[status] = await this.tenantRepository.count({
        where: { status },
      });
    }

    // Tenants por plano
    const tenantsWithPlano = await this.tenantRepository
      .createQueryBuilder('tenant')
      .select('tenant.plano', 'plano')
      .addSelect('COUNT(*)', 'count')
      .groupBy('tenant.plano')
      .getRawMany();
    
    const tenantsByPlano: Record<string, number> = {};
    tenantsWithPlano.forEach(t => {
      tenantsByPlano[t.plano] = parseInt(t.count);
    });

    // Pedidos de hoje (todos os tenants)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const pedidosHoje = await this.pedidoRepository
      .createQueryBuilder('pedido')
      .where('pedido.data >= :hoje', { hoje })
      .getCount();

    // Comandas abertas (todos os tenants)
    const comandasAbertas = await this.comandaRepository.count({
      where: { status: 'ABERTA' as any },
    });

    // Faturamento de hoje (soma dos totais das comandas fechadas hoje)
    const faturamentoResult = await this.comandaRepository
      .createQueryBuilder('comanda')
      .select('SUM(comanda.total)', 'total')
      .where('comanda.status = :status', { status: 'FECHADA' })
      .andWhere('comanda.fechadoEm >= :hoje', { hoje })
      .getRawOne();
    
    const faturamentoHoje = parseFloat(faturamentoResult?.total || '0');

    // MRR estimado (tenants ativos * valor médio do plano)
    const planoValues: Record<string, number> = {
      FREE: 0,
      BASIC: 99,
      PRO: 199,
      ENTERPRISE: 499,
    };
    
    let mrr = 0;
    for (const [plano, count] of Object.entries(tenantsByPlano)) {
      mrr += (planoValues[plano] || 0) * count;
    }

    return {
      totalTenants,
      tenantsByStatus,
      tenantsByPlano,
      pedidosHoje,
      comandasAbertas,
      faturamentoHoje,
      mrr,
    };
  }

  /**
   * Lista todos os tenants com resumo
   */
  async listTenants(): Promise<TenantSummary[]> {
    this.logger.log('📋 Listando todos os tenants');

    const tenants = await this.tenantRepository.find({
      order: { createdAt: 'DESC' },
    });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const summaries: TenantSummary[] = [];

    for (const tenant of tenants) {
      // Pedidos de hoje deste tenant
      const pedidosHoje = await this.pedidoRepository
        .createQueryBuilder('pedido')
        .where('pedido.tenantId = :tenantId', { tenantId: tenant.id })
        .andWhere('pedido.data >= :hoje', { hoje })
        .getCount();

      // Comandas abertas deste tenant
      const comandasAbertas = await this.comandaRepository
        .createQueryBuilder('comanda')
        .where('comanda.tenantId = :tenantId', { tenantId: tenant.id })
        .andWhere('comanda.status = :status', { status: 'ABERTA' })
        .getCount();

      // Funcionários ativos deste tenant
      const funcionariosAtivos = await this.funcionarioRepository
        .createQueryBuilder('funcionario')
        .where('funcionario.tenantId = :tenantId', { tenantId: tenant.id })
        .andWhere('funcionario.status = :status', { status: 'ATIVO' })
        .getCount();

      summaries.push({
        id: tenant.id,
        nome: tenant.nome,
        slug: tenant.slug,
        status: tenant.status,
        plano: tenant.plano,
        createdAt: tenant.createdAt,
        pedidosHoje,
        comandasAbertas,
        funcionariosAtivos,
      });
    }

    return summaries;
  }

  /**
   * Obtém detalhes de um tenant específico
   */
  async getTenantDetails(tenantId: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant não encontrado');
    }

    // Estatísticas detalhadas
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [
      totalPedidos,
      pedidosHoje,
      totalComandas,
      comandasAbertas,
      totalFuncionarios,
      funcionariosAtivos,
    ] = await Promise.all([
      this.pedidoRepository.createQueryBuilder('p').where('p.tenantId = :tenantId', { tenantId }).getCount(),
      this.pedidoRepository.createQueryBuilder('p')
        .where('p.tenantId = :tenantId', { tenantId })
        .andWhere('p.data >= :hoje', { hoje })
        .getCount(),
      this.comandaRepository.createQueryBuilder('c').where('c.tenantId = :tenantId', { tenantId }).getCount(),
      this.comandaRepository.createQueryBuilder('c').where('c.tenantId = :tenantId', { tenantId }).andWhere('c.status = :status', { status: 'ABERTA' }).getCount(),
      this.funcionarioRepository.createQueryBuilder('f').where('f.tenantId = :tenantId', { tenantId }).getCount(),
      this.funcionarioRepository.createQueryBuilder('f').where('f.tenantId = :tenantId', { tenantId }).andWhere('f.status = :status', { status: 'ATIVO' }).getCount(),
    ]);

    return {
      ...tenant,
      stats: {
        totalPedidos,
        pedidosHoje,
        totalComandas,
        comandasAbertas,
        totalFuncionarios,
        funcionariosAtivos,
      },
    };
  }

  /**
   * Suspende um tenant (bloqueia acesso)
   */
  async suspendTenant(tenantId: string, motivo: string): Promise<Tenant> {
    this.logger.warn(`⚠️ Suspendendo tenant: ${tenantId} | Motivo: ${motivo}`);

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant não encontrado');
    }

    tenant.status = TenantStatus.SUSPENSO;
    (tenant.config as any) = {
      ...tenant.config,
      suspensionReason: motivo,
      suspendedAt: new Date().toISOString(),
    };

    await this.tenantRepository.save(tenant);

    this.logger.log(`🔒 Tenant ${tenant.slug} suspenso com sucesso`);

    return tenant;
  }

  /**
   * Reativa um tenant suspenso
   */
  async reactivateTenant(tenantId: string): Promise<Tenant> {
    this.logger.log(`✅ Reativando tenant: ${tenantId}`);

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant não encontrado');
    }

    tenant.status = TenantStatus.ATIVO;
    if (tenant.config) {
      delete (tenant.config as any).suspensionReason;
      delete (tenant.config as any).suspendedAt;
    }

    await this.tenantRepository.save(tenant);

    this.logger.log(`🔓 Tenant ${tenant.slug} reativado com sucesso`);

    return tenant;
  }

  /**
   * Altera o plano de um tenant
   */
  async changeTenantPlan(tenantId: string, novoPlano: string): Promise<Tenant> {
    this.logger.log(`📦 Alterando plano do tenant ${tenantId} para ${novoPlano}`);

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant não encontrado');
    }

    tenant.plano = novoPlano as any;
    await this.tenantRepository.save(tenant);

    return tenant;
  }
}
