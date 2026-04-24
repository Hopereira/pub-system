'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle2, AlertCircle, Beer } from 'lucide-react';

function DefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [tokenType, setTokenType] = useState('');
  const [success, setSuccess] = useState(false);
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setTokenError('Token não fornecido. Verifique o link recebido por email.');
      return;
    }

    const validate = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/senha/validar-token?token=${token}`);
        const data = await res.json();

        if (data.valid) {
          setTokenValid(true);
          setTokenType(data.type || 'RESET');
        } else {
          setTokenError(data.error || 'Token inválido ou expirado.');
        }
      } catch {
        setTokenError('Erro ao validar token. Tente novamente.');
      } finally {
        setValidating(false);
      }
    };

    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!senha) newErrors.senha = 'Senha é obrigatória';
    else if (senha.length < 6) newErrors.senha = 'Mínimo 6 caracteres';
    if (senha !== confirmarSenha) newErrors.confirmarSenha = 'As senhas não coincidem';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API_URL}/senha/definir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha: senha }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao definir senha');
      }

      setSuccess(true);
      toast.success('Senha definida com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao definir senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <Card className="max-w-md w-full shadow-2xl">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500 mb-4" />
            <p className="text-gray-500">Validando token...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="max-w-md w-full shadow-2xl">
          <CardHeader className="text-center">
            <Beer className="h-10 w-10 text-amber-500 mx-auto mb-2" />
            <CardTitle className="text-xl">Link Inválido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{tokenError}</AlertDescription>
            </Alert>
            <p className="text-sm text-gray-500 text-center">
              Se precisar de um novo link, entre em contato com o administrador ou solicite uma nova recuperação de senha.
            </p>
            <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="max-w-md w-full shadow-2xl">
          <CardHeader className="text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <CardTitle className="text-xl text-green-700">Senha Definida!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600">
              Sua senha foi {tokenType === 'SETUP' ? 'criada' : 'redefinida'} com sucesso. 
              Agora você pode fazer login.
            </p>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-black"
              onClick={() => router.push('/login')}
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <Lock className="h-10 w-10 text-amber-500" />
          </div>
          <CardTitle className="text-xl">
            {tokenType === 'SETUP' ? 'Criar Senha' : 'Redefinir Senha'}
          </CardTitle>
          <p className="text-sm text-gray-500">
            {tokenType === 'SETUP'
              ? 'Defina a senha de acesso para sua conta.'
              : 'Digite sua nova senha abaixo.'}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="senha">Nova Senha *</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => { setSenha(e.target.value); setErrors({}); }}
                placeholder="Mínimo 6 caracteres"
                className={errors.senha ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.senha && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.senha}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
              <Input
                id="confirmarSenha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => { setConfirmarSenha(e.target.value); setErrors({}); }}
                placeholder="Repita a senha"
                className={errors.confirmarSenha ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.confirmarSenha && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.confirmarSenha}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-black"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
              ) : (
                'Definir Senha'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-xs text-gray-500 hover:text-amber-600 hover:underline"
            >
              Voltar para Login
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <DefinirSenhaForm />
    </Suspense>
  );
}
