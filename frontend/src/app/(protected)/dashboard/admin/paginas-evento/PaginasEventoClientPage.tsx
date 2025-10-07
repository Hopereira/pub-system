// Caminho: frontend/src/app/(protected)/dashboard/admin/paginas-evento/PaginasEventoClientPage.tsx
'use client';

import { useState } from 'react';
import { PaginaEvento } from '@/types/pagina-evento';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
// CORREÇÃO: Importamos a função renomeada 'createColumns'
import { createColumns } from './columns';
import { getPaginasEvento } from '@/services/paginaEventoService';
import PaginaEventoFormDialog from '@/components/paginas-evento/PaginaEventoFormDialog';
import { PaginaEventoDeleteAlert } from '@/components/paginas-evento/PaginaEventoDeleteAlert';
import PaginaEventoUploadDialog from '@/components/paginas-evento/PaginaEventoUploadDialog';

interface PaginasEventoClientPageProps {
  paginasIniciais: PaginaEvento[] | null | undefined;
}

export function PaginasEventoClientPage({ paginasIniciais }: PaginasEventoClientPageProps) {
  const [paginas, setPaginas] = useState(paginasIniciais || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paginaToEdit, setPaginaToEdit] = useState<PaginaEvento | null>(null);
  const [paginaToDelete, setPaginaToDelete] = useState<PaginaEvento | null>(null);
  const [paginaToUpload, setPaginaToUpload] = useState<PaginaEvento | null>(null);

  const handleSuccess = async () => {
    try {
      const paginasAtualizadas = await getPaginasEvento();
      setPaginas(paginasAtualizadas || []);
      setIsModalOpen(false);
      setPaginaToEdit(null);
      setPaginaToDelete(null); 
      setPaginaToUpload(null);
    } catch (error) {
      console.error('Erro ao recarregar os dados:', error);
      setPaginas([]);
    }
  };

  const handleEdit = (pagina: PaginaEvento) => {
    setPaginaToEdit(pagina);
    setIsModalOpen(true);
  };
  
  const handleUploadMedia = (pagina: PaginaEvento) => {
    setPaginaToUpload(pagina);
  };
  
  const handleCloseUpload = () => {
    setPaginaToUpload(null);
  };

  const handleDelete = (pagina: PaginaEvento) => {
    setPaginaToDelete(pagina);
  };
  
  const handleCloseDeleteAlert = () => {
    setPaginaToDelete(null);
  };

  const handleAddNew = () => {
    setPaginaToEdit(null);
    setIsModalOpen(true);
  };

  // CORREÇÃO: Chamamos a nova função 'createColumns'
  const tableColumns = createColumns({ 
    onEdit: handleEdit, 
    onDelete: handleDelete, 
    onUploadMedia: handleUploadMedia, 
  });

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
        onOpenChange={handleCloseUpload}
        onSuccess={handleSuccess}
        paginaToUpload={paginaToUpload}
      />
    </div>
  );
}