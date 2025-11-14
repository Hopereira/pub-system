'use client';

import { ConfiguradorMapa } from '@/components/mapa/ConfiguradorMapa';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAmbientes, AmbienteData } from '@/services/ambienteService';

export default function ConfigurarMapaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ambienteId = searchParams.get('ambienteId');
  
  const [ambiente, setAmbiente] = useState<AmbienteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const carregarAmbiente = async () => {
      if (!ambienteId) {
        setIsLoading(false);
        return;
      }

      try {
        const ambientes = await getAmbientes();
        const ambienteEncontrado = ambientes.find(a => a.id === ambienteId);
        setAmbiente(ambienteEncontrado || null);
      } catch (error) {
        console.error('Erro ao carregar ambiente:', error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarAmbiente();
  }, [ambienteId]);

  // Mostrar loading enquanto carrega
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  // Validar se tem ambienteId
  if (!ambienteId || !ambiente) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800">Ambiente não encontrado</h2>
          <p className="text-yellow-700 mt-2">
            Selecione um ambiente para configurar o layout.
          </p>
          <Button 
            onClick={() => router.push('/dashboard/admin/ambientes')} 
            className="mt-4"
            variant="outline"
          >
            Ir para Ambientes
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
              onClick={() => router.push('/dashboard/admin/ambientes')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Configurar Layout: {ambiente.nome}</h1>
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
