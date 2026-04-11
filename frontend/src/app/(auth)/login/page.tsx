"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { checkFirstAccess } from "@/services/firstAccessService";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [checkingFirstAccess, setCheckingFirstAccess] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Verifica se é o primeiro acesso ao carregar a página
  useEffect(() => {
    async function checkFirst() {
      try {
        const isFirst = await checkFirstAccess();
        if (isFirst) {
          router.push('/primeiro-acesso');
        }
      } catch (error) {
        console.error('Erro ao verificar primeiro acesso:', error);
      } finally {
        setCheckingFirstAccess(false);
      }
    }
    checkFirst();
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Faz login e obtém o usuário
      await login({ email, senha: password });
      
      // Decodifica o token para obter o cargo
      const token = localStorage.getItem('authToken');
      if (token && token.includes('.')) {
        try {
          const base64Payload = token.split('.')[1];
          const decodedPayload = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
          const decodedUser = JSON.parse(decodedPayload);
          const cargo = decodedUser.cargo || decodedUser.role;
          
          console.log('[Login] Cargo detectado:', cargo);
          console.log('[Login] Payload completo:', decodedUser);
          
          // Redireciona baseado no cargo (estritamente)
          switch (cargo) {
            case 'SUPER_ADMIN':
              router.push('/super-admin');
              break;
            case 'GARCOM':
              router.push('/garcom');
              break;
            case 'ADMIN':
              router.push('/dashboard');
              break;
            case 'GERENTE':
              router.push('/dashboard');
              break;
            case 'CAIXA':
              router.push('/caixa');
              break;
            case 'COZINHA':
            case 'COZINHEIRO':
              router.push('/cozinha');
              break;
            case 'BARTENDER':
              router.push('/cozinha');
              break;
            default:
              console.warn('[Login] Cargo não reconhecido:', cargo, 'redirecionando para /dashboard');
              router.push('/dashboard');
          }
        } catch (decodeErr) {
          console.error('Erro ao decodificar token:', decodeErr);
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError("Credenciais inválidas. Verifique seu email e senha.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Mostra loading enquanto verifica primeiro acesso
  if (checkingFirstAccess) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando sistema...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Digite seu email e senha para acessar o painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@admin.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Acessando...' : 'Acessar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}