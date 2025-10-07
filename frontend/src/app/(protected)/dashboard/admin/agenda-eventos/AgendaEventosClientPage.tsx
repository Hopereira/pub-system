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

  const loadEventos = async () => {
    setIsLoading(true);
    try {
      const data = await getAllEventos();
      setEventos(data);
    } catch (error) {
      console.error("Erro ao carregar a lista de eventos:", error);
      toast.error("Não foi possível carregar a lista de eventos.");
      setEventos([]);
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