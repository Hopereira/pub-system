'use client';

import { useState, useEffect } from "react"; 
import { Evento } from "@/types/evento";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { createColumns } from "./columns"; 
import EventoFormDialog from "@/components/eventos/EventoFormDialog";
import { getAllEventos } from "@/services/eventoService";
import { toast } from "sonner";
import EventoDeleteAlert from "@/components/eventos/EventoDeleteAlert";
// ✅ NOVO: Importar o novo modal de upload
import EventoUploadDialog from "@/components/eventos/EventoUploadDialog";

interface AgendaEventosClientPageProps {
  initialData: Evento[];
}

export default function AgendaEventosClientPage({ initialData }: AgendaEventosClientPageProps) {
  const [eventos, setEventos] = useState<Evento[]>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventoToEdit, setEventoToEdit] = useState<Evento | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState<Evento | null>(null);

  // ✅ NOVO: Estados para controlar o modal de upload
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [eventoToUpload, setEventoToUpload] = useState<Evento | null>(null);

  const loadEventos = async () => {
    setIsLoading(true);
    try {
      const data = await getAllEventos();
      setEventos(data);
    } catch (error) {
      console.error("Erro ao carregar a lista de eventos:", error);
      toast.error("Não foi possível carregar a lista de eventos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEventos();
  }, []);

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEventoToEdit(null);
    setIsDeleteAlertOpen(false);
    setEventoToDelete(null);
    setIsUploadModalOpen(false); // Fecha o modal de upload também
    setEventoToUpload(null);
    loadEventos();
  };

  const columns = createColumns({
    onEdit: (evento) => {
      setEventoToEdit(evento);
      setIsModalOpen(true);
    },
    onDelete: (evento) => {
      setEventoToDelete(evento);
      setIsDeleteAlertOpen(true);
    },
    // ✅ NOVO: Conectar a ação do menu com a abertura do modal
    onUpload: (evento) => {
      setEventoToUpload(evento);
      setIsUploadModalOpen(true);
    },
    onStatusChangeSuccess: loadEventos,
  });

  return (
    <>
      <EventoFormDialog 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen}
        onSuccess={handleSuccess}
        eventoToEdit={eventoToEdit}
      />

      <EventoDeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        eventoToDelete={eventoToDelete}
        onSuccess={handleSuccess}
      />

      {/* ✅ NOVO: Renderizar o novo modal de upload */}
      <EventoUploadDialog
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onSuccess={handleSuccess}
        eventoToUpload={eventoToUpload}
      />

      <div className="rounded-md border bg-card">
        <div className="p-4 flex justify-between items-center">
          {isLoading && <span className="text-sm text-muted-foreground">Carregando eventos...</span>}
          {!isLoading && <div />}

          <Button onClick={() => {
            setEventoToEdit(null);
            setIsModalOpen(true);
          }} disabled={isLoading}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Novo Evento
          </Button>
        </div>

        <DataTable columns={columns} data={eventos} />
      </div>
    </>
  );
}