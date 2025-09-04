// Caminho: frontend/src/components/mesas/MapaMesasClient.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

import { Mesa } from '@/types/mesa';
import { getMesas } from '@/services/mesaService';
import MesaCard from './MesaCard'; // Importamos nosso novo Card

export default function MapaMesasClient() {
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
        setError('Não foi possível carregar o mapa de mesas.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMesas();
  }, []);

  const handleMesaClick = (mesa: Mesa) => {
    // Lógica para abrir a mesa será adicionada no próximo passo
    console.log(`Mesa clicada: ${mesa.numero}, Status: ${mesa.status}`);
    if (mesa.status === 'LIVRE') {
        alert(`Abrindo a mesa ${mesa.numero}...`);
    } else {
        alert(`Indo para os detalhes da comanda da mesa ${mesa.numero}...`);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      // Skeleton para a grade de cartões
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {Array.from({ length: 12 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
            ))}
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
    
    // Renderiza a grade de cartões de mesa
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {mesas.map((mesa) => (
                <MesaCard key={mesa.id} mesa={mesa} onClick={handleMesaClick} />
            ))}
        </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Mapa de Mesas</h1>
          <p className="text-muted-foreground">
            Selecione uma mesa para iniciar ou continuar um atendimento.
          </p>
      </div>
      {renderContent()}
    </div>
  );
}