'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import superAdminService, { PlatformMetrics } from '@/services/superAdminService';
import planService, { Plan } from '@/services/planService';
import {
  CreditCard,
  TrendingUp,
  Users,
  DollarSign,
  RefreshCw,
  Loader2,
  Crown,
  Zap,
  Building2,
  Star,
} from 'lucide-react';

export default function PlanosPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Verificar se é SUPER_ADMIN
  useEffect(() => {
    if (user && user.cargo !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Mapeamento de ícones e cores por código de plano
  const planoUiConfig: Record<string, { icon: any; cor: string }> = {
    FREE: { icon: Users, cor: 'gray' },
    BASIC: { icon: Zap, cor: 'blue' },
    PRO: { icon: Star, cor: 'purple' },
    ENTERPRISE: { icon: Crown, cor: 'amber' },
  };

  // Carregar dados
  useEffect(() => {
    loadMetrics();
    loadPlans();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await superAdminService.getMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const data = await planService.getAll(false);
      setPlans(data);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Planos e Faturamento
          </h1>
          <p className="text-muted-foreground">
            Visão geral dos planos e receita da plataforma
          </p>
        </div>
        <button
          onClick={loadMetrics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* MRR Card */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm">Receita Mensal Recorrente (MRR)</p>
            <p className="text-4xl font-bold mt-1">
              R$ {metrics?.mrr?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </p>
            <p className="text-green-100 text-sm mt-2">
              Baseado em {metrics?.totalTenants || 0} tenants ativos
            </p>
          </div>
          <DollarSign className="h-16 w-16 text-green-200 opacity-50" />
        </div>
      </div>

      {/* Distribuição por Plano */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plano) => {
          const count = metrics?.tenantsByPlano?.[plano.code] || 0;
          const receita = count * Number(plano.priceMonthly);
          const ui = planoUiConfig[plano.code] || { icon: Star, cor: 'gray' };
          const Icon = ui.icon;

          return (
            <div
              key={plano.code}
              className="bg-white dark:bg-gray-800 rounded-xl border p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg bg-${ui.cor}-100 dark:bg-${ui.cor}-900/30`}>
                  <Icon className={`h-6 w-6 text-${ui.cor}-600`} />
                </div>
                <span className="text-2xl font-bold">{count}</span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{plano.name}</h3>
                <p className="text-sm text-gray-500">
                  R$ {Number(plano.priceMonthly).toFixed(0)}/mês por tenant
                </p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">Receita do plano</p>
                <p className="text-xl font-bold text-green-600">
                  R$ {receita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <ul className="text-xs text-gray-500 space-y-1">
                {plano.features.slice(0, 4).map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Estatísticas Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de Tenants</p>
              <p className="text-2xl font-bold">{metrics?.totalTenants || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tenants Ativos</p>
              <p className="text-2xl font-bold">{metrics?.tenantsByStatus?.ATIVO || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Em Trial</p>
              <p className="text-2xl font-bold">{metrics?.tenantsByStatus?.TRIAL || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversão */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border p-6">
        <h3 className="font-semibold text-lg mb-4">Taxa de Conversão por Plano</h3>
        <div className="space-y-4">
          {plans.map((plano) => {
            const count = metrics?.tenantsByPlano?.[plano.code] || 0;
            const total = metrics?.totalTenants || 1;
            const percentage = ((count / total) * 100).toFixed(1);
            const ui = planoUiConfig[plano.code] || { icon: Star, cor: 'gray' };

            return (
              <div key={plano.code} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{plano.name}</span>
                  <span>{percentage}% ({count} tenants)</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-${ui.cor}-500 rounded-full transition-all`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
