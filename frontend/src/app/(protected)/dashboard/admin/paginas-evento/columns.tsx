// Caminho: frontend/src/app/(protected)/dashboard/admin/paginas-evento/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { PaginaEvento } from '@/types/pagina-evento';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator, // Importar o Separator para melhor UX
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// A definição de colunas agora recebe o novo callback onUploadMedia
export const columns = (callbacks: {
  onEdit: (pagina: PaginaEvento) => void;
  onDelete: (pagina: PaginaEvento) => void;
  onUploadMedia: (pagina: PaginaEvento) => void; // <-- NOVO CALLBACK
}): ColumnDef<PaginaEvento>[] => [
  {
    accessorKey: 'titulo',
    header: 'Título',
  },
  {
    accessorKey: 'ativa',
    header: 'Status',
    cell: ({ row }) => {
      const ativa = row.getValue('ativa');
      return (
        <Badge variant={ativa ? 'default' : 'destructive'}>
          {ativa ? 'Ativa' : 'Inativa'}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      const pagina = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            
            <DropdownMenuItem onClick={() => callbacks.onEdit(pagina)}>
              Editar Título
            </DropdownMenuItem>
            
            {/* NOVO: Ação de Upload de Mídia */}
            <DropdownMenuItem onClick={() => callbacks.onUploadMedia(pagina)}>
              Upload Mídia
            </DropdownMenuItem>
            
            <DropdownMenuSeparator /> 

            <DropdownMenuItem onClick={() => callbacks.onDelete(pagina)}>
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];