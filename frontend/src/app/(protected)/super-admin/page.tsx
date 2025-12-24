'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import superAdminService, { PlatformMetrics, TenantSummary, CreateTenantDto } from '@/services/superAdminService';
import {
  Building2,
  Users,
  CreditCard,
  BarChart2,
  Plus,
  Crown,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Loader2,
  Search,
  MoreVertical,
  Ban,
  CheckCircle,
  Eye,
  Edit,
  Clock,
  AlertTriangle,
  ShoppingCart,
  Zap,
  X,
} from 'lucide-react';

export default function SuperAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.cargo !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsData, tenantsData] = await Promise.all([
        superAdminService.getMetrics(),
        superAdminService.listTenants(),
      ]);
      setMetrics(metricsData);
      setTenants(tenantsData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (tenant: TenantSummary) => {
    const motivo = prompt('Motivo da suspensão:');
    if (!motivo) return;
    try {
      setActionLoading(tenant.id);
      await superAdminService.suspendTenant(tenant.id, motivo);
      await loadData();
    } catch (err) {
      alert('Erro ao suspender tenant');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivate = async (tenant: TenantSummary) => {
    if (!confirm(`Reativar ${tenant.nome}?`)) return;
    try {
      setActionLoading(tenant.id);
      await superAdminService.reactivateTenant(tenant.id);
      await loadData();
    } catch (err) {
      alert('Erro ao reativar tenant');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangePlan = async (tenant: TenantSummary) => {
    const planos = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
    const novoPlano = prompt(`Novo plano para ${tenant.nome}:\n\nOpções: ${planos.join(', ')}\n\nAtual: ${tenant.plano}`);
    if (!novoPlano || !planos.includes(novoPlano.toUpperCase())) return;
    try {
      setActionLoading(tenant.id);
      await superAdminService.changePlan(tenant.id, novoPlano.toUpperCase());
      await loadData();
    } catch (err) {
      alert('Erro ao alterar plano');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ATIVO: 'bg-green-100 text-green-800',
      TRIAL: 'bg-blue-100 text-blue-800',
      SUSPENSO: 'bg-red-100 text-red-800',
      INATIVO: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getPlanoBadge = (plano: string) => {
    const styles: Record<string, string> = {
      FREE: 'bg-gray-100 text-gray-600',
      BASIC: 'bg-blue-100 text-blue-600',
      PRO: 'bg-purple-100 text-purple-600',
      ENTERPRISE: 'bg-amber-100 text-amber-600',
    };
    return styles[plano] || 'bg-gray-100 text-gray-600';
  };

  const statsCards = [
    {
      title: 'Total de Empresas',
      value: loading ? '...' : String(metrics?.totalTenants || 0),
      subtitle: 'Bares cadastrados',
      icon: Building2,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'MRR (Faturamento)',
      value: loading ? '...' : `R$ ${(metrics?.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      subtitle: 'Receita mensal recorrente',
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pedidos (24h)',
      value: loading ? '...' : String(metrics?.pedidos24h || 0),
      subtitle: 'Volume em toda a rede',
      icon: ShoppingCart,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Novos Trials',
      value: loading ? '...' : String(metrics?.novosTrials7dias || 0),
      subtitle: 'Últimos 7 dias',
      icon: Zap,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
  ];

  const quickActions = [
    {
      title: 'Novo Estabelecimento',
      description: 'Provisionar novo bar na plataforma',
      icon: Plus,
      onClick: () => setShowCreateModal(true),
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Configurar Pagamentos',
      description: 'Gerenciar gateways por tenant',
      icon: CreditCard,
      href: '/super-admin/pagamentos',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Planos e Billing',
      description: 'Controle de assinaturas',
      icon: DollarSign,
      href: '/super-admin/planos',
      color: 'bg-amber-500 hover:bg-amber-600',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Crown className="h-8 w-8 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard SaaS</h1>
            <p className="text-muted-foreground">
              Bem-vindo, {user?.nome || 'Super Admin'}!
            </p>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Atualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <div key={stat.title} className="bg-white dark:bg-gray-800 rounded-xl border p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.title}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const IconComponent = action.icon;
          const content = (
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border hover:shadow-md transition-all cursor-pointer">
              <div className={`p-3 rounded-lg ${action.color} text-white`}>
                <IconComponent className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{action.title}</h3>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>
            </div>
          );
          if (action.href) {
            return <Link key={action.title} href={action.href}>{content}</Link>;
          }
          return <div key={action.title} onClick={action.onClick}>{content}</div>;
        })}
      </div>

      {/* Tenants Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gestão de Empresas
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-64 text-sm"
              />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Novo Bar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estabelecimento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gateways</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pedidos 24h</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Comandas</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Nenhum estabelecimento encontrado
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{tenant.nome}</p>
                        <p className="text-xs text-gray-500">{tenant.slug}.pubsystem.com.br</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanoBadge(tenant.plano)}`}>
                        {tenant.plano}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(tenant.status)}`}>
                          {tenant.status}
                        </span>
                        {tenant.status === 'TRIAL' && tenant.trialExpiresAt && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.ceil((new Date(tenant.trialExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {tenant.gatewaysAtivos.length > 0 ? (
                        <div className="flex gap-1">
                          {tenant.gatewaysAtivos.map((gw) => (
                            <span key={gw} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                              {gw}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Nenhum</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{tenant.pedidos24h}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={tenant.comandasAbertas > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                        {tenant.comandasAbertas}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {actionLoading === tenant.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <button
                              onClick={() => handleChangePlan(tenant)}
                              className="p-1.5 hover:bg-gray-100 rounded"
                              title="Alterar Plano"
                            >
                              <Edit className="h-4 w-4 text-gray-500" />
                            </button>
                            {tenant.status === 'SUSPENSO' ? (
                              <button
                                onClick={() => handleReactivate(tenant)}
                                className="p-1.5 hover:bg-green-100 rounded"
                                title="Reativar"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspend(tenant)}
                                className="p-1.5 hover:bg-red-100 rounded"
                                title="Suspender"
                              >
                                <Ban className="h-4 w-4 text-red-500" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTenantModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function CreateTenantModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateTenantDto>({
    nome: '',
    slug: '',
    nomeFantasia: '',
    plano: 'FREE',
    adminNome: '',
    adminEmail: '',
    adminSenha: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await superAdminService.createTenant(form);
      alert('Estabelecimento criado com sucesso!');
      onSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao criar estabelecimento');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Novo Estabelecimento</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome do Bar *</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => {
                setForm({ ...form, nome: e.target.value, slug: generateSlug(e.target.value), nomeFantasia: e.target.value });
              }}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug (Subdomínio) *</label>
            <div className="flex items-center">
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-l-lg"
                required
              />
              <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r-lg text-sm text-gray-500">
                .pubsystem.com.br
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Plano Inicial</label>
            <select
              value={form.plano}
              onChange={(e) => setForm({ ...form, plano: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="FREE">FREE - Gratuito</option>
              <option value="BASIC">BASIC - R$ 99/mês</option>
              <option value="PRO">PRO - R$ 199/mês</option>
              <option value="ENTERPRISE">ENTERPRISE - R$ 499/mês</option>
            </select>
          </div>
          <hr />
          <p className="text-sm font-medium text-gray-600">Administrador do Bar</p>
          <div>
            <label className="block text-sm font-medium mb-1">Nome do Admin *</label>
            <input
              type="text"
              value={form.adminNome}
              onChange={(e) => setForm({ ...form, adminNome: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-mail do Admin *</label>
            <input
              type="email"
              value={form.adminEmail}
              onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Senha Inicial *</label>
            <input
              type="password"
              value={form.adminSenha}
              onChange={(e) => setForm({ ...form, adminSenha: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              required
              minLength={6}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Infraestrutura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
