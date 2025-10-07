'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Evento } from "@/types/evento";
import { ArrowUpDown, MoreHorizontal, Loader2, PictureInPicture } from "lucide-react"; // ✅ Adicionado PictureInPicture
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
import Image from "next/image"; // ✅ Adicionado Image

interface ColumnsProps {
  onEdit: (evento: Evento) => void;
  onDelete: (evento: Evento) => void;
  onUpload: (evento: Evento) => void;
  onStatusChangeSuccess: () => void;
}

export const createColumns = ({ onEdit, onDelete, onUpload, onStatusChangeSuccess }: ColumnsProps): ColumnDef<Evento>[] => [
  // ✅ =======================================================
  // ✅ NOVA COLUNA PARA EXIBIR A IMAGEM DO EVENTO
  // ✅ =======================================================
  {
    id: 'imagem',
    header: 'Imagem',
    cell: ({ row }) => {
      const evento = row.original;
      if (evento.urlImagem) {
        return (
          <div className="relative h-10 w-16 rounded-md overflow-hidden">
            <Image
              src={evento.urlImagem}
              alt={evento.titulo}
              fill
              className="object-cover"
            />
          </div>
        );
      }
      // Se não houver imagem, mostra um placeholder
      return (
        <div className="flex h-10 w-16 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <PictureInPicture className="h-4 w-4" />
        </div>
      );
    },
  },
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
            await toggleEventoStatus(evento.id, checked);
            toast.success(`Status de "${evento.titulo}" alterado com sucesso!`);
            onStatusChangeSuccess(); 
        } catch (error) {
            toast.error(`Falha ao alterar o status de "${evento.titulo}".`);
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
                Editar Dados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpload(evento)}>
                Enviar Imagem
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