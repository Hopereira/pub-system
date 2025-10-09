// Caminho: frontend/src/app/(protected)/dashboard/admin/paginas-evento/PaginasEventoClientPage.tsx
'use client';

// ✅ MUDANÇA: Importamos useEffect e Loader2 para a tela de carregamento
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

// ✅ MUDANÇA: As props foram removidas, o componente não precisa mais receber dados iniciais.
export function PaginasEventoClientPage() {
  const [paginas, setPaginas] = useState<PaginaEvento[]>([]);
  // ✅ MUDANÇA: Novo estado para controlar o carregamento inicial da lista
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paginaToEdit, setPaginaToEdit] = useState<PaginaEvento | null>(null);
  const [paginaToDelete, setPaginaToDelete] = useState<PaginaEvento | null>(null);
  const [paginaToUpload, setPaginaToUpload] = useState<PaginaEvento | null>(null);

  // ✅ MUDANÇA: Esta função agora será chamada pelo useEffect e pelo handleSuccess
  const carregarPaginas = async () => {
    try {
      // A chamada aqui funciona pois está no cliente (navegador).
      // O 'api.ts' injetará o token do localStorage automaticamente.
      const paginasAtualizadas = await getPaginasEvento();
      setPaginas(paginasAtualizadas || []);
    } catch (error) {
      toast.error('Falha ao carregar a lista de páginas.');
      console.error('Erro ao carregar os dados:', error);
      setPaginas([]);
    } finally {
        setIsLoading(false); // Garante que o loading termine
    }
  };

  // ✅ MUDANÇA: useEffect para buscar os dados assim que o componente for montado
  useEffect(() => {
    carregarPaginas();
  }, []); // O array vazio [] garante que isso só rode uma vez

  const handleSuccess = () => {
    // Apenas fechamos os modais e recarregamos a lista
    setIsModalOpen(false);
    setPaginaToEdit(null);
    setPaginaToDelete(null); 
    setPaginaToUpload(null);
    carregarPaginas();
  };

  // O resto do código continua igual
  const handleEdit = (pagina: PaginaEvento) => { setPaginaToEdit(pagina); setIsModalOpen(true); };
  const handleUploadMedia = (pagina: PaginaEvento) => { setPaginaToUpload(pagina); };
  const handleCloseUpload = () => { setPaginaToUpload(null); };
  const handleDelete = (pagina: PaginaEvento) => { setPaginaToDelete(pagina); };
  const handleCloseDeleteAlert = () => { setPaginaToDelete(null); };
  const handleAddNew = () => { setPaginaToEdit(null); setIsModalOpen(true); };

  const tableColumns = createColumns({ 
    onEdit: handleEdit, 
    onDelete: handleDelete, 
    onUploadMedia: handleUploadMedia, 
  });

  // ✅ MUDANÇA: Adicionamos uma verificação de 'isLoading'
  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin mr-2"/>
            Carregando páginas...
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
        onClose={handleCloseDeleteAlert}
        onSuccess={handleSuccess}
      />
      
      <PaginaEventoUploadDialog
        open={!!paginaToUpload}
        onOpenChange={() => setPaginaToUpload(null)} // Simplificado
        onSuccess={handleSuccess}
        paginaToUpload={paginaToUpload}
      />
    </div>
  );
}