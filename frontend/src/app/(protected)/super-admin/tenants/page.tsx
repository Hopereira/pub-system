'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import superAdminService, { TenantSummary } from '@/services/superAdminService';
import {
  Building2,
  Search,
  Plus,
  MoreVertical,
  Ban,
  CheckCircle,
  ArrowUpCircle,
  Eye,
  RefreshCw,
  Loader2,
  Filter,
} from 'lucide-react';

export default function TenantsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlano, setFilterPlano] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState(false);

  // Verificar se é SUPER_ADMIN
  useEffect(() => {
    if (user && user.cargo !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Carregar dados
  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await superAdminService.listTenants();
      setTenants(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar tenants');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar tenants
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch = 
      t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesPlano = filterPlano === 'all' || t.plano === filterPlano;
    return matchesSearch && matchesStatus && matchesPlano;
  });

  // Suspender tenant
  const handleSuspend = async (tenant: TenantSummary) => {
    const motivo = prompt('Motivo da suspensão:');
    if (!motivo) return;

    try {
      setActionLoading(true);
      await superAdminService.suspendTenant(tenant.id, motivo);
      await loadTenants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao suspender tenant');
    } finally {
      setActionLoading(false);
    }
  };

  // Reativar tenant
  const handleReactivate = async (tenant: TenantSummary) => {
    if (!confirm(`Reativar ${tenant.nome}?`)) return;

    try {
      setActionLoading(true);
      await superAdminService.reactivateTenant(tenant.id);
      await loadTenants();
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
      `Plano atual: ${tenant.plano}\nNovo plano (${planos.join(', ')}):`
    );
    if (!novoPlano || !planos.includes(novoPlano.toUpperCase())) return;

    try {
      setActionLoading(true);
      await superAdminService.changePlan(tenant.id, novoPlano.toUpperCase() as any);
      await loadTenants();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao alterar plano');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ATIVO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      SUSPENSO: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      TRIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getPlanoBadge = (plano: string) => {
    const styles: Record<string, string> = {
      FREE: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      BASIC: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      PRO: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      ENTERPRISE: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    };
    return styles[plano] || 'bg-gray-100 text-gray-800';
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
            <Building2 className="h-6 w-6" />
            Gestão de Empresas (Tenants)
          </h1>
          <p className="text-muted-foreground">
            Gerencie todos os estabelecimentos cadastrados na plataforma
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadTenants}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={() => router.push('/super-admin')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Novo Tenant
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="all">Todos os Status</option>
            <option value="ATIVO">Ativo</option>
            <option value="SUSPENSO">Suspenso</option>
            <option value="TRIAL">Trial</option>
          </select>
          <select
            value={filterPlano}
            onChange={(e) => setFilterPlano(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="all">Todos os Planos</option>
            <option value="FREE">Free</option>
            <option value="BASIC">Basic</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                Empresa
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                Slug
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                Plano
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                Funcionários
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                Mesas
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300">
                Criado em
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-600 dark:text-gray-300">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {filteredTenants.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Nenhum tenant encontrado
                </td>
              </tr>
            ) : (
              filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{tenant.nome}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {tenant.slug}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(tenant.status)}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPlanoBadge(tenant.plano)}`}>
                      {tenant.plano}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{tenant.funcionarios}</td>
                  <td className="px-4 py-3 text-sm">{tenant.mesas}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(tenant.criadoEm).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleChangePlan(tenant)}
                        disabled={actionLoading}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                        title="Alterar Plano"
                      >
                        <ArrowUpCircle className="h-4 w-4 text-purple-600" />
                      </button>
                      {tenant.status === 'ATIVO' ? (
                        <button
                          onClick={() => handleSuspend(tenant)}
                          disabled={actionLoading}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                          title="Suspender"
                        >
                          <Ban className="h-4 w-4 text-red-600" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(tenant)}
                          disabled={actionLoading}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                          title="Reativar"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Resumo */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Mostrando {filteredTenants.length} de {tenants.length} tenants
      </div>
    </div>
  );
}
