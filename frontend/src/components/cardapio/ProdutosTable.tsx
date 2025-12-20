'use client';

import React from 'react';
import Image from 'next/image';
import { Produto } from '@/types/produto';
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
import { Badge } from '@/components/ui/badge';

interface ProdutosTableProps {
  produtos: Produto[];
  onEdit: (produto: Produto) => void;
  onDelete: (produto: Produto) => void;
}

export default function ProdutosTable({ produtos = [], onEdit, onDelete }: ProdutosTableProps) {
  const produtosArray = Array.isArray(produtos) ? produtos : [];

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Imagem</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Ambiente de Preparo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {produtosArray.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Nenhum produto encontrado.
              </TableCell>
            </TableRow>
          ) : (
            produtosArray.map((produto) => (
              <TableRow key={produto.id}>
                <TableCell>
                  {produto.urlImagem ? (
                    <Image
                      src={produto.urlImagem}
                      alt={produto.nome}
                      width={64}
                      height={64}
                      className="rounded-md object-cover aspect-square"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                      Sem Foto
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{produto.nome}</TableCell>
                <TableCell>{produto.categoria}</TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{produto.ambiente?.nome ?? 'N/A'}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <Button variant="outline" size="icon" className="mr-2" onClick={() => onEdit(produto)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => onDelete(produto)}>
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