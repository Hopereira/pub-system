'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se não estiver a carregar e não houver usuário, redireciona para o login
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Enquanto carrega os dados do usuário, não mostra nada para evitar "piscar" a tela
  if (isLoading || !user) {
    return null; // Ou um componente de "Loading..."
  }

  // Se estiver tudo certo (carregado e com usuário), mostra o conteúdo da página
  return <>{children}</>;
}