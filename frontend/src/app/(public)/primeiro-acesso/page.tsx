'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle, Sparkles, Beer } from 'lucide-react';

const PLAN_LABELS: Record<string, string> = {
  free: 'Free — Grátis',
  basic: 'Basic — R$ 49/mês',
  standard: 'Standard',
  pro: 'Pro — R$ 99/mês',
  enterprise: 'Enterprise — R$ 199/mês',
};

function PrimeiroAcessoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planoSelecionado = (searchParams.get('plano') || 'free').toLowerCase();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nomeEstabelecimento: '',
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nomeEstabelecimento.trim()) {
      newErrors.nomeEstabelecimento = 'Nome do estabelecimento é obrigatório';
    } else if (formData.nomeEstabelecimento.trim().length < 3) {
      newErrors.nomeEstabelecimento = 'Nome deve ter no mínimo 3 caracteres';
    }

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
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
          plano: planoSelecionado.toUpperCase(),
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar conta');
      }

      const result = await response.json();
      toast.success('🎉 Pub registrado com sucesso!');
      toast.info(`Acesse: ${result.dados?.urlAcesso || 'pubsystem.com.br'}`);
      
      // Aguarda 2 segundos para o usuário ver a mensagem
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      
      if (error.message.includes('já existe') || error.message.includes('já está')) {
        toast.error('Este email ou nome de estabelecimento já está em uso.');
      } else {
        toast.error(error.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Limpa o erro do campo quando o usuário começa a digitar
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Beer className="h-16 w-16 text-amber-500" />
              <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 animate-pulse"></div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
            Bem-vindo ao Pub System!
          </CardTitle>
          <CardDescription className="text-base">
            Cadastre seu estabelecimento e comece a usar.
          </CardDescription>
          {planoSelecionado !== 'free' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-full text-sm font-medium text-amber-800">
              <Sparkles className="h-3.5 w-3.5" />
              Plano selecionado: {PLAN_LABELS[planoSelecionado] || planoSelecionado}
            </div>
          )}
          <Alert className="bg-amber-50 border-amber-200">
            <CheckCircle2 className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900 font-medium">
              Você será o <strong>administrador principal</strong> do seu pub.
            </AlertDescription>
          </Alert>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome do Estabelecimento */}
            <div className="space-y-2">
              <Label htmlFor="nomeEstabelecimento" className="text-sm font-medium">
                Nome do Estabelecimento *
              </Label>
              <Input
                id="nomeEstabelecimento"
                type="text"
                required
                value={formData.nomeEstabelecimento}
                onChange={(e) => handleInputChange('nomeEstabelecimento', e.target.value)}
                placeholder="Bar do João, Pub Central, etc."
                className={errors.nomeEstabelecimento ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.nomeEstabelecimento && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.nomeEstabelecimento}
                </p>
              )}
            </div>

            {/* Nome do Admin */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium">
                Seu Nome Completo *
              </Label>
              <Input
                id="nome"
                type="text"
                required
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="João Silva"
                className={errors.nome ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.nome && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.nome}
                </p>
              )}
            </div>

            {/* E-mail */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                E-mail *
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="joao@empresa.com"
                className={errors.email ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="senha" className="text-sm font-medium">
                Senha *
              </Label>
              <Input
                id="senha"
                type="password"
                required
                minLength={6}
                value={formData.senha}
                onChange={(e) => handleInputChange('senha', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={errors.senha ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.senha && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.senha}
                </p>
              )}
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirmarSenha" className="text-sm font-medium">
                Confirmar Senha *
              </Label>
              <Input
                id="confirmarSenha"
                type="password"
                required
                value={formData.confirmarSenha}
                onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                placeholder="Digite a senha novamente"
                className={errors.confirmarSenha ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.confirmarSenha && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.confirmarSenha}
                </p>
              )}
            </div>

            {/* Botão Submit */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700" 
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando seu pub...
                </>
              ) : (
                <>
                  <Beer className="mr-2 h-4 w-4" />
                  Registrar Meu Pub
                </>
              )}
            </Button>
          </form>

          {/* Informação Adicional */}
          <Alert className="mt-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <strong>Importante:</strong> Após criar sua conta, você terá acesso total ao sistema 
              e poderá criar contas para outros funcionários (garçons, cozinheiros, caixa, etc).
            </AlertDescription>
          </Alert>

          {/* Já tem conta */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                disabled={loading}
              >
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
