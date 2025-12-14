// Caminho: frontend/src/components/funcionarios/FuncionarioPageClient.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // NOVO: Importamos o AlertDialog

import { Funcionario } from '@/types/funcionario';
import { getFuncionarios, deleteFuncionario } from '@/services/funcionarioService';
import { turnoService } from '@/services/turnoService';
import FuncionariosTable from './FuncionariosTable';
import FuncionarioFormDialog from './FuncionarioFormDialog';

export default function FuncionarioPageClient() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [funcionarioToEdit, setFuncionarioToEdit] = useState<Funcionario | null>(null);

  // --- Estados para o diálogo de confirmação de exclusão ---
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [funcionarioToDelete, setFuncionarioToDelete] = useState<Funcionario | null>(null);
  const [hasTurnoAtivo, setHasTurnoAtivo] = useState(false);
  const [isCheckingTurno, setIsCheckingTurno] = useState(false);

  useEffect(() => {
    const fetchFuncionarios = async () => {
      try {
        setIsLoading(true);
        const data = await getFuncionarios();
        setFuncionarios(data);
        setError(null);
      } catch (err) {
        setError('Não foi possível carregar a lista de funcionários. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFuncionarios();
  }, []);

  const handleOpenCreateDialog = () => {
    setFuncionarioToEdit(null);
    setIsFormDialogOpen(true);
  };

  const handleOpenEditDialog = (funcionario: Funcionario) => {
    setFuncionarioToEdit(funcionario);
    setIsFormDialogOpen(true);
  };

  // --- Funções para controlar a exclusão ---
  const handleOpenDeleteDialog = async (funcionario: Funcionario) => {
    setFuncionarioToDelete(funcionario);
    setIsCheckingTurno(true);
    setHasTurnoAtivo(false);

    try {
      // Verifica se o funcionário tem turno ativo
      const turnoAtivo = await turnoService.getTurnoAtivo(funcionario.id);
      setHasTurnoAtivo(turnoAtivo !== null);
    } catch {
      // Se der erro na verificação, assume que não tem turno ativo
      setHasTurnoAtivo(false);
    } finally {
      setIsCheckingTurno(false);
      setIsConfirmOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!funcionarioToDelete) return;

    try {
      await deleteFuncionario(funcionarioToDelete.id);
      // Remove o funcionário da lista no estado para atualizar a UI
      setFuncionarios(current => current.filter(f => f.id !== funcionarioToDelete.id));
    } catch (err) {
      setError(`Erro ao excluir o funcionário ${funcionarioToDelete.nome}.`);
    } finally {
      // Limpa o estado e fecha o modal
      setIsConfirmOpen(false);
      setFuncionarioToDelete(null);
    }
  };

  const handleSuccess = (resultFuncionario: Funcionario) => {
    if (funcionarioToEdit) {
      setFuncionarios(current =>
        current.map(f => (f.id === resultFuncionario.id ? resultFuncionario : f))
      );
    } else {
      setFuncionarios(current => [resultFuncionario, ...current]);
    }
    setIsFormDialogOpen(false);
    setFuncionarioToEdit(null);
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
    // Passamos as duas funções para a tabela
    return <FuncionariosTable funcionarios={funcionarios} onEdit={handleOpenEditDialog} onDelete={handleOpenDeleteDialog} />;
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
        <Button onClick={handleOpenCreateDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Novo
        </Button>
      </div>

      {renderContent()}

      <FuncionarioFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        onSuccess={handleSuccess}
        funcionarioToEdit={funcionarioToEdit}
      />

      {/* --- Diálogo de confirmação de exclusão --- */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {hasTurnoAtivo ? '⚠️ Funcionário em Trabalho' : 'Você tem certeza?'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                {hasTurnoAtivo ? (
                  <div className="space-y-3">
                    <p>
                      O funcionário <span className="font-bold">{funcionarioToDelete?.nome}</span> está 
                      <span className="text-orange-500 font-semibold"> atualmente trabalhando</span> (turno ativo).
                    </p>
                    <p>
                      Para excluir este funcionário, é necessário que ele faça <span className="font-semibold">check-out</span> primeiro.
                    </p>
                    <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md p-3 mt-2">
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        💡 Peça ao funcionário para encerrar seu turno no aplicativo ou finalize o turno manualmente.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o funcionário 
                    <span className="font-bold"> {funcionarioToDelete?.nome}</span> e todos os seus registros associados.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFuncionarioToDelete(null)}>
              {hasTurnoAtivo ? 'Entendi' : 'Cancelar'}
            </AlertDialogCancel>
            {!hasTurnoAtivo && (
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                Confirmar Exclusão
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}