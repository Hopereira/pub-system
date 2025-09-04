// Caminho: frontend/src/components/funcionarios/FuncionariosTable.tsx

'use client';

import React from 'react';
import { Funcionario } from '@/types/funcionario';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface FuncionariosTableProps {
  funcionarios: Funcionario[];
  onEdit: (funcionario: Funcionario) => void;
  onDelete: (funcionario: Funcionario) => void; // NOVO: Prop para lidar com a exclusão
}

export default function FuncionariosTable({ funcionarios, onEdit, onDelete }: FuncionariosTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {funcionarios.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Nenhum funcionário encontrado.
              </TableCell>
            </TableRow>
          ) : (
            funcionarios.map((funcionario) => (
              <TableRow key={funcionario.id}>
                <TableCell className="font-medium">{funcionario.nome}</TableCell>
                <TableCell>{funcionario.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{funcionario.cargo}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={funcionario.ativo ? 'default' : 'destructive'}>
                    {funcionario.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                    <Button variant="outline" size="icon" className="mr-2" onClick={() => onEdit(funcionario)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    {/* NOVO: O botão de lixeira agora chama a função onDelete */}
                    <Button variant="destructive" size="icon" onClick={() => onDelete(funcionario)}>
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