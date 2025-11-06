'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole, hasRole } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  redirectTo?: string;
  showAccessDenied?: boolean;
}

/**
 * Guard que verifica se o usuário tem permissão baseado no cargo/role
 * Bloqueia acesso se o usuário não tiver um dos cargos permitidos
 */
export const RoleGuard = ({
  allowedRoles,
  children,
  redirectTo,
  showAccessDenied = true,
}: RoleGuardProps) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      // Usuário não autenticado - redireciona para login
      router.push('/login');
    } else if (!isLoading && user && !hasRole(user, allowedRoles)) {
      // Usuário autenticado mas sem permissão
      if (redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [user, isLoading, allowedRoles, redirectTo, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-lg">Verificando permissões...</div>
      </div>
    );
  }

  // Usuário não autenticado
  if (!user) {
    return null; // Vai redirecionar para login
  }

  // Usuário sem permissão
  if (!hasRole(user, allowedRoles)) {
    if (!showAccessDenied) {
      return null; // Vai redirecionar se redirectTo foi fornecido
    }

    // Determina página de retorno baseada no cargo do usuário
    const getHomePage = () => {
      switch (user.cargo) {
        case 'GARCOM':
          return '/garcom';
        case 'ADMIN':
        case 'GERENTE':
          return '/dashboard';
        case 'CAIXA':
          return '/caixa';
        case 'COZINHA':
        case 'COZINHEIRO':
          return '/cozinha';
        default:
          return '/';
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <ShieldAlert className="mx-auto h-16 w-16 text-red-500" />
            <CardTitle className="text-2xl mt-4">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Você não tem permissão para acessar esta página.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Seu cargo:</strong> {user.cargo}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Cargos permitidos:</strong> {allowedRoles.join(', ')}
              </p>
            </div>
            <Button
              onClick={() => router.push(getHomePage())}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Minha Página
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Usuário tem permissão
  return <>{children}</>;
};
