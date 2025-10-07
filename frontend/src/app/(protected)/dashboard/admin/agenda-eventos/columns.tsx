'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Evento } from "@/types/evento";
import { ArrowUpDown, MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toggleEventoStatus } from "@/services/eventoService";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";

// A interface de props está correta.
interface ColumnsProps {
  onEdit: (evento: Evento) => void;
  onDelete: (evento: Evento) => void;
  onStatusChangeSuccess: () => void;
}

export const createColumns = ({ onEdit, onDelete, onStatusChangeSuccess }: ColumnsProps): ColumnDef<Evento>[] => [
  {
    accessorKey: "titulo",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Título
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="pl-4 font-medium">{row.getValue("titulo")}</div>,
  },
  {
    accessorKey: "dataEvento",
    header: "Data do Evento",
    cell: ({ row }) => {
      const data = new Date(row.getValue("dataEvento"));
      const formatada = format(data, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      return <div>{formatada}</div>;
    },
  },
  {
    accessorKey: "valor",
    header: () => <div className="text-right">Valor</div>,
    cell: ({ row }) => {
        const valor = parseFloat(row.getValue("valor"));
        const formatado = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(valor);
        // Alinhado à direita para consistência
        return <div className="text-right font-medium">{valor > 0 ? formatado : 'Gratuito'}</div>;
    },
  },
  {
    accessorKey: "ativo",
    header: "Status",
    cell: ({ row }) => {
      const evento = row.original;
      const [isPending, setIsPending] = useState(false);
      
      const handleToggle = async (checked: boolean) => {
        if (isPending) return;

        setIsPending(true);
        try {
            // A chamada ao serviço está correta
            await toggleEventoStatus(evento.id, checked);
            toast.success(`Status de "${evento.titulo}" alterado com sucesso!`);
            
            // A chamada de recarregamento está correta
            onStatusChangeSuccess(); 

        } catch (error) {
            console.error("Erro ao alterar o status do evento:", error);
            toast.error(`Falha ao alterar o status de "${evento.titulo}".`);
            // Mesmo em caso de erro, recarregamos para reverter o switch visualmente
            onStatusChangeSuccess();
        } finally {
            setIsPending(false);
        }
      };

      return (
        <div className="flex items-center space-x-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            <Switch
                id={`status-${evento.id}`}
                checked={evento.ativo}
                onCheckedChange={handleToggle}
                disabled={isPending}
            />
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const evento = row.original;
 
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(evento)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-500 focus:text-red-500 focus:bg-red-50"
                onClick={() => onDelete(evento)}
              >
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];