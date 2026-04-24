'use client';

import { useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Loader2, CheckCircle2, AlertCircle, Sparkles, Beer,
  Building2, MapPin, CreditCard, Check, ArrowRight, ArrowLeft,
} from 'lucide-react';

const STEPS = [
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'endereco', label: 'Endereço', icon: MapPin },
  { id: 'plano', label: 'Plano', icon: Sparkles },
  { id: 'pagamento', label: 'Pagamento', icon: CreditCard },
  { id: 'confirmacao', label: 'Confirmação', icon: Check },
] as const;

const PLANOS = [
  { code: 'FREE', name: 'Free', price: 0, desc: 'Para começar', features: ['1 ambiente', '5 mesas', '1 usuário'] },
  { code: 'BASIC', name: 'Basic', price: 49, desc: 'Pequenos bares', features: ['3 ambientes', '20 mesas', '5 usuários', 'Suporte email'] },
  { code: 'PRO', name: 'Pro', price: 99, desc: 'Bares em crescimento', popular: true, features: ['10 ambientes', '50 mesas', '20 usuários', 'Suporte prioritário', 'Analytics'] },
  { code: 'ENTERPRISE', name: 'Enterprise', price: 199, desc: 'Grandes operações', features: ['Ilimitado', 'Ilimitado', 'Ilimitado', 'Suporte 24/7', 'API dedicada'] },
];

interface FormData {
  nomeEstabelecimento: string;
  cnpj: string;
  razaoSocial: string;
  telefone: string;
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  plano: string;
}

function PrimeiroAcessoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planoQuery = (searchParams.get('plano') || 'free').toUpperCase();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    nomeEstabelecimento: '',
    cnpj: '',
    razaoSocial: '',
    telefone: '',
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    plano: planoQuery,
  });

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!formData.nomeEstabelecimento.trim()) newErrors.nomeEstabelecimento = 'Nome do estabelecimento é obrigatório';
      else if (formData.nomeEstabelecimento.trim().length < 3) newErrors.nomeEstabelecimento = 'Mínimo 3 caracteres';
      if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
      if (!formData.email.trim()) newErrors.email = 'E-mail é obrigatório';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'E-mail inválido';
      if (!formData.senha) newErrors.senha = 'Senha é obrigatória';
      else if (formData.senha.length < 6) newErrors.senha = 'Mínimo 6 caracteres';
      if (formData.senha !== formData.confirmarSenha) newErrors.confirmarSenha = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    } else {
      toast.error('Corrija os erros antes de continuar');
    }
  };

  const goBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep(0)) {
      setCurrentStep(0);
      toast.error('Corrija os erros no formulário');
      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeEstabelecimento: formData.nomeEstabelecimento,
          nomeAdmin: formData.nome,
          emailAdmin: formData.email,
          senhaAdmin: formData.senha,
          plano: formData.plano,
          cnpj: formData.cnpj || undefined,
          razaoSocial: formData.razaoSocial || undefined,
          telefone: formData.telefone || undefined,
          cep: formData.cep || undefined,
          rua: formData.rua || undefined,
          numero: formData.numero || undefined,
          complemento: formData.complemento || undefined,
          bairro: formData.bairro || undefined,
          cidade: formData.cidade || undefined,
          estado: formData.estado || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar conta');
      }

      const result = await response.json();
      toast.success('Pub registrado com sucesso!');

      const urlLogin = result.dados?.urlLogin;
      setTimeout(() => {
        if (urlLogin) window.location.href = urlLogin;
        else router.push('/login');
      }, 2000);
    } catch (error: any) {
      if (error.message?.includes('já existe') || error.message?.includes('já está')) {
        toast.error('Este email ou nome de estabelecimento já está em uso.');
      } else {
        toast.error(error.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderField = (id: string, label: string, type = 'text', placeholder = '', required = false, props: Record<string, any> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}{required && ' *'}
      </Label>
      <Input
        id={id}
        type={type}
        value={(formData as any)[id]}
        onChange={(e) => handleInputChange(id, e.target.value)}
        placeholder={placeholder}
        className={errors[id] ? 'border-red-500' : ''}
        disabled={loading}
        {...props}
      />
      {errors[id] && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {errors[id]}
        </p>
      )}
    </div>
  );

  const renderStepEmpresa = () => (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold">Dados do Estabelecimento</h3>
        <p className="text-sm text-gray-500">Informações básicas e conta do administrador</p>
      </div>
      {renderField('nomeEstabelecimento', 'Nome do Estabelecimento', 'text', 'Bar do João, Pub Central...', true)}
      <div className="grid grid-cols-2 gap-3">
        {renderField('cnpj', 'CNPJ', 'text', '00.000.000/0000-00')}
        {renderField('telefone', 'Telefone', 'tel', '(11) 99999-9999')}
      </div>
      {renderField('razaoSocial', 'Razão Social', 'text', 'Opcional')}
      <div className="border-t pt-4 mt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">Dados do Administrador</p>
        {renderField('nome', 'Nome Completo', 'text', 'João Silva', true)}
        {renderField('email', 'E-mail', 'email', 'joao@empresa.com', true)}
        <div className="grid grid-cols-2 gap-3">
          {renderField('senha', 'Senha', 'password', 'Mínimo 6 caracteres', true)}
          {renderField('confirmarSenha', 'Confirmar Senha', 'password', 'Repita a senha', true)}
        </div>
      </div>
    </div>
  );

  const renderStepEndereco = () => (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold">Endereço</h3>
        <p className="text-sm text-gray-500">Opcional — pode preencher depois</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">{renderField('cep', 'CEP', 'text', '00000-000')}</div>
        <div className="col-span-2">{renderField('rua', 'Rua / Logradouro', 'text', 'Rua das Flores')}</div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">{renderField('numero', 'Número', 'text', '123')}</div>
        <div className="col-span-2">{renderField('complemento', 'Complemento', 'text', 'Sala 1, Bloco A...')}</div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">{renderField('bairro', 'Bairro', 'text', 'Centro')}</div>
        <div className="col-span-1">{renderField('cidade', 'Cidade', 'text', 'São Paulo')}</div>
        <div className="col-span-1">{renderField('estado', 'UF', 'text', 'SP', false, { maxLength: 2 })}</div>
      </div>
    </div>
  );

  const renderStepPlano = () => (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold">Escolha seu Plano</h3>
        <p className="text-sm text-gray-500">Comece grátis e faça upgrade quando quiser</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PLANOS.map(plan => (
          <button
            key={plan.code}
            type="button"
            onClick={() => handleInputChange('plano', plan.code)}
            className={`relative p-4 rounded-xl border-2 text-left transition-all ${
              formData.plano === plan.code
                ? 'border-amber-500 bg-amber-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-2 right-2 text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold">
                POPULAR
              </span>
            )}
            <p className="font-semibold text-sm">{plan.name}</p>
            <p className="text-lg font-bold mt-1">
              {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
              {plan.price > 0 && <span className="text-xs font-normal text-gray-500">/mês</span>}
            </p>
            <p className="text-xs text-gray-500 mt-1">{plan.desc}</p>
            <ul className="mt-2 space-y-1">
              {plan.features.map(f => (
                <li key={f} className="text-xs text-gray-600 flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStepPagamento = () => {
    const selected = PLANOS.find(p => p.code === formData.plano);
    return (
      <div className="space-y-4">
        <div className="text-center mb-2">
          <h3 className="text-lg font-semibold">Pagamento</h3>
          <p className="text-sm text-gray-500">
            {selected?.price === 0
              ? 'Plano gratuito — nenhum pagamento necessário'
              : 'Integração de pagamento em breve'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          {selected?.price === 0 ? (
            <>
              <p className="text-lg font-semibold text-green-600">Plano Free Selecionado</p>
              <p className="text-sm text-gray-500 mt-1">Não é necessário informar dados de pagamento.</p>
              <p className="text-sm text-gray-500">Você pode fazer upgrade a qualquer momento.</p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-gray-600">Em breve</p>
              <p className="text-sm text-gray-500 mt-1">
                O pagamento do plano <strong>{selected?.name}</strong> (R$ {selected?.price}/mês) 
                será configurado após o cadastro.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Você terá acesso completo durante o período trial.
              </p>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderStepConfirmacao = () => {
    const selected = PLANOS.find(p => p.code === formData.plano);
    return (
      <div className="space-y-4">
        <div className="text-center mb-2">
          <h3 className="text-lg font-semibold">Confirme seus Dados</h3>
          <p className="text-sm text-gray-500">Revise antes de finalizar o cadastro</p>
        </div>
        <div className="space-y-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="font-medium text-gray-700 mb-1 flex items-center gap-1.5"><Building2 className="h-4 w-4 text-amber-500" /> Empresa</p>
            <p><strong>{formData.nomeEstabelecimento}</strong></p>
            {formData.cnpj && <p className="text-gray-500">CNPJ: {formData.cnpj}</p>}
            {formData.telefone && <p className="text-gray-500">Tel: {formData.telefone}</p>}
          </div>
          {(formData.rua || formData.cidade) && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium text-gray-700 mb-1 flex items-center gap-1.5"><MapPin className="h-4 w-4 text-amber-500" /> Endereço</p>
              <p className="text-gray-600">
                {[formData.rua, formData.numero, formData.bairro, formData.cidade, formData.estado].filter(Boolean).join(', ')}
                {formData.cep && ` — CEP: ${formData.cep}`}
              </p>
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="font-medium text-gray-700 mb-1 flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-amber-500" /> Plano</p>
            <p>{selected?.name} — {selected?.price === 0 ? 'Grátis' : `R$ ${selected?.price}/mês`}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="font-medium text-gray-700 mb-1">Administrador</p>
            <p>{formData.nome} ({formData.email})</p>
          </div>
        </div>
        <Alert className="bg-amber-50 border-amber-200">
          <CheckCircle2 className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900 text-sm">
            Ao finalizar, seu pub será criado com ambientes e mesas padrão.
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  const stepRenderers = [renderStepEmpresa, renderStepEndereco, renderStepPlano, renderStepPagamento, renderStepConfirmacao];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="max-w-lg w-full shadow-2xl">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="flex justify-center">
            <Beer className="h-10 w-10 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
            Criar Meu Pub
          </CardTitle>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-1 pt-2">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isComplete = idx < currentStep;
              return (
                <div key={step.id} className="flex items-center">
                  {idx > 0 && (
                    <div className={`w-6 h-0.5 ${isComplete ? 'bg-amber-500' : 'bg-gray-200'}`} />
                  )}
                  <button
                    type="button"
                    onClick={() => { if (isComplete) setCurrentStep(idx); }}
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-xs transition-all ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-md scale-110'
                        : isComplete
                          ? 'bg-amber-100 text-amber-700 cursor-pointer hover:bg-amber-200'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                    disabled={!isComplete && !isActive}
                    title={step.label}
                  >
                    {isComplete ? <Check className="h-3.5 w-3.5" /> : <StepIcon className="h-3.5 w-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500">
            Passo {currentStep + 1} de {STEPS.length} — {STEPS[currentStep].label}
          </p>
        </CardHeader>

        <CardContent>
          <div className="min-h-[320px]">
            {stepRenderers[currentStep]()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            {currentStep > 0 ? (
              <Button variant="outline" onClick={goBack} disabled={loading} size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
              </Button>
            ) : (
              <div />
            )}

            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={goNext}
                className="bg-amber-500 hover:bg-amber-600 text-black"
                size="sm"
              >
                Próximo <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black"
                disabled={loading}
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Registrando...
                  </>
                ) : (
                  <>
                    <Beer className="mr-1 h-4 w-4" /> Finalizar Cadastro
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Login link */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Já tem conta?{' '}
              <button type="button" onClick={() => router.push('/login')} className="text-amber-600 hover:underline font-medium">
                Fazer login
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PrimeiroAcessoPage() {
  return (
    <Suspense fallback={null}>
      <PrimeiroAcessoForm />
    </Suspense>
  );
}
