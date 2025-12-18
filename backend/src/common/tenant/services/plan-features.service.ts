import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { TenantPlano } from '../entities/tenant.entity';

/**
 * Features disponíveis na plataforma
 */
export enum Feature {
  // Básicas (todos os planos)
  PEDIDOS = 'pedidos',
  COMANDAS = 'comandas',
  MESAS = 'mesas',
  PRODUTOS = 'produtos',
  FUNCIONARIOS = 'funcionarios',
  
  // Intermediárias (BASIC+)
  CLIENTES = 'clientes',
  AVALIACOES = 'avaliacoes',
  EVENTOS = 'eventos',
  PONTOS_ENTREGA = 'pontos_entrega',
  
  // Avançadas (PRO+)
  ANALYTICS = 'analytics',
  RELATORIOS_AVANCADOS = 'relatorios_avancados',
  MEDALHAS = 'medalhas',
  TURNOS = 'turnos',
  CAIXA_AVANCADO = 'caixa_avancado',
  
  // Premium (ENTERPRISE)
  API_EXTERNA = 'api_externa',
  WEBHOOKS = 'webhooks',
  WHITE_LABEL = 'white_label',
  MULTI_UNIDADE = 'multi_unidade',
  SUPORTE_PRIORITARIO = 'suporte_prioritario',
}

/**
 * Limites por plano
 */
export interface PlanLimits {
  maxMesas: number;
  maxFuncionarios: number;
  maxProdutos: number;
  maxAmbientes: number;
  maxEventos: number;
  storageGB: number;
}

/**
 * Configuração de features por plano
 */
export const PLAN_FEATURES: Record<TenantPlano, Feature[]> = {
  [TenantPlano.FREE]: [
    Feature.PEDIDOS,
    Feature.COMANDAS,
    Feature.MESAS,
    Feature.PRODUTOS,
    Feature.FUNCIONARIOS,
  ],
  [TenantPlano.BASIC]: [
    Feature.PEDIDOS,
    Feature.COMANDAS,
    Feature.MESAS,
    Feature.PRODUTOS,
    Feature.FUNCIONARIOS,
    Feature.CLIENTES,
    Feature.AVALIACOES,
    Feature.EVENTOS,
    Feature.PONTOS_ENTREGA,
  ],
  [TenantPlano.PRO]: [
    Feature.PEDIDOS,
    Feature.COMANDAS,
    Feature.MESAS,
    Feature.PRODUTOS,
    Feature.FUNCIONARIOS,
    Feature.CLIENTES,
    Feature.AVALIACOES,
    Feature.EVENTOS,
    Feature.PONTOS_ENTREGA,
    Feature.ANALYTICS,
    Feature.RELATORIOS_AVANCADOS,
    Feature.MEDALHAS,
    Feature.TURNOS,
    Feature.CAIXA_AVANCADO,
  ],
  [TenantPlano.ENTERPRISE]: [
    // Todas as features
    ...Object.values(Feature),
  ],
};

/**
 * Limites por plano
 */
export const PLAN_LIMITS: Record<TenantPlano, PlanLimits> = {
  [TenantPlano.FREE]: {
    maxMesas: 10,
    maxFuncionarios: 5,
    maxProdutos: 50,
    maxAmbientes: 3,
    maxEventos: 0,
    storageGB: 1,
  },
  [TenantPlano.BASIC]: {
    maxMesas: 30,
    maxFuncionarios: 15,
    maxProdutos: 200,
    maxAmbientes: 5,
    maxEventos: 5,
    storageGB: 5,
  },
  [TenantPlano.PRO]: {
    maxMesas: 100,
    maxFuncionarios: 50,
    maxProdutos: 1000,
    maxAmbientes: 10,
    maxEventos: 20,
    storageGB: 20,
  },
  [TenantPlano.ENTERPRISE]: {
    maxMesas: -1, // Ilimitado
    maxFuncionarios: -1,
    maxProdutos: -1,
    maxAmbientes: -1,
    maxEventos: -1,
    storageGB: 100,
  },
};

/**
 * PlanFeaturesService - Gestão de Features por Plano
 * 
 * Controla quais funcionalidades estão disponíveis para cada plano.
 * Usado para:
 * - Verificar se tenant pode acessar uma feature
 * - Verificar limites (mesas, funcionários, etc)
 * - Retornar lista de features disponíveis para o frontend
 */
@Injectable()
export class PlanFeaturesService {
  private readonly logger = new Logger(PlanFeaturesService.name);

  /**
   * Verifica se o plano tem acesso a uma feature
   */
  hasFeature(plano: TenantPlano | string, feature: Feature): boolean {
    const planFeatures = PLAN_FEATURES[plano as TenantPlano] || PLAN_FEATURES[TenantPlano.FREE];
    return planFeatures.includes(feature);
  }

  /**
   * Verifica se o plano tem acesso a uma feature e lança exceção se não tiver
   */
  requireFeature(plano: TenantPlano | string, feature: Feature): void {
    if (!this.hasFeature(plano, feature)) {
      this.logger.warn(
        `🚫 Acesso negado à feature "${feature}" para plano "${plano}"`,
      );
      throw new ForbiddenException(
        `Esta funcionalidade não está disponível no plano ${plano}. ` +
        `Faça upgrade para ter acesso.`,
      );
    }
  }

  /**
   * Retorna todas as features disponíveis para um plano
   */
  getFeatures(plano: TenantPlano | string): Feature[] {
    return PLAN_FEATURES[plano as TenantPlano] || PLAN_FEATURES[TenantPlano.FREE];
  }

  /**
   * Retorna os limites de um plano
   */
  getLimits(plano: TenantPlano | string): PlanLimits {
    return PLAN_LIMITS[plano as TenantPlano] || PLAN_LIMITS[TenantPlano.FREE];
  }

  /**
   * Verifica se um limite foi atingido
   * @returns true se ainda pode adicionar, false se atingiu o limite
   */
  checkLimit(
    plano: TenantPlano | string,
    limitType: keyof PlanLimits,
    currentCount: number,
  ): boolean {
    const limits = this.getLimits(plano);
    const limit = limits[limitType];
    
    // -1 significa ilimitado
    if (limit === -1) return true;
    
    return currentCount < limit;
  }

  /**
   * Verifica limite e lança exceção se atingido
   */
  requireLimit(
    plano: TenantPlano | string,
    limitType: keyof PlanLimits,
    currentCount: number,
  ): void {
    if (!this.checkLimit(plano, limitType, currentCount)) {
      const limits = this.getLimits(plano);
      const limit = limits[limitType];
      
      this.logger.warn(
        `🚫 Limite de "${limitType}" atingido para plano "${plano}": ${currentCount}/${limit}`,
      );
      
      throw new ForbiddenException(
        `Limite de ${limitType} atingido (${limit}). ` +
        `Faça upgrade do plano para aumentar o limite.`,
      );
    }
  }

  /**
   * Retorna informações completas do plano para o frontend
   */
  getPlanInfo(plano: TenantPlano | string) {
    const features = this.getFeatures(plano);
    const limits = this.getLimits(plano);
    
    // Mapear features para objeto booleano
    const featureFlags: Record<string, boolean> = {};
    Object.values(Feature).forEach((f) => {
      featureFlags[f] = features.includes(f);
    });

    return {
      plano,
      features: featureFlags,
      limits,
      allFeatures: features,
    };
  }

  /**
   * Compara dois planos e retorna features que seriam ganhas com upgrade
   */
  getUpgradeFeatures(
    currentPlano: TenantPlano | string,
    targetPlano: TenantPlano | string,
  ): Feature[] {
    const currentFeatures = this.getFeatures(currentPlano);
    const targetFeatures = this.getFeatures(targetPlano);
    
    return targetFeatures.filter((f) => !currentFeatures.includes(f));
  }
}
