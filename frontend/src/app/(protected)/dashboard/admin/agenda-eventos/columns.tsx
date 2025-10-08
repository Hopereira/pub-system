'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Evento } from "@/types/evento";
import { MoreHorizontal, Edit, Upload, Trash2, QrCode, Loader2, PictureInPicture } from "lucide-react";
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
import Image from "next/image";

interface ColumnsProps {
  onEdit: (evento: Evento) => void;
  onDelete: (evento: Evento) => void;
  onUpload: (evento: Evento) => void;
  onShowQrCode: (evento: Evento) => void;
  onStatusChangeSuccess: () => void;
}

export const createColumns = ({ onEdit, onDelete, onUpload, onShowQrCode, onStatusChangeSuccess }: ColumnsProps): ColumnDef<Evento>[] => [
  {
    id: 'imagem',
    header: 'Imagem',
    // ✅ CÓDIGO DA IMAGEM RESTAURADO
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
      return (
        <div className="flex h-10 w-16 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <PictureInPicture className="h-4 w-4" />
        </div>
      );
    },
  },
  {
    accessorKey: "titulo",
    header: "Título",
  },
  {
    accessorKey: "dataEvento",
    header: "Data do Evento",
    // ✅ CÓDIGO DA DATA E HORA RESTAURADO
    cell: ({ row }) => {
      const data = new Date(row.getValue("dataEvento"));
      return <div>{format(data, "dd/MM/yyyy 'às' HH:mm'h'", { locale: ptBR })}</div>;
    },
  },
  {
    accessorKey: "valor",
    header: "Valor",
    // ✅ CÓDIGO DO VALOR RESTAURADO
    cell: ({ row }) => {
        const valor = parseFloat(row.getValue("valor"));
        return <div>{valor > 0 ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor) : 'Gratuito'}</div>;
    },
  },
  {
    accessorKey: "ativo",
    header: "Status",
    // ✅ CÓDIGO DO SWITCH DE STATUS RESTAURADO
    cell: ({ row }) => {
      const evento = row.original;
      const [isLoading, setIsLoading] = useState(false);

      const handleToggleStatus = async (ativo: boolean) => {
        setIsLoading(true);
        try {
          await toggleEventoStatus(evento.id, ativo);
          toast.success(`Status do evento "${evento.titulo}" alterado com sucesso!`);
          onStatusChangeSuccess();
        } catch (error) {
          toast.error("Falha ao alterar o status do evento.");
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <div className="flex items-center space-x-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          <Switch
            checked={evento.ativo}
            onCheckedChange={handleToggleStatus}
            disabled={isLoading}
            aria-label="Ativar ou desativar evento"
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
              
              <DropdownMenuItem onClick={() => onShowQrCode(evento)}>
                <QrCode className="mr-2 h-4 w-4" />
                Ver QR Code
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => onEdit(evento)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar Dados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpload(evento)}>
                <Upload className="mr-2 h-4 w-4" />
                Enviar Imagem
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-500 focus:text-red-500"
                onClick={() => onDelete(evento)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];