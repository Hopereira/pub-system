"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login"); // Redireciona para o login após sair
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Esta página só pode ser vista por usuários autenticados.
        </p>
        <Button onClick={handleLogout} className="mt-6">
          Sair
        </Button>
      </div>
    </main>
  );
}