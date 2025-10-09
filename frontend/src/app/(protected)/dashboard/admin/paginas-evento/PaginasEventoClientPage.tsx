// Caminho: frontend/src/app/(protected)/dashboard/admin/paginas-evento/PaginasEventoClientPage.tsx
'use client';

import { useState, useEffect } from 'react';
import { PaginaEvento } from '@/types/pagina-evento';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './columns';
import { getPaginasEvento } from '@/services/paginaEventoService';
import PaginaEventoFormDialog from '@/components/paginas-evento/PaginaEventoFormDialog';
import { PaginaEventoDeleteAlert } from '@/components/paginas-evento/PaginaEventoDeleteAlert';
import PaginaEventoUploadDialog from '@/components/paginas-evento/PaginaEventoUploadDialog';
import { toast } from 'sonner';

// O componente não recebe mais props com dados iniciais
export function PaginasEventoClientPage() {
  const [paginas, setPaginas] = useState<PaginaEvento[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Estado para controlar o carregamento inicial

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paginaToEdit, setPaginaToEdit] = useState<PaginaEvento | null>(null);
  const [paginaToDelete, setPaginaToDelete] = useState<PaginaEvento | null>(null);
  const [paginaToUpload, setPaginaToUpload] = useState<PaginaEvento | null>(null);

  // Função centralizada para carregar/recarregar os dados
  const carregarPaginas = async () => {
    setIsLoading(true); // Mostra o loading sempre que for recarregar
    try {
      // Esta chamada funciona pois é feita no cliente (navegador).
      // O 'api.ts' injetará o token do localStorage automaticamente.
      const paginasAtualizadas = await getPaginasEvento();
      setPaginas(paginasAtualizadas || []);
    } catch (error) {
      toast.error('Falha ao carregar a lista de páginas.');
      console.error('Erro ao carregar os dados:', error);
    } finally {
      setIsLoading(false); // Esconde o loading ao finalizar
    }
  };

  // useEffect para buscar os dados iniciais assim que o componente for montado
  useEffect(() => {
    carregarPaginas();
  }, []); // O array vazio [] garante que isso só rode uma vez na inicialização

  // Função chamada após qualquer operação de sucesso (criar, editar, deletar)
  const handleSuccess = () => {
    setIsModalOpen(false);
    setPaginaToEdit(null);
    setPaginaToDelete(null); 
    setPaginaToUpload(null);
    carregarPaginas(); // Apenas recarrega os dados
  };

  const handleEdit = (pagina: PaginaEvento) => { setPaginaToEdit(pagina); setIsModalOpen(true); };
  const handleUploadMedia = (pagina: PaginaEvento) => { setPaginaToUpload(pagina); };
  const handleDelete = (pagina: PaginaEvento) => { setPaginaToDelete(pagina); };
  const handleAddNew = () => { setPaginaToEdit(null); setIsModalOpen(true); };

  const tableColumns = createColumns({ 
    onEdit: handleEdit, 
    onDelete: handleDelete, 
    onUploadMedia: handleUploadMedia, 
  });

  if (isLoading && paginas.length === 0) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin mr-2"/>
            Carregando páginas de boas-vindas...
        </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Páginas de Boas-Vindas</h1>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Nova Página
        </Button>
      </div>

      <DataTable columns={tableColumns} data={paginas} />

      <PaginaEventoFormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={handleSuccess}
        paginaToEdit={paginaToEdit}
      />
      
      <PaginaEventoDeleteAlert
        paginaToDelete={paginaToDelete}
        onClose={() => setPaginaToDelete(null)}
        onSuccess={handleSuccess}
      />
      
      <PaginaEventoUploadDialog
        open={!!paginaToUpload}
        onOpenChange={() => setPaginaToUpload(null)}
        onSuccess={handleSuccess}
        paginaToUpload={paginaToUpload}
      />
    </div>
  );
}