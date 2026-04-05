'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePlanFeatures, Feature, invalidatePlanFeaturesCache } from '@/hooks/usePlanFeatures';
import api from '@/services/api';
import planService, { Plan } from '@/services/planService';
import paymentService, { PaymentGateway, PaymentConfig } from '@/services/paymentService';
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
  CreditCard,
  ExternalLink,
  RefreshCw,
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
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { currentPlan, planInfo, loading: planLoading } = usePlanFeatures();
  const [comparison, setComparison] = useState<PlanComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [gateways, setGateways] = useState<PaymentConfig[]>([]);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failure' | null>(null);
  const [plansData, setPlansData] = useState<Plan[]>([]);

  useEffect(() => {
    // Invalida o cache do plano para garantir dados frescos ao abrir a página
    invalidatePlanFeaturesCache();
    loadComparison();
    loadGateways();
    loadPlansData();
    
    // Verificar status do pagamento na URL
    const status = searchParams.get('status');
    if (status === 'success' || status === 'failure') {
      setPaymentStatus(status);
    }
  }, [searchParams]);

  const loadPlansData = async () => {
    try {
      const data = await planService.getPublicPlans();
      setPlansData(data);
    } catch (error) {
      console.error('Erro ao carregar preços dos planos:', error);
    }
  };

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

  const loadGateways = async () => {
    try {
      const data = await paymentService.getAvailableGateways();
      setGateways(data);
    } catch (error) {
      console.error('Erro ao carregar gateways:', error);
    }
  };

  const handleUpgrade = async (targetPlan: string) => {
    if (targetPlan === currentPlan) return;
    
    setSelectedPlan(targetPlan);
    
    // Se há gateways disponíveis, mostrar modal de seleção
    if (gateways.length > 0) {
      setShowGatewayModal(true);
    } else {
      alert('Nenhum gateway de pagamento configurado. Entre em contato com o suporte.');
    }
  };

  const handleSelectGateway = async (gateway: PaymentGateway) => {
    if (!selectedPlan || !user) return;
    
    setUpgrading(true);
    setShowGatewayModal(false);
    
    try {
      const result = await paymentService.createCheckout({
        targetPlan: selectedPlan,
        billingCycle,
        gateway,
        customer: {
          email: user.email,
          name: user.nome,
        },
      });

      if (result.success && result.checkoutUrl) {
        // Redirecionar para o checkout do gateway
        window.location.href = result.checkoutUrl;
      } else {
        alert(result.error || 'Erro ao criar checkout');
        setUpgrading(false);
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao processar pagamento');
      setUpgrading(false);
    }
  };

  // Plano atual: usa dado fresco do /plan/compare (não o hook que pode estar em cache)
  const activePlan = comparison?.currentPlano || currentPlan || 'FREE';

  const getPlanOrder = (plan: string): number => {
    const order: Record<string, number> = { FREE: 0, BASIC: 1, PRO: 2, ENTERPRISE: 3 };
    return order[plan] ?? 0;
  };

  const canUpgrade = (targetPlan: string): boolean => {
    return getPlanOrder(targetPlan) > getPlanOrder(activePlan);
  };

  const canDowngrade = (targetPlan: string): boolean => {
    return getPlanOrder(targetPlan) < getPlanOrder(activePlan);
  };

  const handleRefresh = () => {
    invalidatePlanFeaturesCache();
    loadComparison();
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
        <div className="flex items-center justify-between mb-4">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar ao Dashboard
          </Link>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border hover:bg-gray-50 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar plano
          </button>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">Planos e Preços</h1>
        </div>
        <p className="text-gray-600">
          Escolha o plano ideal para o seu negócio. Upgrade ou downgrade a qualquer momento.
        </p>
      </div>

      {/* Payment Status Banner */}
      {paymentStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <Check className="h-5 w-5 text-green-500" />
          <div>
            <p className="font-medium text-green-800">Pagamento aprovado!</p>
            <p className="text-sm text-green-600">Seu plano será atualizado em instantes.</p>
          </div>
          <button 
            onClick={() => setPaymentStatus(null)} 
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {paymentStatus === 'failure' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-medium text-red-800">Pagamento não aprovado</p>
            <p className="text-sm text-red-600">Tente novamente ou escolha outro método de pagamento.</p>
          </div>
          <button 
            onClick={() => setPaymentStatus(null)} 
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Current Plan Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-200 text-sm mb-1">Seu plano atual</p>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {React.createElement(PLAN_ICONS[activePlan] || Zap, { className: 'h-6 w-6' })}
              {activePlan}
            </h2>
            <p className="text-purple-200 mt-1">{PLAN_DESCRIPTIONS[activePlan]}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">
              R$ {plansData.find(p => p.code === activePlan)?.priceMonthly ?? 0}
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
          const planDb = plansData.find(p => p.code === plan.plano);
          const price = billingCycle === 'monthly'
            ? (planDb?.priceMonthly ?? 0)
            : Math.round((planDb?.priceYearly ?? 0) / 12);
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
                    R$ {plansData.find(p => p.code === plan.plano)?.priceYearly ?? 0}/ano
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

      {/* Gateway Selection Modal */}
      {showGatewayModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Escolha o método de pagamento</h3>
              <button
                onClick={() => setShowGatewayModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Upgrade para <strong>{selectedPlan}</strong> - R$ {
                billingCycle === 'monthly'
                  ? (plansData.find(p => p.code === (selectedPlan || 'FREE'))?.priceMonthly ?? 0)
                  : Math.round((plansData.find(p => p.code === (selectedPlan || 'FREE'))?.priceYearly ?? 0) / 12)
              }/mês
            </p>

            <div className="space-y-3">
              {gateways.map((gateway) => (
                <button
                  key={gateway.gateway}
                  onClick={() => handleSelectGateway(gateway.gateway)}
                  disabled={upgrading}
                  className="w-full flex items-center gap-4 p-4 border rounded-lg hover:border-purple-500 hover:bg-purple-50 transition disabled:opacity-50"
                >
                  {gateway.logoUrl ? (
                    <img src={gateway.logoUrl} alt={gateway.displayName} className="h-8 w-auto" />
                  ) : (
                    <CreditCard className="h-8 w-8 text-gray-400" />
                  )}
                  <div className="text-left flex-1">
                    <p className="font-medium text-gray-900">{gateway.displayName || gateway.gateway}</p>
                    {gateway.sandbox && (
                      <p className="text-xs text-yellow-600">Modo teste</p>
                    )}
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>

            {gateways.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum método de pagamento disponível</p>
                <p className="text-sm">Entre em contato com o suporte</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                <Shield className="h-3 w-3 inline mr-1" />
                Pagamento seguro processado pelo gateway selecionado
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {upgrading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900">Processando...</p>
            <p className="text-gray-500">Você será redirecionado para o checkout</p>
          </div>
        </div>
      )}
    </div>
  );
}
