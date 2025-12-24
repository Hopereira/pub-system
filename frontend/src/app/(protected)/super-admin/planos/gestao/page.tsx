'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import planService, { Plan, FeatureInfo, CreatePlanDto, PlanLimits } from '@/services/planService';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Star,
  DollarSign,
  Users,
  Grid3X3,
  Package,
  Building2,
  Calendar,
  HardDrive,
  Crown,
  RefreshCw,
} from 'lucide-react';

const DEFAULT_LIMITS: PlanLimits = {
  maxMesas: 10,
  maxFuncionarios: 5,
  maxProdutos: 50,
  maxAmbientes: 3,
  maxEventos: 0,
  storageGB: 1,
};

export default function GestaoPlanos() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<FeatureInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      const [plansData, featuresData] = await Promise.all([
        planService.getAll(true),
        planService.getAllFeatures(),
      ]);
      setPlans(plansData);
      setFeatures(featuresData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (plan: Plan) => {
    try {
      setSaving(true);
      setError('');
      await planService.update(plan.id, {
        name: plan.name,
        description: plan.description,
        priceMonthly: Number(plan.priceMonthly),
        priceYearly: Number(plan.priceYearly),
        features: plan.features,
        limits: plan.limits,
        isActive: plan.isActive,
        isPopular: plan.isPopular,
        sortOrder: plan.sortOrder,
      });
      setSuccess('Plano atualizado com sucesso!');
      setEditingPlan(null);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Desativar o plano ${plan.name}?`)) return;
    try {
      await planService.delete(plan.id);
      setSuccess('Plano desativado');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao desativar plano');
    }
  };

  const toggleFeature = (plan: Plan, featureKey: string) => {
    const newFeatures = plan.features.includes(featureKey)
      ? plan.features.filter(f => f !== featureKey)
      : [...plan.features, featureKey];
    setEditingPlan({ ...plan, features: newFeatures });
  };

  const updateLimit = (plan: Plan, key: keyof PlanLimits, value: number) => {
    setEditingPlan({
      ...plan,
      limits: { ...plan.limits, [key]: value },
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
            <Crown className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Gestão de Planos</h1>
            <p className="text-muted-foreground">
              Configure preços, features e limites de cada plano
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Atualizar
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            Novo Plano
          </button>
        </div>
      </div>

      {/* Alertas */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="h-5 w-5" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Lista de Planos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={editingPlan?.id === plan.id ? editingPlan : plan}
              features={features}
              isEditing={editingPlan?.id === plan.id}
              saving={saving}
              onEdit={() => setEditingPlan(plan)}
              onCancel={() => setEditingPlan(null)}
              onSave={() => editingPlan && handleSave(editingPlan)}
              onDelete={() => handleDelete(plan)}
              onToggleFeature={(key) => editingPlan && toggleFeature(editingPlan, key)}
              onUpdateLimit={(key, value) => editingPlan && updateLimit(editingPlan, key, value)}
              onUpdateField={(field, value) => editingPlan && setEditingPlan({ ...editingPlan, [field]: value })}
            />
          ))}
        </div>
      )}

      {/* Modal Criar Plano */}
      {showCreateModal && (
        <CreatePlanModal
          features={features}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
            setSuccess('Plano criado com sucesso!');
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      )}
    </div>
  );
}

interface PlanCardProps {
  plan: Plan;
  features: FeatureInfo[];
  isEditing: boolean;
  saving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  onToggleFeature: (key: string) => void;
  onUpdateLimit: (key: keyof PlanLimits, value: number) => void;
  onUpdateField: (field: string, value: any) => void;
}

function PlanCard({
  plan,
  features,
  isEditing,
  saving,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onToggleFeature,
  onUpdateLimit,
  onUpdateField,
}: PlanCardProps) {
  const limitFields: { key: keyof PlanLimits; label: string; icon: any }[] = [
    { key: 'maxMesas', label: 'Mesas', icon: Grid3X3 },
    { key: 'maxFuncionarios', label: 'Funcionários', icon: Users },
    { key: 'maxProdutos', label: 'Produtos', icon: Package },
    { key: 'maxAmbientes', label: 'Ambientes', icon: Building2 },
    { key: 'maxEventos', label: 'Eventos', icon: Calendar },
    { key: 'storageGB', label: 'Storage (GB)', icon: HardDrive },
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border ${plan.isPopular ? 'border-purple-500 ring-2 ring-purple-200' : ''} ${!plan.isActive ? 'opacity-60' : ''}`}>
      {/* Header do Card */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          {plan.isPopular && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
          {isEditing ? (
            <input
              type="text"
              value={plan.name}
              onChange={(e) => onUpdateField('name', e.target.value)}
              className="text-xl font-bold bg-transparent border-b border-gray-300 focus:border-purple-500 outline-none"
            />
          ) : (
            <h3 className="text-xl font-bold">{plan.name}</h3>
          )}
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono">
            {plan.code}
          </span>
          {!plan.isActive && (
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded">
              Inativo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Cancelar"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onEdit}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 hover:bg-red-100 rounded-lg text-red-500"
                title="Desativar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="p-4 grid md:grid-cols-3 gap-6">
        {/* Preços */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            Preços
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500">Mensal</label>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">R$</span>
                  <input
                    type="number"
                    value={plan.priceMonthly}
                    onChange={(e) => onUpdateField('priceMonthly', Number(e.target.value))}
                    className="w-24 px-2 py-1 border rounded"
                    min={0}
                  />
                </div>
              ) : (
                <p className="text-lg font-bold">R$ {Number(plan.priceMonthly).toFixed(2)}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500">Anual</label>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">R$</span>
                  <input
                    type="number"
                    value={plan.priceYearly}
                    onChange={(e) => onUpdateField('priceYearly', Number(e.target.value))}
                    className="w-24 px-2 py-1 border rounded"
                    min={0}
                  />
                </div>
              ) : (
                <p className="text-lg font-bold">R$ {Number(plan.priceYearly).toFixed(2)}</p>
              )}
            </div>
            {isEditing && (
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  checked={plan.isPopular}
                  onChange={(e) => onUpdateField('isPopular', e.target.checked)}
                  id={`popular-${plan.id}`}
                />
                <label htmlFor={`popular-${plan.id}`} className="text-sm">Destacar como popular</label>
              </div>
            )}
          </div>
        </div>

        {/* Limites */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-500" />
            Limites
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {limitFields.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center gap-2">
                <Icon className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500 flex-1">{label}:</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={plan.limits[key]}
                    onChange={(e) => onUpdateLimit(key, Number(e.target.value))}
                    className="w-16 px-1 py-0.5 border rounded text-sm text-right"
                    min={-1}
                  />
                ) : (
                  <span className="font-medium text-sm">
                    {plan.limits[key] === -1 ? '∞' : plan.limits[key]}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">-1 = ilimitado</p>
        </div>

        {/* Features */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-purple-500" />
            Features ({plan.features.length})
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {features.map((feature) => {
              const isActive = plan.features.includes(feature.key);
              return (
                <div
                  key={feature.key}
                  className={`flex items-center gap-2 p-1 rounded ${isEditing ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                  onClick={() => isEditing && onToggleFeature(feature.key)}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${isActive ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}`}>
                    {isActive && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                  <span className={`text-sm ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                    {feature.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CreatePlanModalProps {
  features: FeatureInfo[];
  onClose: () => void;
  onSuccess: () => void;
}

function CreatePlanModal({ features, onClose, onSuccess }: CreatePlanModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<CreatePlanDto>({
    code: '',
    name: '',
    description: '',
    priceMonthly: 0,
    priceYearly: 0,
    features: ['pedidos', 'comandas', 'mesas', 'produtos', 'funcionarios'],
    limits: { ...DEFAULT_LIMITS },
    isActive: true,
    isPopular: false,
    sortOrder: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await planService.create({
        ...form,
        code: form.code.toUpperCase(),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar plano');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (key: string) => {
    const newFeatures = form.features.includes(key)
      ? form.features.filter(f => f !== key)
      : [...form.features, key];
    setForm({ ...form, features: newFeatures });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold">Novo Plano</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border rounded-lg uppercase"
                placeholder="STANDARD"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Standard"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Para bares em crescimento"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Preço Mensal (R$) *</label>
              <input
                type="number"
                value={form.priceMonthly}
                onChange={(e) => setForm({ ...form, priceMonthly: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min={0}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Preço Anual (R$) *</label>
              <input
                type="number"
                value={form.priceYearly}
                onChange={(e) => setForm({ ...form, priceYearly: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                min={0}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Limites</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(form.limits).map(([key, value]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 capitalize">{key.replace('max', '').replace('GB', ' (GB)')}</label>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setForm({ ...form, limits: { ...form.limits, [key]: Number(e.target.value) } })}
                    className="w-full px-2 py-1 border rounded text-sm"
                    min={-1}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Features</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
              {features.map((feature) => (
                <label key={feature.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.features.includes(feature.key)}
                    onChange={() => toggleFeature(feature.key)}
                  />
                  <span className="text-sm">{feature.label}</span>
                </label>
              ))}
            </div>
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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar Plano
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
