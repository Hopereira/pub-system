import api from './api';

/**
 * Tipos para o Super Admin
 */
export interface PlatformMetrics {
  totalTenants: number;
  tenantsByStatus: Record<string, number>;
  tenantsByPlano: Record<string, number>;
  pedidosHoje: number;
  comandasAbertas: number;
  faturamentoHoje: number;
  mrr: number;
}

export interface TenantSummary {
  id: string;
  nome: string;
  slug: string;
  status: 'ATIVO' | 'TRIAL' | 'SUSPENSO' | 'INATIVO';
  plano: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  createdAt: string;
  pedidosHoje: number;
  comandasAbertas: number;
  funcionariosAtivos: number;
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
};

export default superAdminService;
