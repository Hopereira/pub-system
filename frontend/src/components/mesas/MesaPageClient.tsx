// Caminho: frontend/src/components/mesas/MesaPageClient.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

import { Mesa } from '@/types/mesa';
import { getMesas } from '@/services/mesaService';
import MesasTable from './MesasTable'; // NOVO: Importamos a nossa tabela

export default function MesaPageClient() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMesas = async () => {
      try {
        setIsLoading(true);
        const data = await getMesas();
        setMesas(data);
      } catch (err) {
        setError('Não foi possível carregar a lista de mesas.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMesas();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Erro!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    // ATUALIZADO: Renderizamos o componente MesasTable com os dados buscados
    return <MesasTable mesas={mesas} />;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Mesas</h1>
          <p className="text-muted-foreground">
            Crie, edite e remova as mesas do seu estabelecimento.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Nova
        </Button>
      </div>
      {renderContent()}
    </div>
  );
}