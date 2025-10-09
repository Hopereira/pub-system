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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// ✅ 1. Importar o ícone do QR Code
import { MoreHorizontal, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ✅ 2. A função agora também espera o callback 'onShowQrCode'
export const createColumns = (callbacks: {
  onEdit: (pagina: PaginaEvento) => void;
  onDelete: (pagina: PaginaEvento) => void;
  onUploadMedia: (pagina: PaginaEvento) => void;
  onShowQrCode: (pagina: PaginaEvento) => void; 
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
            
            {/* ✅ 3. Adicionar a nova opção de menu aqui */}
            <DropdownMenuItem onClick={() => callbacks.onShowQrCode(pagina)}>
              <QrCode className="mr-2 h-4 w-4" />
              Ver QR Code
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => callbacks.onEdit(pagina)}>
              Editar Título
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => callbacks.onUploadMedia(pagina)}>
              Upload Mídia
            </DropdownMenuItem>
            
            <DropdownMenuSeparator /> 

            <DropdownMenuItem 
              onClick={() => callbacks.onDelete(pagina)}
              className="text-red-600 focus:text-red-600"
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];