'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import superAdminService, {
  PlatformMetrics,
  TenantSummary,
  CreateTenantDto,
} from '@/services/superAdminService';
import {
  Building2,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Plus,
  RefreshCw,
  Search,
  MoreVertical,
  Ban,
  CheckCircle,
  ArrowUpCircle,
  Eye,
  AlertTriangle,
  Loader2,
  CreditCard,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Super Admin Dashboard - Painel do Dono da Plataforma SaaS
 * 
 * Funcionalidades:
 * - Métricas globais da plataforma
 * - Lista de todos os tenants (bares)
 * - Criar novo tenant
 * - Suspender/Reativar tenants
 * - Alterar planos
 */
export default function SuperAdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantSummary | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Verificar se é SUPER_ADMIN
  useEffect(() => {
    if (user && user.cargo !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsData, tenantsData] = await Promise.all([
        superAdminService.getMetrics(),
        superAdminService.listTenants(),
      ]);
      setMetrics(metricsData);
      setTenants(tenantsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar tenants
  const filteredTenants = tenants.filter(
    (t) =>
      t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Suspender tenant
  const handleSuspend = async (tenant: TenantSummary) => {
    const motivo = prompt('Motivo da suspensão:');
    if (!motivo) return;

    try {
      setActionLoading(true);
      await superAdminService.suspendTenant(tenant.id, motivo);
      await loadData();
      alert(`Tenant ${tenant.nome} suspenso com sucesso!`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao suspender tenant');
    } finally {
      setActionLoading(false);
    }
  };

  // Reativar tenant
  const handleReactivate = async (tenant: TenantSummary) => {
    if (!confirm(`Reativar o tenant ${tenant.nome}?`)) return;

    try {
      setActionLoading(true);
      await superAdminService.reactivateTenant(tenant.id);
      await loadData();
      alert(`Tenant ${tenant.nome} reativado com sucesso!`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao reativar tenant');
    } finally {
      setActionLoading(false);
    }
  };

  // Alterar plano
  const handleChangePlan = async (tenant: TenantSummary) => {
    const planos = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
    const novoPlano = prompt(
      `Novo plano para ${tenant.nome}:\n\nOpções: ${planos.join(', ')}\n\nAtual: ${tenant.plano}`
    );
    if (!novoPlano || !planos.includes(novoPlano.toUpperCase())) return;

    try {
      setActionLoading(true);
      await superAdminService.changePlan(tenant.id, novoPlano.toUpperCase());
      await loadData();
      alert(`Plano alterado para ${novoPlano.toUpperCase()}!`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao alterar plano');
    } finally {
      setActionLoading(false);
    }
  };

  if (user?.cargo !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Acesso Negado</h1>
          <p className="text-gray-600 mt-2">
            Apenas SUPER_ADMIN pode acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Carregando dados...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Erro</h1>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Super Admin</h1>
          <p className="text-gray-600">Gestão da Plataforma SaaS</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <Link
            href="/super-admin/pagamentos"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <CreditCard className="w-4 h-4" />
            Pagamentos
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Novo Tenant
          </button>
        </div>
      </div>

      {/* Métricas */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Bares"
            value={metrics.totalTenants}
            icon={<Building2 className="w-6 h-6" />}
            color="blue"
          />
          <MetricCard
            title="Pedidos Hoje"
            value={metrics.pedidosHoje}
            icon={<ShoppingCart className="w-6 h-6" />}
            color="green"
          />
          <MetricCard
            title="Faturamento Hoje"
            value={`R$ ${metrics.faturamentoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<DollarSign className="w-6 h-6" />}
            color="yellow"
          />
          <MetricCard
            title="MRR"
            value={`R$ ${metrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="purple"
            subtitle="Receita Mensal Recorrente"
          />
        </div>
      )}

      {/* Status dos Tenants */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusBadge
            label="Ativos"
            count={metrics.tenantsByStatus['ATIVO'] || 0}
            color="green"
          />
          <StatusBadge
            label="Trial"
            count={metrics.tenantsByStatus['TRIAL'] || 0}
            color="blue"
          />
          <StatusBadge
            label="Suspensos"
            count={metrics.tenantsByStatus['SUSPENSO'] || 0}
            color="red"
          />
          <StatusBadge
            label="Inativos"
            count={metrics.tenantsByStatus['INATIVO'] || 0}
            color="gray"
          />
        </div>
      )}

      {/* Distribuição por Plano */}
      {metrics && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Distribuição por Plano
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['FREE', 'BASIC', 'PRO', 'ENTERPRISE'].map((plano) => (
              <div
                key={plano}
                className="text-center p-4 bg-gray-50 rounded-lg"
              >
                <div className="text-2xl font-bold text-gray-900">
                  {metrics.tenantsByPlano[plano] || 0}
                </div>
                <div className="text-sm text-gray-600">{plano}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Tenants */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Tenants ({filteredTenants.length})
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tenant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Plano
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Pedidos Hoje
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Comandas
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Funcionários
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-gray-900">
                        {tenant.nome}
                      </div>
                      <div className="text-sm text-gray-500">{tenant.slug}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusPill status={tenant.status} />
                  </td>
                  <td className="px-4 py-4">
                    <PlanBadge plano={tenant.plano} />
                  </td>
                  <td className="px-4 py-4 text-center text-gray-900">
                    {tenant.pedidosHoje}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-900">
                    {tenant.comandasAbertas}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-900">
                    {tenant.funcionariosAtivos}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => router.push(`/super-admin/tenants/${tenant.id}`)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleChangePlan(tenant)}
                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                        title="Alterar plano"
                        disabled={actionLoading}
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                      </button>
                      {tenant.status === 'SUSPENSO' ? (
                        <button
                          onClick={() => handleReactivate(tenant)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                          title="Reativar"
                          disabled={actionLoading}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSuspend(tenant)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Suspender"
                          disabled={actionLoading}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTenants.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Nenhum tenant encontrado
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criar Tenant */}
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

// Componentes auxiliares
function MetricCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  subtitle?: string;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: 'green' | 'blue' | 'red' | 'gray';
}) {
  const colors = {
    green: 'bg-green-100 text-green-800 border-green-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-sm">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ATIVO: 'bg-green-100 text-green-800',
    TRIAL: 'bg-blue-100 text-blue-800',
    SUSPENSO: 'bg-red-100 text-red-800',
    INATIVO: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.INATIVO}`}
    >
      {status}
    </span>
  );
}

function PlanBadge({ plano }: { plano: string }) {
  const styles: Record<string, string> = {
    FREE: 'bg-gray-100 text-gray-800',
    BASIC: 'bg-blue-100 text-blue-800',
    PRO: 'bg-purple-100 text-purple-800',
    ENTERPRISE: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${styles[plano] || styles.FREE}`}
    >
      {plano}
    </span>
  );
}

// Modal de Criar Tenant
function CreateTenantModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugSuggestions, setSlugSuggestions] = useState<string[]>([]);
  const [formData, setFormData] = useState<CreateTenantDto>({
    nome: '',
    slug: '',
    plano: 'FREE',
    nomeFantasia: '',
    adminNome: '',
    adminEmail: '',
    adminSenha: '',
  });

  // Gerar slug automaticamente
  useEffect(() => {
    if (formData.nome && !formData.slug) {
      const slug = formData.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.nome]);

  // Verificar disponibilidade do slug
  useEffect(() => {
    const checkSlug = async () => {
      if (formData.slug.length >= 3) {
        try {
          const result = await superAdminService.checkSlugAvailability(formData.slug);
          setSlugAvailable(result.available);
          setSlugSuggestions(result.suggestions);
        } catch {
          setSlugAvailable(null);
        }
      } else {
        setSlugAvailable(null);
      }
    };

    const timeout = setTimeout(checkSlug, 500);
    return () => clearTimeout(timeout);
  }, [formData.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!slugAvailable) {
      setError('Slug não disponível');
      return;
    }

    try {
      setLoading(true);
      const result = await superAdminService.createTenant({
        ...formData,
        nomeFantasia: formData.nomeFantasia || formData.nome,
      });
      
      alert(
        `✅ Tenant criado com sucesso!\n\n` +
        `Nome: ${result.tenant.nome}\n` +
        `Slug: ${result.tenant.slug}\n` +
        `Admin: ${result.credenciais.email}\n` +
        `Senha: ${result.credenciais.senhaTemporaria}\n\n` +
        `${result.ambientes.length} ambientes e ${result.mesas.length} mesas criados.`
      );
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar tenant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Criar Novo Tenant</h2>
          <p className="text-sm text-gray-600">
            Preencha os dados para criar um novo bar na plataforma
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
          )}

          {/* Dados do Tenant */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Dados do Estabelecimento</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Bar *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Bar do Zé"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value.toLowerCase() })
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      slugAvailable === true
                        ? 'border-green-500'
                        : slugAvailable === false
                        ? 'border-red-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="bar-do-ze"
                  />
                  {slugAvailable !== null && (
                    <span
                      className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
                        slugAvailable ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {slugAvailable ? '✓ Disponível' : '✗ Indisponível'}
                    </span>
                  )}
                </div>
                {slugSuggestions.length > 0 && !slugAvailable && (
                  <div className="mt-1 text-sm text-gray-500">
                    Sugestões:{' '}
                    {slugSuggestions.map((s, i) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData({ ...formData, slug: s })}
                        className="text-blue-600 hover:underline"
                      >
                        {s}
                        {i < slugSuggestions.length - 1 ? ', ' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={formData.nomeFantasia}
                  onChange={(e) =>
                    setFormData({ ...formData, nomeFantasia: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Bar do Zé"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plano
                </label>
                <select
                  value={formData.plano}
                  onChange={(e) =>
                    setFormData({ ...formData, plano: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FREE">FREE - Gratuito</option>
                  <option value="BASIC">BASIC - R$ 99/mês</option>
                  <option value="PRO">PRO - R$ 199/mês</option>
                  <option value="ENTERPRISE">ENTERPRISE - R$ 499/mês</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={formData.cnpj || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, cnpj: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="00.000.000/0001-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={formData.telefone || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, telefone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Dados do Admin */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Administrador Inicial</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Admin *
              </label>
              <input
                type="text"
                required
                value={formData.adminNome}
                onChange={(e) =>
                  setFormData({ ...formData, adminNome: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="José Silva"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email do Admin *
                </label>
                <input
                  type="email"
                  required
                  value={formData.adminEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, adminEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@bar.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha Inicial *
                </label>
                <input
                  type="text"
                  required
                  minLength={8}
                  value={formData.adminSenha}
                  onChange={(e) =>
                    setFormData({ ...formData, adminSenha: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !slugAvailable}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar Tenant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
