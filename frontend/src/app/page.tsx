'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@admin.com');
  const [senha, setSenha] = useState('admin123');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email, senha });
      
      // Decodifica o token para obter o cargo
      const token = localStorage.getItem('authToken');
      if (token && token.includes('.')) {
        try {
          const base64Payload = token.split('.')[1];
          const decodedPayload = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
          const decodedUser = JSON.parse(decodedPayload);
          const cargo = decodedUser.cargo || decodedUser.role;
        
          // Redireciona baseado no cargo
          switch (cargo) {
            case 'GARCOM':
              router.push('/garcom');
              break;
            case 'ADMIN':
            case 'GERENTE':
              router.push('/dashboard');
              break;
            case 'CAIXA':
              router.push('/caixa');
              break;
            case 'COZINHA':
            case 'COZINHEIRO':
            case 'BARTENDER':
              router.push('/cozinha');
              break;
            default:
              router.push('/dashboard');
          }
        } catch (decodeErr) {
          console.error('Erro ao decodificar token:', decodeErr);
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao tentar fazer login.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Pub System - Login</CardTitle>
          <CardDescription>
            Insira seu email e senha para acessar o painel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <input
                id="password"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}