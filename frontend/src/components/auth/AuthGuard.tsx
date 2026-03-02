'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Páginas do dashboard que CAIXA pode acessar
const CAIXA_ALLOWED_PATHS = [
  '/dashboard/operacional/caixa',  // Terminal de caixa
  '/dashboard/comandas',           // Lista e detalhes de comandas
  '/dashboard/pedidos',            // Gestão de pedidos
];

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

    // Redirecionar CAIXA para área correta se tentar acessar páginas admin não permitidas
    if (!isLoading && user && pathname) {
      const cargo = (user as any).cargo || (user as any).role;
      
      // Se CAIXA está tentando acessar dashboard
      if (cargo === 'CAIXA' && pathname.startsWith('/dashboard')) {
        // Verificar se é uma página permitida
        const isAllowed = CAIXA_ALLOWED_PATHS.some(allowed => pathname.startsWith(allowed));
        
        // Se não é permitida, redireciona para a home do caixa
        if (!isAllowed) {
          router.push('/caixa');
          return;
        }
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