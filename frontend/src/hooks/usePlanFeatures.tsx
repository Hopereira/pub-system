'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';

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

export interface PlanLimits {
  maxMesas: number;
  maxFuncionarios: number;
  maxProdutos: number;
  maxAmbientes: number;
  maxEventos: number;
  storageGB: number;
}

export interface PlanInfo {
  plano: string;
  features: Record<string, boolean>;
  limits: PlanLimits;
  allFeatures: string[];
  tenantId?: string;
  tenantNome?: string;
}

// Cache de módulo: evita que Sidebar + MobileMenu façam 2 chamadas simultâneas
let _planFeaturesCache: { data: PlanInfo; timestamp: number } | null = null;
let _planFeaturesInflight: Promise<PlanInfo> | null = null;
const PLAN_CACHE_TTL = 60000; // 60 segundos

const PLAN_FALLBACK: PlanInfo = {
  plano: 'FREE',
  features: { pedidos: true, comandas: true, mesas: true, produtos: true, funcionarios: true },
  limits: { maxMesas: 5, maxFuncionarios: 2, maxProdutos: 30, maxAmbientes: 1, maxEventos: 0, storageGB: 1 },
  allFeatures: ['pedidos', 'comandas', 'mesas', 'produtos', 'funcionarios'],
};

/** Invalida o cache do plano — use na página de plano para garantir dado fresco */
export function invalidatePlanFeaturesCache(): void {
  _planFeaturesCache = null;
  _planFeaturesInflight = null;
}

async function fetchPlanFeatures(): Promise<PlanInfo> {
  const now = Date.now();
  if (_planFeaturesCache && (now - _planFeaturesCache.timestamp < PLAN_CACHE_TTL)) {
    return _planFeaturesCache.data;
  }
  if (_planFeaturesInflight) {
    return _planFeaturesInflight;
  }
  _planFeaturesInflight = api.get('/plan/features')
    .then(res => {
      _planFeaturesCache = { data: res.data, timestamp: Date.now() };
      _planFeaturesInflight = null;
      return res.data as PlanInfo;
    })
    .catch(err => {
      _planFeaturesInflight = null;
      throw err;
    });
  return _planFeaturesInflight;
}

/**
 * Hook para verificar features disponíveis no plano atual
 * 
 * @example
 * const { hasFeature, isLoading } = usePlanFeatures();
 * 
 * if (!hasFeature(Feature.ANALYTICS)) {
 *   return <UpgradePrompt feature="Analytics" />;
 * }
 */
export function usePlanFeatures() {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(
    _planFeaturesCache?.data ?? null // usa cache imediatamente se disponível
  );
  const [loading, setLoading] = useState(!_planFeaturesCache);
  const [error, setError] = useState<string | null>(null);

  // Carregar features do plano
  useEffect(() => {
    const loadFeatures = async () => {
      try {
        setLoading(true);
        const data = await fetchPlanFeatures();
        setPlanInfo(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar plano');
        setPlanInfo(PLAN_FALLBACK);
      } finally {
        setLoading(false);
      }
    };

    loadFeatures();
  }, []);

  /**
   * Verifica se uma feature está disponível no plano atual
   */
  const hasFeature = useCallback(
    (feature: Feature | string): boolean => {
      if (!planInfo) return false;
      return planInfo.features[feature] === true;
    },
    [planInfo]
  );

  /**
   * Verifica se um limite foi atingido
   */
  const checkLimit = useCallback(
    (limitType: keyof PlanLimits, currentCount: number): boolean => {
      if (!planInfo) return false;
      const limit = planInfo.limits[limitType];
      if (limit === -1) return true; // Ilimitado
      return currentCount < limit;
    },
    [planInfo]
  );

  /**
   * Retorna o limite de um tipo específico
   */
  const getLimit = useCallback(
    (limitType: keyof PlanLimits): number => {
      if (!planInfo) return 0;
      return planInfo.limits[limitType];
    },
    [planInfo]
  );

  /**
   * Retorna o plano atual
   */
  const currentPlan = planInfo?.plano || 'FREE';

  /**
   * Verifica se é plano gratuito
   */
  const isFree = currentPlan === 'FREE';

  /**
   * Verifica se é plano pago
   */
  const isPaid = ['BASIC', 'PRO', 'ENTERPRISE'].includes(currentPlan);

  /**
   * Verifica se é plano PRO ou superior
   */
  const isPro = ['PRO', 'ENTERPRISE'].includes(currentPlan);

  /**
   * Verifica se é plano ENTERPRISE
   */
  const isEnterprise = currentPlan === 'ENTERPRISE';

  return {
    planInfo,
    loading,
    error,
    hasFeature,
    checkLimit,
    getLimit,
    currentPlan,
    isFree,
    isPaid,
    isPro,
    isEnterprise,
  };
}

/**
 * Componente para mostrar prompt de upgrade quando feature não está disponível
 */
export function FeatureGate({
  feature,
  children,
  fallback,
}: {
  feature: Feature | string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasFeature, loading, currentPlan } = usePlanFeatures();

  if (loading) {
    return null;
  }

  if (!hasFeature(feature)) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Funcionalidade Premium
          </h3>
          <p className="text-gray-600 mb-4">
            A funcionalidade <strong>{feature}</strong> não está disponível no
            plano {currentPlan}.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard/configuracoes/plano'}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Fazer Upgrade
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default usePlanFeatures;
