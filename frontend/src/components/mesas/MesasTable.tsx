// Caminho: frontend/src/components/mesas/MesasTable.tsx

'use client';

import React from 'react';
import { Mesa } from '@/types/mesa';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';

interface MesasTableProps {
  mesas: Mesa[];
}

export default function MesasTable({ mesas }: MesasTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Número</TableHead>
            <TableHead>Ambiente</TableHead>
            <TableHead className="text-right w-[130px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mesas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Nenhuma mesa encontrada.
              </TableCell>
            </TableRow>
          ) : (
            mesas.map((mesa) => (
              <TableRow key={mesa.id}>
                <TableCell className="font-medium">{mesa.numero}</TableCell>
                <TableCell>
                  {/* Usamos um Badge para destacar o ambiente */}
                  <Badge variant="outline">{mesa.ambiente.nome}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    {/* Botões para os próximos passos */}
                    <Button variant="outline" size="icon" className="mr-2">
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}