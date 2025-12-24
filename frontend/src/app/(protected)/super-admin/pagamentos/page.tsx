'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import paymentService, { PaymentConfig, PaymentGateway } from '@/services/paymentService';
import {
  CreditCard,
  Settings,
  Check,
  X,
  Eye,
  EyeOff,
  Save,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Shield,
  TestTube,
  Globe,
} from 'lucide-react';
import Link from 'next/link';

const GATEWAY_INFO: Record<PaymentGateway, { name: string; color: string; docs: string }> = {
  [PaymentGateway.MERCADO_PAGO]: {
    name: 'Mercado Pago',
    color: 'bg-blue-500',
    docs: 'https://www.mercadopago.com.br/developers/pt/docs',
  },
  [PaymentGateway.PAGSEGURO]: {
    name: 'PagSeguro',
    color: 'bg-green-500',
    docs: 'https://dev.pagbank.uol.com.br/reference',
  },
  [PaymentGateway.PICPAY]: {
    name: 'PicPay',
    color: 'bg-emerald-500',
    docs: 'https://studio.picpay.com/produtos/e-commerce/checkout',
  },
};

export default function PaymentConfigPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<PaymentGateway | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [editingConfig, setEditingConfig] = useState<Partial<PaymentConfig> | null>(null);

  // Verificar se é SUPER_ADMIN
  useEffect(() => {
    if (user && user.cargo !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getAllConfigs();
      setConfigs(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (gateway: PaymentGateway) => {
    if (!editingConfig) return;

    try {
      setSaving(gateway);
      setError(null);
      
      const updated = await paymentService.updateConfig(gateway, editingConfig);
      
      setConfigs(prev => prev.map(c => c.gateway === gateway ? updated : c));
      setEditingConfig(null);
      setSuccess(`Configuração do ${GATEWAY_INFO[gateway].name} salva com sucesso!`);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar configuração');
    } finally {
      setSaving(null);
    }
  };

  const handleToggleEnabled = async (config: PaymentConfig) => {
    try {
      setSaving(config.gateway);
      const updated = await paymentService.updateConfig(config.gateway, {
        enabled: !config.enabled,
      });
      setConfigs(prev => prev.map(c => c.gateway === config.gateway ? updated : c));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar status');
    } finally {
      setSaving(null);
    }
  };

  const handleToggleSandbox = async (config: PaymentConfig) => {
    try {
      setSaving(config.gateway);
      const updated = await paymentService.updateConfig(config.gateway, {
        sandbox: !config.sandbox,
      });
      setConfigs(prev => prev.map(c => c.gateway === config.gateway ? updated : c));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar modo');
    } finally {
      setSaving(null);
    }
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (user?.cargo !== 'SUPER_ADMIN') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/super-admin" 
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar ao Super Admin
        </Link>
        
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Gateways de Pagamento</h1>
        </div>
        <p className="text-gray-600">
          Configure os gateways de pagamento para receber pagamentos dos tenants.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <Check className="h-5 w-5 text-green-500" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Gateway Cards */}
      <div className="space-y-6">
        {configs.map((config) => {
          const info = GATEWAY_INFO[config.gateway];
          const isEditing = editingConfig?.gateway === config.gateway;

          return (
            <div
              key={config.gateway}
              className="bg-white rounded-xl border shadow-sm overflow-hidden"
            >
              {/* Header */}
              <div className={`${info.color} px-6 py-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt={info.name} className="h-8 bg-white rounded p-1" />
                  ) : (
                    <CreditCard className="h-8 w-8 text-white" />
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">{info.name}</h2>
                    <a
                      href={info.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/80 text-sm hover:text-white"
                    >
                      Ver documentação →
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Sandbox Toggle */}
                  <button
                    onClick={() => handleToggleSandbox(config)}
                    disabled={saving === config.gateway}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      config.sandbox
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-green-400 text-green-900'
                    }`}
                  >
                    {config.sandbox ? (
                      <>
                        <TestTube className="h-4 w-4" />
                        Sandbox
                      </>
                    ) : (
                      <>
                        <Globe className="h-4 w-4" />
                        Produção
                      </>
                    )}
                  </button>

                  {/* Enabled Toggle */}
                  <button
                    onClick={() => handleToggleEnabled(config)}
                    disabled={saving === config.gateway}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                      config.enabled
                        ? 'bg-white text-green-600'
                        : 'bg-white/20 text-white'
                    }`}
                  >
                    {saving === config.gateway ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : config.enabled ? (
                      <>
                        <Check className="h-4 w-4" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        Inativo
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Public Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Public Key
                      </label>
                      <input
                        type="text"
                        value={editingConfig.publicKey || ''}
                        onChange={(e) =>
                          setEditingConfig({ ...editingConfig, publicKey: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Chave pública do gateway"
                      />
                    </div>

                    {/* Access Token */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Access Token
                      </label>
                      <div className="relative">
                        <input
                          type={showSecrets[`${config.gateway}-token`] ? 'text' : 'password'}
                          value={editingConfig.accessToken || ''}
                          onChange={(e) =>
                            setEditingConfig({ ...editingConfig, accessToken: e.target.value })
                          }
                          className="w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Token de acesso"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowSecret(`${config.gateway}-token`)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showSecrets[`${config.gateway}-token`] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Secret Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Secret Key
                      </label>
                      <div className="relative">
                        <input
                          type={showSecrets[`${config.gateway}-secret`] ? 'text' : 'password'}
                          value={editingConfig.secretKey || ''}
                          onChange={(e) =>
                            setEditingConfig({ ...editingConfig, secretKey: e.target.value })
                          }
                          className="w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Chave secreta"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowSecret(`${config.gateway}-secret`)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showSecrets[`${config.gateway}-secret`] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Webhook Secret */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Webhook Secret (opcional)
                      </label>
                      <input
                        type="text"
                        value={editingConfig.webhookSecret || ''}
                        onChange={(e) =>
                          setEditingConfig({ ...editingConfig, webhookSecret: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Secret para validar webhooks"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => handleSave(config.gateway)}
                        disabled={saving === config.gateway}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                      >
                        {saving === config.gateway ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingConfig(null)}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Status Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Public Key</p>
                        <p className="font-mono text-sm truncate">
                          {config.publicKey ? '••••••••' + config.publicKey.slice(-4) : '-'}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Access Token</p>
                        <p className="font-mono text-sm truncate">
                          {config.accessToken ? '••••••••' + config.accessToken.slice(-4) : '-'}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Secret Key</p>
                        <p className="font-mono text-sm truncate">
                          {config.secretKey ? '••••••••' : '-'}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Webhook URL</p>
                        <p className="font-mono text-xs truncate text-blue-600">
                          /payments/webhooks/{config.gateway}
                        </p>
                      </div>
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={() => setEditingConfig({ ...config })}
                      className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
                    >
                      <Settings className="h-4 w-4" />
                      Configurar Credenciais
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Notice */}
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800">Segurança</h3>
            <p className="text-sm text-yellow-700 mt-1">
              As credenciais são armazenadas de forma segura no banco de dados.
              Nunca compartilhe suas chaves de API. Use o modo Sandbox para testes
              antes de ativar o modo Produção.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
