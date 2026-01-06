'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Beer, ArrowLeft } from 'lucide-react';

interface TenantInfo {
  id: string;
  nome: string;
  slug: string;
}

export default function TenantLoginPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [loading, setLoading] = useState(false);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  useEffect(() => {
    async function loadTenant() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/registro/tenant/${slug}`);
        if (response.ok) {
          const data = await response.json();
          setTenant(data);
          localStorage.setItem('tenant_slug', slug);
          localStorage.setItem('tenant_id', data.id);
        }
      } catch (err) {
        console.error('Erro ao carregar tenant:', err);
      } finally {
        setLoadingTenant(false);
      }
    }
    if (slug) loadTenant();
  }, [slug]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Credenciais inválidas');
      }

      const data = await response.json();
      // Usar 'authToken' para compatibilidade com AuthContext
      localStorage.setItem('authToken', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('tenant_slug', slug);
      if (tenant) localStorage.setItem('tenant_id', tenant.id);

      toast.success('Login realizado com sucesso!');
      // Redireciona para /dashboard que já tem todas as páginas funcionando
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  if (loadingTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <Card className="max-w-md w-full shadow-xl relative">
        <button
          onClick={() => router.push(`/t/${slug}`)}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <CardHeader className="text-center pt-8">
          <div className="flex justify-center mb-4">
            <Beer className="h-12 w-12 text-amber-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            {tenant?.nome || 'Login'}
          </CardTitle>
          <CardDescription>
            Digite suas credenciais para acessar
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••"
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Acessar'
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Powered by Pub System
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
