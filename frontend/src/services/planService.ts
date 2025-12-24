import api from './api';

export interface PlanLimits {
  maxMesas: number;
  maxFuncionarios: number;
  maxProdutos: number;
  maxAmbientes: number;
  maxEventos: number;
  storageGB: number;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  limits: PlanLimits;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureInfo {
  key: string;
  label: string;
  description: string;
}

export interface CreatePlanDto {
  code: string;
  name: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  limits: PlanLimits;
  isActive?: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  metadata?: Record<string, any>;
}

export interface UpdatePlanDto {
  name?: string;
  description?: string;
  priceMonthly?: number;
  priceYearly?: number;
  features?: string[];
  limits?: PlanLimits;
  isActive?: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  metadata?: Record<string, any>;
}

const planService = {
  /**
   * Lista planos públicos (para landing page)
   */
  async getPublicPlans(): Promise<Plan[]> {
    const response = await api.get('/plans/public');
    return response.data;
  },

  /**
   * Lista todas as features disponíveis
   */
  async getAllFeatures(): Promise<FeatureInfo[]> {
    const response = await api.get('/plans/features');
    return response.data;
  },

  /**
   * Lista todos os planos (Super Admin)
   */
  async getAll(includeInactive = true): Promise<Plan[]> {
    const response = await api.get('/plans', {
      params: { includeInactive: includeInactive.toString() },
    });
    return response.data;
  },

  /**
   * Busca plano por ID
   */
  async getById(id: string): Promise<Plan> {
    const response = await api.get(`/plans/${id}`);
    return response.data;
  },

  /**
   * Cria novo plano
   */
  async create(data: CreatePlanDto): Promise<Plan> {
    const response = await api.post('/plans', data);
    return response.data;
  },

  /**
   * Atualiza plano
   */
  async update(id: string, data: UpdatePlanDto): Promise<Plan> {
    const response = await api.patch(`/plans/${id}`, data);
    return response.data;
  },

  /**
   * Desativa plano
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/plans/${id}`);
  },
};

export default planService;
