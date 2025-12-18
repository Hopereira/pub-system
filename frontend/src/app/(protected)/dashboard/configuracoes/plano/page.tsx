'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePlanFeatures, Feature } from '@/hooks/usePlanFeatures';
import api from '@/services/api';
import {
  Crown,
  Check,
  X,
  Zap,
  Building2,
  Users,
  Package,
  BarChart3,
  Shield,
  Rocket,
  Star,
  ArrowRight,
  Loader2,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

interface PlanComparison {
  currentPlano: string;
  planos: {
    plano: string;
    isCurrent: boolean;
    features: Record<string, boolean>;
    limits: {
      maxMesas: number;
      maxFuncionarios: number;
      maxProdutos: number;
      maxAmbientes: number;
      maxEventos: number;
      storageGB: number;
    };
    allFeatures: string[];
    upgradeFeatures: string[];
  }[];
}

const PLAN_PRICES: Record<string, { monthly: number; yearly: number }> = {
  FREE: { monthly: 0, yearly: 0 },
  BASIC: { monthly: 99, yearly: 990 },
  PRO: { monthly: 199, yearly: 1990 },
  ENTERPRISE: { monthly: 499, yearly: 4990 },
};

const PLAN_DESCRIPTIONS: Record<string, string> = {
  FREE: 'Ideal para testar a plataforma',
  BASIC: 'Para bares pequenos e médios',
  PRO: 'Para bares em crescimento',
  ENTERPRISE: 'Para redes e grandes operações',
};

const PLAN_ICONS: Record<string, React.ElementType> = {
  FREE: Zap,
  BASIC: Building2,
  PRO: Rocket,
  ENTERPRISE: Crown,
};

const FEATURE_LABELS: Record<string, string> = {
  pedidos: 'Gestão de Pedidos',
  comandas: 'Comandas',
  mesas: 'Mesas',
  produtos: 'Cardápio Digital',
  funcionarios: 'Funcionários',
  clientes: 'Gestão de Clientes',
  avaliacoes: 'Avaliações',
  eventos: 'Eventos',
  pontos_entrega: 'Pontos de Entrega',
  analytics: 'Analytics Avançado',
  relatorios_avancados: 'Relatórios Avançados',
  medalhas: 'Gamificação (Medalhas)',
  turnos: 'Gestão de Turnos',
  caixa_avancado: 'Caixa Avançado',
  api_externa: 'API Externa',
  webhooks: 'Webhooks',
  white_label: 'White Label',
  multi_unidade: 'Multi-Unidade',
  suporte_prioritario: 'Suporte Prioritário',
};

export default function PlanUpgradePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentPlan, planInfo, loading: planLoading } = usePlanFeatures();
  const [comparison, setComparison] = useState<PlanComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    loadComparison();
  }, []);

  const loadComparison = async () => {
    try {
      setLoading(true);
      const response = await api.get('/plan/compare');
      setComparison(response.data);
    } catch (error) {
      console.error('Erro ao carregar comparação de planos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (targetPlan: string) => {
    if (targetPlan === currentPlan) return;
    
    setSelectedPlan(targetPlan);
    setUpgrading(true);
    
    // Simular processo de upgrade (em produção, integraria com gateway de pagamento)
    setTimeout(() => {
      setUpgrading(false);
      alert(`Upgrade para ${targetPlan} solicitado! Em produção, você seria redirecionado para o gateway de pagamento.`);
    }, 1500);
  };

  const getPlanOrder = (plan: string): number => {
    const order: Record<string, number> = { FREE: 0, BASIC: 1, PRO: 2, ENTERPRISE: 3 };
    return order[plan] ?? 0;
  };

  const canUpgrade = (targetPlan: string): boolean => {
    return getPlanOrder(targetPlan) > getPlanOrder(currentPlan);
  };

  const canDowngrade = (targetPlan: string): boolean => {
    return getPlanOrder(targetPlan) < getPlanOrder(currentPlan);
  };

  if (loading || planLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar ao Dashboard
        </Link>
        
        <div className="flex items-center gap-3 mb-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">Planos e Preços</h1>
        </div>
        <p className="text-gray-600">
          Escolha o plano ideal para o seu negócio. Upgrade ou downgrade a qualquer momento.
        </p>
      </div>

      {/* Current Plan Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-200 text-sm mb-1">Seu plano atual</p>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {React.createElement(PLAN_ICONS[currentPlan] || Zap, { className: 'h-6 w-6' })}
              {currentPlan}
            </h2>
            <p className="text-purple-200 mt-1">{PLAN_DESCRIPTIONS[currentPlan]}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">
              R$ {PLAN_PRICES[currentPlan]?.monthly || 0}
              <span className="text-lg font-normal">/mês</span>
            </p>
            {planInfo?.limits && (
              <p className="text-purple-200 text-sm mt-1">
                {planInfo.limits.maxMesas === -1 ? '∞' : planInfo.limits.maxMesas} mesas • 
                {planInfo.limits.maxFuncionarios === -1 ? '∞' : planInfo.limits.maxFuncionarios} funcionários
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              billingCycle === 'yearly'
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Anual
            <span className="ml-1 text-xs text-green-600 font-bold">-17%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {comparison?.planos.map((plan) => {
          const PlanIcon = PLAN_ICONS[plan.plano] || Zap;
          const price = billingCycle === 'monthly' 
            ? PLAN_PRICES[plan.plano]?.monthly 
            : Math.round(PLAN_PRICES[plan.plano]?.yearly / 12);
          const isCurrentPlan = plan.isCurrent;
          const isPopular = plan.plano === 'PRO';

          return (
            <div
              key={plan.plano}
              className={`relative bg-white rounded-xl border-2 p-6 transition-all ${
                isCurrentPlan
                  ? 'border-purple-500 shadow-lg'
                  : isPopular
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Popular Badge */}
              {isPopular && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    MAIS POPULAR
                  </span>
                </div>
              )}

              {/* Current Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    PLANO ATUAL
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6 pt-2">
                <div className={`inline-flex p-3 rounded-full mb-3 ${
                  isCurrentPlan ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  <PlanIcon className={`h-6 w-6 ${
                    isCurrentPlan ? 'text-purple-600' : 'text-gray-600'
                  }`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{plan.plano}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {PLAN_DESCRIPTIONS[plan.plano]}
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-gray-900">
                  R$ {price}
                  <span className="text-lg font-normal text-gray-500">/mês</span>
                </p>
                {billingCycle === 'yearly' && price > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    R$ {PLAN_PRICES[plan.plano]?.yearly}/ano
                  </p>
                )}
              </div>

              {/* Limits */}
              <div className="space-y-2 mb-6 pb-6 border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mesas</span>
                  <span className="font-medium">
                    {plan.limits.maxMesas === -1 ? 'Ilimitado' : plan.limits.maxMesas}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Funcionários</span>
                  <span className="font-medium">
                    {plan.limits.maxFuncionarios === -1 ? 'Ilimitado' : plan.limits.maxFuncionarios}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Produtos</span>
                  <span className="font-medium">
                    {plan.limits.maxProdutos === -1 ? 'Ilimitado' : plan.limits.maxProdutos}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Storage</span>
                  <span className="font-medium">{plan.limits.storageGB} GB</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6">
                {Object.entries(plan.features).slice(0, 8).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    {enabled ? (
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    )}
                    <span className={enabled ? 'text-gray-700' : 'text-gray-400'}>
                      {FEATURE_LABELS[feature] || feature}
                    </span>
                  </div>
                ))}
                {Object.keys(plan.features).length > 8 && (
                  <p className="text-xs text-gray-500 mt-2">
                    + {Object.keys(plan.features).length - 8} mais recursos
                  </p>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleUpgrade(plan.plano)}
                disabled={isCurrentPlan || upgrading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                  isCurrentPlan
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : canUpgrade(plan.plano)
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : canDowngrade(plan.plano)
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {upgrading && selectedPlan === plan.plano ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : isCurrentPlan ? (
                  'Plano Atual'
                ) : canUpgrade(plan.plano) ? (
                  <>
                    Fazer Upgrade
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  'Fazer Downgrade'
                )}
              </button>

              {/* Upgrade Features Preview */}
              {!isCurrentPlan && plan.upgradeFeatures.length > 0 && canUpgrade(plan.plano) && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs font-medium text-purple-700 mb-2">
                    Você ganha acesso a:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {plan.upgradeFeatures.slice(0, 3).map((feature) => (
                      <span
                        key={feature}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
                      >
                        {FEATURE_LABELS[feature] || feature}
                      </span>
                    ))}
                    {plan.upgradeFeatures.length > 3 && (
                      <span className="text-xs text-purple-600">
                        +{plan.upgradeFeatures.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Perguntas Frequentes
        </h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Posso mudar de plano a qualquer momento?
            </h3>
            <p className="text-gray-600 text-sm">
              Sim! Você pode fazer upgrade ou downgrade a qualquer momento. 
              O valor será calculado proporcionalmente.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              O que acontece se eu exceder os limites?
            </h3>
            <p className="text-gray-600 text-sm">
              Você receberá um aviso quando estiver próximo do limite. 
              Para continuar, será necessário fazer upgrade.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Existe período de teste?
            </h3>
            <p className="text-gray-600 text-sm">
              O plano FREE é gratuito para sempre. Você pode testar 
              a plataforma sem compromisso antes de fazer upgrade.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Como funciona o suporte?
            </h3>
            <p className="text-gray-600 text-sm">
              Todos os planos têm acesso ao suporte. Planos PRO e ENTERPRISE 
              têm suporte prioritário com tempo de resposta garantido.
            </p>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">
          Precisa de um plano personalizado para sua rede de bares?
        </p>
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
          <Building2 className="h-5 w-5" />
          Falar com Vendas
        </button>
      </div>
    </div>
  );
}
