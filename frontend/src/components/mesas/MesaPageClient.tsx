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
import MesasTable from './MesasTable';
import MesaFormDialog from './MesaFormDialog';

export default function MesaPageClient() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // NOVO: Estado para guardar a mesa que será editada
  const [mesaToEdit, setMesaToEdit] = useState<Mesa | null>(null);

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

  const handleOpenCreateDialog = () => {
    setMesaToEdit(null); // Garante que não há dados de edição
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (mesa: Mesa) => {
    setMesaToEdit(mesa);
    setIsDialogOpen(true);
  };

  // Handler de sucesso genérico que trata tanto criação quanto edição
  const handleSuccess = (resultMesa: Mesa) => {
    if (mesaToEdit) {
      // Se estávamos editando, atualizamos o item na lista
      setMesas(current => 
        current.map(m => (m.id === resultMesa.id ? resultMesa : m))
      );
    } else {
      // Se estávamos criando, adicionamos no topo da lista
      setMesas(current => [resultMesa, ...current]);
    }
    setIsDialogOpen(false);
    setMesaToEdit(null); // Limpa o estado de edição
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
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
    // Passamos a nova função onEdit para a tabela
    return <MesasTable mesas={mesas} onEdit={handleOpenEditDialog} />;
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
        <Button onClick={handleOpenCreateDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Nova
        </Button>
      </div>

      {renderContent()}

      {/* Passamos a mesa a ser editada para o formulário */}
      <MesaFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleSuccess}
        mesaToEdit={mesaToEdit}
      />
    </div>
  );
}