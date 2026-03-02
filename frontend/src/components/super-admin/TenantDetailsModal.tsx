'use client';

import { useState, useEffect } from 'react';
import superAdminService, { TenantFuncionario, TenantDetails } from '@/services/superAdminService';
import {
  X,
  Building2,
  Users,
  Key,
  Save,
  Trash2,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  ShoppingCart,
  CreditCard,
  Calendar,
  Mail,
  User,
  Shield,
} from 'lucide-react';

interface TenantDetailsModalProps {
  tenantId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TenantDetailsModal({ tenantId, onClose, onUpdate }: TenantDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [funcionarios, setFuncionarios] = useState<TenantFuncionario[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'funcionarios' | 'senha'>('info');
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  
  // Reset password states
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [tenantData, funcionariosData] = await Promise.all([
        superAdminService.getTenantDetails(tenantId),
        superAdminService.listTenantFuncionarios(tenantId),
      ]);
      
      setTenant(tenantData);
      setFuncionarios(funcionariosData);
      setNome(tenantData.nome);
      setCnpj(tenantData.cnpj || '');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenant) return;
    
    try {
      setSaving(true);
      setError(null);
      
      await superAdminService.updateTenant(tenantId, { nome, cnpj });
      
      onUpdate();
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!novaSenha || novaSenha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (novaSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const result = await superAdminService.resetAdminPassword(tenantId, novaSenha);
      
      setResetSuccess(`Senha resetada com sucesso para: ${result.email}`);
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao resetar senha');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!tenant) return;
    
    const confirmText = prompt(`Digite "${tenant.slug}" para confirmar a DESATIVAÇÃO:`);
    if (confirmText !== tenant.slug) {
      alert('Texto de confirmação incorreto');
      return;
    }
    
    try {
      setSaving(true);
      await superAdminService.deleteTenant(tenantId);
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao deletar');
      setSaving(false);
    }
  };

  const handleHardDelete = async () => {
    if (!tenant) return;
    
    const expectedText = `DELETAR ${tenant.slug}`;
    const confirmText = prompt(`⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\nTodos os dados serão PERMANENTEMENTE removidos:\n- Funcionários\n- Comandas\n- Pedidos\n- Mesas\n- Produtos\n- Ambientes\n- Empresa\n\nDigite "${expectedText}" para confirmar:`);
    
    if (!confirmText || confirmText.trim() !== expectedText) {
      alert(`❌ Texto de confirmação incorreto.\n\nEsperado: "${expectedText}"\nDigitado: "${confirmText || '(vazio)'}"`);
      return;
    }
    
    try {
      setSaving(true);
      const result = await superAdminService.hardDeleteTenant(tenantId);
      alert(`✅ ${result.message}\n\nDados removidos:\n${JSON.stringify(result.deletedData, null, 2)}`);
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao deletar permanentemente');
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNovaSenha(password);
    setConfirmarSenha(password);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ATIVO: 'bg-green-100 text-green-800',
      SUSPENSO: 'bg-red-100 text-red-800',
      TRIAL: 'bg-yellow-100 text-yellow-800',
      INATIVO: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getCargoBadge = (cargo: string) => {
    const styles: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-800',
      GERENTE: 'bg-blue-100 text-blue-800',
      CAIXA: 'bg-green-100 text-green-800',
      GARCOM: 'bg-yellow-100 text-yellow-800',
      COZINHEIRO: 'bg-orange-100 text-orange-800',
    };
    return styles[cargo] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <p className="text-red-600">Tenant não encontrado</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-bold">{tenant.nome}</h2>
              <p className="text-sm text-gray-500">{tenant.slug}.pubsystem.com.br</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b dark:border-gray-700">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-3 font-medium ${
              activeTab === 'info'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className="h-4 w-4 inline mr-2" />
            Informações
          </button>
          <button
            onClick={() => setActiveTab('funcionarios')}
            className={`px-4 py-3 font-medium ${
              activeTab === 'funcionarios'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Funcionários ({funcionarios.length})
          </button>
          <button
            onClick={() => setActiveTab('senha')}
            className={`px-4 py-3 font-medium ${
              activeTab === 'senha'
                ? 'border-b-2 border-primary text-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Key className="h-4 w-4 inline mr-2" />
            Resetar Senha
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Tab: Informações */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <ShoppingCart className="h-4 w-4" />
                    Pedidos Hoje
                  </div>
                  <div className="text-2xl font-bold mt-1">{tenant.stats.pedidosHoje}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <CreditCard className="h-4 w-4" />
                    Comandas Abertas
                  </div>
                  <div className="text-2xl font-bold mt-1">{tenant.stats.comandasAbertas}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Users className="h-4 w-4" />
                    Funcionários
                  </div>
                  <div className="text-2xl font-bold mt-1">{tenant.stats.funcionariosAtivos}</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <ShoppingCart className="h-4 w-4" />
                    Total Pedidos
                  </div>
                  <div className="text-2xl font-bold mt-1">{tenant.stats.totalPedidos}</div>
                </div>
              </div>

              {/* Status e Plano */}
              <div className="flex gap-4">
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(tenant.status)}`}>
                    {tenant.status}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Plano:</span>
                  <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    {tenant.plano}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  Criado em: {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>

              {/* Admin Info */}
              {tenant.admin && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium text-purple-800 dark:text-purple-200 flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4" />
                    Administrador do Tenant
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Nome:</span>
                      <span className="ml-2 font-medium">{tenant.admin.nome}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <span className="ml-2 font-medium">{tenant.admin.email}</span>
                    </div>
                    {tenant.admin.telefone && (
                      <div>
                        <span className="text-gray-500">Telefone:</span>
                        <span className="ml-2 font-medium">{tenant.admin.telefone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!tenant.admin && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Nenhum administrador encontrado para este tenant</span>
                  </div>
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome da Empresa</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug (URL)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tenant.slug}
                      disabled
                      className="flex-1 px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600"
                    />
                    <button
                      onClick={() => copyToClipboard(`https://${tenant.slug}.pubsystem.com.br`)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      title="Copiar URL"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-between pt-4 border-t dark:border-gray-700">
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg"
                    title="Desativa o tenant (pode ser reativado)"
                  >
                    <Trash2 className="h-4 w-4" />
                    Desativar
                  </button>
                  <button
                    onClick={handleHardDelete}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    title="Remove permanentemente todos os dados (IRREVERSÍVEL)"
                  >
                    <Trash2 className="h-4 w-4" />
                    Deletar Permanente
                  </button>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {/* Tab: Funcionários */}
          {activeTab === 'funcionarios' && (
            <div className="space-y-4">
              {funcionarios.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum funcionário cadastrado
                </div>
              ) : (
                <div className="space-y-2">
                  {funcionarios.map((func) => (
                    <div
                      key={func.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{func.nome}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {func.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCargoBadge(func.cargo)}`}>
                          {func.cargo}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          func.status === 'ATIVO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {func.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Resetar Senha */}
          {activeTab === 'senha' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Atenção</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Esta ação irá resetar a senha do administrador principal deste tenant.
                      O admin receberá a nova senha e deverá alterá-la no primeiro acesso.
                    </p>
                  </div>
                </div>
              </div>

              {resetSuccess && (
                <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  {resetSuccess}
                </div>
              )}

              {/* Admin do tenant */}
              {funcionarios.filter(f => f.cargo === 'ADMIN').map((admin) => (
                <div key={admin.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-purple-600" />
                    <div>
                      <div className="font-medium">{admin.nome}</div>
                      <div className="text-sm text-gray-500">{admin.email}</div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nova Senha</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      onClick={generatePassword}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      title="Gerar senha aleatória"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Confirmar Senha</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Digite novamente"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
                {novaSenha && confirmarSenha && novaSenha !== confirmarSenha && (
                  <p className="text-sm text-red-600">As senhas não coincidem</p>
                )}
              </div>

              <button
                onClick={handleResetPassword}
                disabled={saving || !novaSenha || novaSenha !== confirmarSenha}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                Resetar Senha do Admin
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
