import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
  pedidos24h: number;
  comandasAbertas: number;
  faturamentoHoje: number;
  mrr: number; // Monthly Recurring Revenue
  novosTrials7dias: number;
  tenantsAtrasados: number;
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
  trialExpiresAt?: Date;
  pedidosHoje: number;
  pedidos24h: number;
  comandasAbertas: number;
  funcionariosAtivos: number;
  pagamentoEmDia: boolean;
  gatewaysAtivos: string[];
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
    private readonly dataSource: DataSource,
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

    // Pedidos últimas 24h
    const ontem = new Date();
    ontem.setHours(ontem.getHours() - 24);
    
    const pedidos24h = await this.pedidoRepository
      .createQueryBuilder('pedido')
      .where('pedido.data >= :ontem', { ontem })
      .getCount();

    // Comandas abertas (todos os tenants)
    const comandasAbertas = await this.comandaRepository.count({
      where: { status: 'ABERTA' as any },
    });

    // Faturamento de hoje - por enquanto retorna 0 (precisa calcular via pedidos)
    // TODO: Implementar cálculo real via soma dos pedidos das comandas fechadas
    const faturamentoHoje = 0;

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

    // Novos trials nos últimos 7 dias
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    
    const novosTrials7dias = await this.tenantRepository
      .createQueryBuilder('tenant')
      .where('tenant.status = :status', { status: TenantStatus.TRIAL })
      .andWhere('tenant.createdAt >= :seteDiasAtras', { seteDiasAtras })
      .getCount();

    // Tenants com pagamento atrasado (simulado - verificar config)
    const tenantsAtrasados = 0; // TODO: Implementar verificação real de pagamento

    return {
      totalTenants,
      tenantsByStatus,
      tenantsByPlano,
      pedidosHoje,
      pedidos24h,
      comandasAbertas,
      faturamentoHoje,
      mrr,
      novosTrials7dias,
      tenantsAtrasados,
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

    // Pedidos últimas 24h
    const ontem = new Date();
    ontem.setHours(ontem.getHours() - 24);

    for (const tenant of tenants) {
      // Pedidos de hoje deste tenant
      const pedidosHoje = await this.pedidoRepository
        .createQueryBuilder('pedido')
        .where('pedido.tenant_id = :tenantId', { tenantId: tenant.id })
        .andWhere('pedido.data >= :hoje', { hoje })
        .getCount();

      // Pedidos últimas 24h deste tenant
      const pedidos24h = await this.pedidoRepository
        .createQueryBuilder('pedido')
        .where('pedido.tenant_id = :tenantId', { tenantId: tenant.id })
        .andWhere('pedido.data >= :ontem', { ontem })
        .getCount();

      // Comandas abertas deste tenant
      const comandasAbertas = await this.comandaRepository
        .createQueryBuilder('comanda')
        .where('comanda.tenant_id = :tenantId', { tenantId: tenant.id })
        .andWhere('comanda.status = :status', { status: 'ABERTA' })
        .getCount();

      // Funcionários ativos deste tenant
      const funcionariosAtivos = await this.funcionarioRepository
        .createQueryBuilder('funcionario')
        .where('(funcionario.tenantId = :tenantId OR funcionario.empresaId = :tenantId)', { tenantId: tenant.id })
        .andWhere('funcionario.status = :status', { status: 'ATIVO' })
        .getCount();

      // Verificar gateways ativos (do config do tenant)
      const gatewaysAtivos: string[] = [];
      if (tenant.config?.paymentGateways) {
        const gateways = tenant.config.paymentGateways as any;
        if (gateways.picpay?.enabled) gatewaysAtivos.push('PicPay');
        if (gateways.mercadopago?.enabled) gatewaysAtivos.push('MercadoPago');
        if (gateways.stripe?.enabled) gatewaysAtivos.push('Stripe');
      }

      // Trial expira em 14 dias após criação (se status TRIAL)
      let trialExpiresAt: Date | undefined;
      if (tenant.status === TenantStatus.TRIAL) {
        trialExpiresAt = new Date(tenant.createdAt);
        trialExpiresAt.setDate(trialExpiresAt.getDate() + 14);
      }

      summaries.push({
        id: tenant.id,
        nome: tenant.nome,
        slug: tenant.slug,
        status: tenant.status,
        plano: tenant.plano,
        createdAt: tenant.createdAt,
        trialExpiresAt,
        pedidosHoje,
        pedidos24h,
        comandasAbertas,
        funcionariosAtivos,
        pagamentoEmDia: true, // TODO: Verificar status real de pagamento
        gatewaysAtivos,
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

    // Buscar admin do tenant
    // Tenta por tenantId primeiro
    let admin = await this.funcionarioRepository.findOne({
      where: { tenantId: tenantId, cargo: 'ADMIN' as any },
      select: ['id', 'nome', 'email', 'telefone'],
    });
    
    // Fallback: buscar por empresaId = tenantId
    if (!admin) {
      admin = await this.funcionarioRepository.findOne({
        where: { empresaId: tenantId, cargo: 'ADMIN' as any },
        select: ['id', 'nome', 'email', 'telefone'],
      });
    }
    
    // Fallback 2: buscar funcionário ADMIN que pertence a uma empresa com mesmo slug do tenant
    if (!admin) {
      admin = await this.funcionarioRepository
        .createQueryBuilder('f')
        .innerJoin('f.empresa', 'e')
        .where('e.slug = :slug', { slug: tenant.slug })
        .andWhere('f.cargo = :cargo', { cargo: 'ADMIN' })
        .select(['f.id', 'f.nome', 'f.email', 'f.telefone'])
        .getOne();
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
      this.pedidoRepository.createQueryBuilder('p').where('p.tenant_id = :tenantId', { tenantId }).getCount(),
      this.pedidoRepository.createQueryBuilder('p')
        .where('p.tenant_id = :tenantId', { tenantId })
        .andWhere('p.data >= :hoje', { hoje })
        .getCount(),
      this.comandaRepository.createQueryBuilder('c').where('c.tenant_id = :tenantId', { tenantId }).getCount(),
      this.comandaRepository.createQueryBuilder('c').where('c.tenant_id = :tenantId', { tenantId }).andWhere('c.status = :status', { status: 'ABERTA' }).getCount(),
      this.funcionarioRepository.createQueryBuilder('f').where('f.tenantId = :tenantId OR f.empresaId = :tenantId', { tenantId }).getCount(),
      this.funcionarioRepository.createQueryBuilder('f').where('(f.tenantId = :tenantId OR f.empresaId = :tenantId)', { tenantId }).andWhere('f.status = :status', { status: 'ATIVO' }).getCount(),
    ]);

    return {
      ...tenant,
      admin: admin ? {
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
        telefone: admin.telefone,
      } : null,
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

  /**
   * Atualiza dados de um tenant
   */
  async updateTenant(tenantId: string, data: { nome?: string; cnpj?: string; config?: any }): Promise<Tenant> {
    this.logger.log(`✏️ Atualizando tenant ${tenantId}`);

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    if (data.nome) tenant.nome = data.nome;
    if (data.cnpj) tenant.cnpj = data.cnpj;
    if (data.config) {
      tenant.config = { ...tenant.config, ...data.config };
    }

    await this.tenantRepository.save(tenant);
    this.logger.log(`✅ Tenant ${tenant.slug} atualizado`);

    return tenant;
  }

  /**
   * Reseta a senha do admin de um tenant
   */
  async resetAdminPassword(tenantId: string, novaSenha: string): Promise<{ success: boolean; email: string }> {
    this.logger.log(`🔑 Resetando senha do admin do tenant ${tenantId}`);

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    // Buscar o admin do tenant (funcionário com cargo ADMIN)
    // Tenta primeiro por tenantId
    let admin = await this.funcionarioRepository.findOne({
      where: { 
        tenantId: tenantId,
        cargo: 'ADMIN' as any,
      },
    });

    // Fallback: buscar por empresaId
    if (!admin) {
      admin = await this.funcionarioRepository.findOne({
        where: { 
          empresaId: tenantId,
          cargo: 'ADMIN' as any,
        },
      });
    }

    // Fallback 2: buscar via slug da empresa
    if (!admin) {
      admin = await this.funcionarioRepository
        .createQueryBuilder('f')
        .innerJoin('f.empresa', 'e')
        .where('e.slug = :slug', { slug: tenant.slug })
        .andWhere('f.cargo = :cargo', { cargo: 'ADMIN' })
        .getOne();
    }

    if (!admin) {
      throw new NotFoundException('Admin do tenant não encontrado. Verifique se existe um funcionário com cargo ADMIN vinculado a este tenant.');
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(novaSenha, 10);
    admin.senha = hashedPassword;

    await this.funcionarioRepository.save(admin);
    this.logger.log(`✅ Senha do admin ${admin.email} resetada`);

    return { success: true, email: admin.email };
  }

  /**
   * Lista funcionários de um tenant
   */
  async listTenantFuncionarios(tenantId: string) {
    this.logger.log(`👥 Listando funcionários do tenant ${tenantId}`);

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    // Busca por tenantId primeiro
    let funcionarios = await this.funcionarioRepository.find({
      where: { tenantId: tenantId },
      select: ['id', 'nome', 'email', 'cargo', 'status'],
      order: { cargo: 'ASC', nome: 'ASC' },
    });

    // Fallback: buscar por empresaId se não encontrou por tenantId
    if (funcionarios.length === 0) {
      funcionarios = await this.funcionarioRepository.find({
        where: { empresaId: tenantId },
        select: ['id', 'nome', 'email', 'cargo', 'status'],
        order: { cargo: 'ASC', nome: 'ASC' },
      });
    }

    // Fallback 2: buscar via slug da empresa
    if (funcionarios.length === 0 && tenant) {
      funcionarios = await this.funcionarioRepository
        .createQueryBuilder('f')
        .innerJoin('f.empresa', 'e')
        .where('e.slug = :slug', { slug: tenant.slug })
        .select(['f.id', 'f.nome', 'f.email', 'f.cargo', 'f.status'])
        .orderBy('f.cargo', 'ASC')
        .addOrderBy('f.nome', 'ASC')
        .getMany();
    }

    return funcionarios;
  }

  /**
   * Deleta um tenant (soft delete - muda status para INATIVO)
   */
  async deleteTenant(tenantId: string): Promise<{ success: boolean; message: string }> {
    this.logger.warn(`⚠️ Deletando tenant ${tenantId}`);

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    tenant.status = TenantStatus.INATIVO;
    (tenant.config as any) = {
      ...tenant.config,
      deletedAt: new Date().toISOString(),
    };

    await this.tenantRepository.save(tenant);
    this.logger.log(`🗑️ Tenant ${tenant.slug} marcado como INATIVO`);

    return { success: true, message: `Tenant ${tenant.nome} deletado com sucesso` };
  }

  /**
   * Hard delete - Remove completamente um tenant e todos os dados relacionados
   * CUIDADO: Esta ação é irreversível!
   */
  async hardDeleteTenant(tenantId: string): Promise<{ success: boolean; message: string; deletedData: any }> {
    this.logger.warn(`🔴 HARD DELETE do tenant ${tenantId} - IRREVERSÍVEL!`);

    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    const deletedData = {
      tenant: tenant.slug,
      funcionarios: 0,
      comandas: 0,
      pedidos: 0,
      mesas: 0,
      ambientes: 0,
      produtos: 0,
      empresa: false,
    };

    // Helper para executar query com tratamento de erro
    const safeQuery = async (query: string, params: any[], errorContext: string) => {
      try {
        return await this.dataSource.query(query, params);
      } catch (error) {
        // Se a tabela não existir, apenas log warning e continua
        if (error.message?.includes('does not exist')) {
          this.logger.warn(`⚠️ ${errorContext}: ${error.message}`);
          return [[], 0];
        }
        throw error;
      }
    };

    // Deletar em ordem para respeitar foreign keys
    // 1. Itens de pedido
    await safeQuery(`
      DELETE FROM item_pedido 
      WHERE pedido_id IN (SELECT id FROM pedidos WHERE tenant_id = $1)
    `, [tenantId], 'Deletar itens de pedido');

    // 2. Pedidos
    try {
      const pedidosResult = await this.pedidoRepository.delete({ tenantId });
      deletedData.pedidos = pedidosResult.affected || 0;
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao deletar pedidos: ${error.message}`);
    }

    // 3. Comandas
    try {
      const comandasResult = await this.comandaRepository.delete({ tenantId });
      deletedData.comandas = comandasResult.affected || 0;
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao deletar comandas: ${error.message}`);
    }

    // 4. Mesas (via ambiente)
    await safeQuery(`
      DELETE FROM mesas 
      WHERE ambiente_id IN (SELECT id FROM ambientes WHERE tenant_id = $1)
    `, [tenantId], 'Deletar mesas');

    // 5. Produtos (via ambiente)
    await safeQuery(`
      DELETE FROM produtos 
      WHERE ambiente_id IN (SELECT id FROM ambientes WHERE tenant_id = $1)
    `, [tenantId], 'Deletar produtos');

    // 6. Ambientes
    const ambientesResult = await safeQuery(`
      DELETE FROM ambientes WHERE tenant_id = $1
    `, [tenantId], 'Deletar ambientes');
    deletedData.ambientes = ambientesResult[1] || 0;

    // 7. Funcionários (por tenantId ou empresaId ou via empresa.slug)
    const funcionariosResult = await safeQuery(`
      DELETE FROM funcionarios 
      WHERE tenant_id = $1 
         OR empresa_id = $1 
         OR empresa_id IN (SELECT id FROM empresas WHERE slug = $2)
    `, [tenantId, tenant.slug], 'Deletar funcionários');
    deletedData.funcionarios = funcionariosResult[1] || 0;

    // 8. Empresa
    const empresaResult = await safeQuery(`
      DELETE FROM empresas WHERE slug = $1
    `, [tenant.slug], 'Deletar empresa');
    deletedData.empresa = (empresaResult[1] || 0) > 0;

    // 9. Tenant
    await this.tenantRepository.delete({ id: tenantId });

    this.logger.log(`🗑️ HARD DELETE concluído para ${tenant.slug}`);
    this.logger.log(`   Dados removidos: ${JSON.stringify(deletedData)}`);

    return { 
      success: true, 
      message: `Tenant ${tenant.nome} (${tenant.slug}) removido permanentemente`,
      deletedData,
    };
  }
}
