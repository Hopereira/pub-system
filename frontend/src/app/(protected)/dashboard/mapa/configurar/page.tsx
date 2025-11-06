'use client';

import { ConfiguradorMapa } from '@/components/mapa/ConfiguradorMapa';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConfigurarMapaPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Pegar ambienteId do usuário autenticado
  const ambienteId = user?.ambienteId || '';

  // Mostrar loading enquanto carrega usuário
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  // Validar se tem ambienteId
  if (!ambienteId) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800">Ambiente não encontrado</h2>
          <p className="text-yellow-700 mt-2">
            Seu usuário não está associado a nenhum ambiente. Entre em contato com o administrador.
          </p>
          <Button 
            onClick={() => router.push('/dashboard')} 
            className="mt-4"
            variant="outline"
          >
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'GERENTE']}>
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Configurar Mapa</h1>
              <p className="text-muted-foreground">
                Arraste mesas e pontos para organizar o layout
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/operacional/mesas')}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Mapa Operacional
          </Button>
        </div>

        {/* Configurador */}
        <ConfiguradorMapa ambienteId={ambienteId} />
      </div>
    </RoleGuard>
  );
}
