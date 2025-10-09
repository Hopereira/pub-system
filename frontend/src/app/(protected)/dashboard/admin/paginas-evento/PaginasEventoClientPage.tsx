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
// ✅ 1. Importar o nosso novo componente de modal do QR Code
import PaginaEventoQrCodeDialog from '@/components/paginas-evento/PaginaEventoQrCodeDialog';
import { toast } from 'sonner';

export function PaginasEventoClientPage() {
  const [paginas, setPaginas] = useState<PaginaEvento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paginaToEdit, setPaginaToEdit] = useState<PaginaEvento | null>(null);
  const [paginaToDelete, setPaginaToDelete] = useState<PaginaEvento | null>(null);
  const [paginaToUpload, setPaginaToUpload] = useState<PaginaEvento | null>(null);
  // ✅ 2. Adicionar um novo estado para controlar qual QR Code mostrar
  const [paginaToShowQr, setPaginaToShowQr] = useState<PaginaEvento | null>(null);

  const carregarPaginas = async () => {
    setIsLoading(true);
    try {
      const paginasAtualizadas = await getPaginasEvento();
      setPaginas(paginasAtualizadas || []);
    } catch (error) {
      toast.error('Falha ao carregar a lista de páginas.');
      console.error('Erro ao carregar os dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarPaginas();
  }, []);

  const handleSuccess = () => {
    setIsModalOpen(false);
    setPaginaToEdit(null);
    setPaginaToDelete(null); 
    setPaginaToUpload(null);
    setPaginaToShowQr(null); // ✅ Limpa também o estado do QR Code
    carregarPaginas();
  };

  const handleEdit = (pagina: PaginaEvento) => { setPaginaToEdit(pagina); setIsModalOpen(true); };
  const handleUploadMedia = (pagina: PaginaEvento) => { setPaginaToUpload(pagina); };
  const handleDelete = (pagina: PaginaEvento) => { setPaginaToDelete(pagina); };
  const handleAddNew = () => { setPaginaToEdit(null); setIsModalOpen(true); };
  // ✅ 3. Nova função para abrir o modal do QR Code
  const handleShowQrCode = (pagina: PaginaEvento) => { setPaginaToShowQr(pagina); };

  const tableColumns = createColumns({ 
    onEdit: handleEdit, 
    onDelete: handleDelete, 
    onUploadMedia: handleUploadMedia,
    onShowQrCode: handleShowQrCode, // ✅ 4. Passar a nova função para as colunas
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

      {/* Os seus modais existentes continuam aqui */}
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

      {/* ✅ 5. Adicionamos o novo modal do QR Code à página */}
      <PaginaEventoQrCodeDialog
        pagina={paginaToShowQr}
        onClose={() => setPaginaToShowQr(null)}
      />
    </div>
  );
}