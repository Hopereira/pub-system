// src/app/(protected)/dashboard/admin/agenda-eventos/AgendaEventosClientPage.tsx

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

interface AgendaEventosClientPageProps {
  initialData: Evento[];
}

export default function AgendaEventosClientPage({ initialData }: AgendaEventosClientPageProps) {
  const [eventos, setEventos] = useState<Evento[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventoToEdit, setEventoToEdit] = useState<Evento | null>(null);

  const loadEventos = async () => {
    setIsLoading(true);
    try {
      const data = await getAllEventos();
      setEventos(data);
    } catch (error) {
      console.error("Erro ao recarregar a lista de eventos:", error);
      toast.error("Não foi possível carregar a lista de eventos do servidor.");
      setEventos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEventoToEdit(null);
    loadEventos();
  };
  
  // VAMOS PASSAR AS FUNÇÕES PARA AS COLUNAS
  const columns = createColumns({
    onEdit: (evento) => {
      setEventoToEdit(evento);
      setIsModalOpen(true);
    },
    onDelete: (evento) => {
      // Lógica para o modal de exclusão virá aqui
    },
    // ✅ ALTERAÇÃO AQUI: Adicionamos a linha em falta
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

      <div className="rounded-md border bg-card">
        <div className="p-4 flex justify-between items-center">
          {isLoading && <span className="text-sm text-muted-foreground">Carregando dados...</span>}
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