"use client";

import { useState } from "react";
// O useRouter não é mais necessário aqui para o redirect de login
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

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("admin@admin.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Agora apenas chamamos a função login. O contexto cuida do resto!
      await login({ email, senha: password });
      console.log("Login bem-sucedido! O contexto está a redirecionar...");
    } catch (err) {
      setError("Credenciais inválidas. Verifique seu email e senha.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // O JSX (a parte visual) permanece exatamente o mesmo
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