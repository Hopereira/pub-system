// Caminho: frontend/src/components/funcionarios/FuncionarioPageClient.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

import { Funcionario } from '@/types/funcionario';
import { getFuncionarios } from '@/services/funcionarioService';
import FuncionariosTable from './FuncionariosTable';
import FuncionarioFormDialog from './FuncionarioFormDialog'; // NOVO: Importamos o formulário

export default function FuncionarioPageClient() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- NOVO: Estado para controlar a visibilidade do modal ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchFuncionarios = async () => {
      try {
        setIsLoading(true);
        const data = await getFuncionarios();
        setFuncionarios(data);
        setError(null);
      } catch (err) {
        setError('Não foi possível carregar la lista de funcionários. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFuncionarios();
  }, []);

  // --- NOVO: Handler para quando um funcionário é criado com sucesso ---
  const handleCreateSuccess = (newFuncionario: Funcionario) => {
    // Adiciona o novo funcionário no topo da lista para feedback imediato
    setFuncionarios(currentFuncionarios => [newFuncionario, ...currentFuncionarios]);
    setIsDialogOpen(false); // Fecha o modal
    // Poderíamos adicionar um "Toast" de sucesso aqui também
  };

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
    return <FuncionariosTable funcionarios={funcionarios} />;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Funcionários</h1>
          <p className="text-muted-foreground">
            Adicione, edite e remova os funcionários do seu estabelecimento.
          </p>
        </div>
        {/* NOVO: O botão agora abre o modal */}
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Novo
        </Button>
      </div>

      {renderContent()}

      {/* NOVO: Renderizamos o nosso formulário em modo controlado */}
      <FuncionarioFormDialog 
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}