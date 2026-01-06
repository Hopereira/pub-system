import api from './api';

/**
 * Tipos para o Super Admin
 */
export interface PlatformMetrics {
  totalTenants: number;
  tenantsByStatus: Record<string, number>;
  tenantsByPlano: Record<string, number>;
  pedidosHoje: number;
  pedidos24h: number;
  comandasAbertas: number;
  faturamentoHoje: number;
  mrr: number;
  novosTrials7dias: number;
  tenantsAtrasados: number;
}

export interface TenantSummary {
  id: string;
  nome: string;
  slug: string;
  status: 'ATIVO' | 'TRIAL' | 'SUSPENSO' | 'INATIVO';
  plano: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  createdAt: string;
  trialExpiresAt?: string;
  pedidosHoje: number;
  pedidos24h: number;
  comandasAbertas: number;
  funcionariosAtivos: number;
  pagamentoEmDia: boolean;
  gatewaysAtivos: string[];
}

export interface CreateTenantDto {
  nome: string;
  slug: string;
  cnpj?: string;
  plano?: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  nomeFantasia: string;
  razaoSocial?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  adminNome: string;
  adminEmail: string;
  adminSenha: string;
}

export interface ProvisioningResult {
  tenant: {
    id: string;
    nome: string;
    slug: string;
    status: string;
    plano: string;
  };
  empresa: {
    id: string;
    nomeFantasia: string;
  };
  ambientes: Array<{ id: string; nome: string }>;
  mesas: Array<{ id: string; numero: number }>;
  admin: {
    id: string;
    nome: string;
    email: string;
  };
  credenciais: {
    email: string;
    senhaTemporaria: string;
  };
}

export interface SlugAvailability {
  slug: string;
  available: boolean;
  suggestions: string[];
}

export interface TenantFuncionario {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  status: string;
}

export interface TenantDetails {
  id: string;
  nome: string;
  slug: string;
  cnpj?: string;
  status: string;
  plano: string;
  config?: any;
  createdAt: string;
  updatedAt: string;
  admin?: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
  } | null;
  stats: {
    totalPedidos: number;
    pedidosHoje: number;
    totalComandas: number;
    comandasAbertas: number;
    totalFuncionarios: number;
    funcionariosAtivos: number;
  };
}

/**
 * SuperAdminService - Serviço para gestão da plataforma SaaS
 */
const superAdminService = {
  /**
   * Obtém métricas globais da plataforma
   */
  async getMetrics(): Promise<PlatformMetrics> {
    const response = await api.get('/super-admin/metrics');
    return response.data;
  },

  /**
   * Lista todos os tenants
   */
  async listTenants(): Promise<TenantSummary[]> {
    const response = await api.get('/super-admin/tenants');
    return response.data;
  },

  /**
   * Obtém detalhes de um tenant
   */
  async getTenantDetails(id: string) {
    const response = await api.get(`/super-admin/tenants/${id}`);
    return response.data;
  },

  /**
   * Cria um novo tenant (provisioning)
   */
  async createTenant(data: CreateTenantDto): Promise<ProvisioningResult> {
    const response = await api.post('/super-admin/tenants', data);
    return response.data;
  },

  /**
   * Suspende um tenant
   */
  async suspendTenant(id: string, motivo: string) {
    const response = await api.post(`/super-admin/tenants/${id}/suspend`, { motivo });
    return response.data;
  },

  /**
   * Reativa um tenant
   */
  async reactivateTenant(id: string) {
    const response = await api.post(`/super-admin/tenants/${id}/reactivate`);
    return response.data;
  },

  /**
   * Altera o plano de um tenant
   */
  async changePlan(id: string, plano: string) {
    const response = await api.patch(`/super-admin/tenants/${id}/plan`, { plano });
    return response.data;
  },

  /**
   * Verifica disponibilidade de slug
   */
  async checkSlugAvailability(slug: string): Promise<SlugAvailability> {
    const response = await api.get(`/super-admin/slugs/${slug}/available`);
    return response.data;
  },

  /**
   * Atualiza dados de um tenant
   */
  async updateTenant(id: string, data: { nome?: string; cnpj?: string; config?: any }) {
    const response = await api.put(`/super-admin/tenants/${id}`, data);
    return response.data;
  },

  /**
   * Reseta a senha do admin de um tenant
   */
  async resetAdminPassword(id: string, novaSenha: string): Promise<{ success: boolean; email: string }> {
    const response = await api.post(`/super-admin/tenants/${id}/reset-admin-password`, { novaSenha });
    return response.data;
  },

  /**
   * Lista funcionários de um tenant
   */
  async listTenantFuncionarios(id: string): Promise<TenantFuncionario[]> {
    const response = await api.get(`/super-admin/tenants/${id}/funcionarios`);
    return response.data;
  },

  /**
   * Deleta um tenant
   */
  async deleteTenant(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/super-admin/tenants/${id}`);
    return response.data;
  },
};

export default superAdminService;
