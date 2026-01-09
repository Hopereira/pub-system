'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se não estiver a carregar e não houver usuário, redireciona para o login
    if (!isLoading && !user) {
      router.push('/');
      return;
    }

    // Redirecionar CAIXA para área correta se tentar acessar dashboard admin
    if (!isLoading && user) {
      const cargo = (user as any).cargo || (user as any).role;
      
      // Se CAIXA está tentando acessar dashboard admin, redireciona para /caixa
      if (cargo === 'CAIXA' && pathname?.startsWith('/dashboard')) {
        router.push('/caixa');
        return;
      }
    }
  }, [user, isLoading, router, pathname]);

  // Enquanto carrega os dados do usuário, não mostra nada para evitar "piscar" a tela
  if (isLoading || !user) {
    return null; // Ou um componente de "Loading..."
  }

  // Se estiver tudo certo (carregado e com usuário), mostra o conteúdo da página
  return <>{children}</>;
}