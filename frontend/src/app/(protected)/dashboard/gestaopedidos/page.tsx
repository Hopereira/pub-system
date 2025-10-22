'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { isGerencialRole, isPreparoRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';

// Views específicas por role
import SupervisaoPedidos from './SupervisaoPedidos';
import PreparoPedidos from './PreparoPedidos';
import MapaPedidos from './MapaPedidos';

/**
 * Rota Unificada Inteligente para Gestão de Pedidos
 * 
 * - ADMIN/GERENTE: Visão de supervisão completa com filtros avançados
 * - GARÇOM: Mapa visual das mesas mostrando onde entregar pedidos
 * - COZINHEIRO: Kanban board com seletor de ambiente dinâmico
 * 
 * Os ambientes são criados dinamicamente pelo admin conforme necessidade
 */
export default function PedidosPage() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Loading state
  if (isLoading || !mounted) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Não autenticado (não deveria acontecer devido ao AuthGuard)
  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Usuário não autenticado</p>
          <p className="text-sm text-muted-foreground">
            Faça login novamente para acessar esta página
          </p>
        </div>
      </div>
    );
  }

  // Renderiza view apropriada baseada no role
  if (isGerencialRole(user)) {
    return <SupervisaoPedidos />;
  }

  if (user.role === 'GARCOM') {
    return <MapaPedidos />;
  }

  if (isPreparoRole(user)) {
    return <PreparoPedidos ambienteIdInicial={user.ambienteId} />;
  }

  // Role não tem acesso (CAIXA)
  return (
    <div className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="text-center space-y-4">
        <p className="text-destructive font-medium">Acesso não autorizado</p>
        <p className="text-sm text-muted-foreground">
          Seu perfil ({user.role}) não tem permissão para acessar esta página
        </p>
      </div>
    </div>
  );
}
