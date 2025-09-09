// Caminho: frontend/src/app/comanda/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Comanda } from '@/types/comanda';
import { getPublicComandaById } from '@/services/comandaService';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function ComandaClientePage() {
  const params = useParams();
  const comandaId = params.id as string;

  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (comandaId) {
      const fetchComanda = async () => {
        try {
          setIsLoading(true);
          const data = await getPublicComandaById(comandaId);
          setComanda(data);
        } catch (err) {
          setError('Comanda não encontrada ou inválida.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchComanda();
    }
  }, [comandaId]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Carregando comanda...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  if (!comanda) {
    return null;
  }

  // 1. ADICIONADO `pedidoId` para garantir a chave única
  const todosOsItens = comanda.pedidos?.flatMap(pedido =>
    pedido.itens.map(item => ({
      ...item,
      pedidoStatus: pedido.status,
      pedidoId: pedido.id // Injeta o ID do pedido pai em cada item
    }))
  ) ?? [];

  const itensValidos = todosOsItens.filter(item => item.pedidoStatus !== 'CANCELADO');

  const total = comanda.pedidos
    ?.filter(pedido => pedido.status !== 'CANCELADO')
    .reduce((acc, pedido) => acc + (Number(pedido.total) || 0), 0) ?? 0;

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm:p-6">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              Sua Comanda - {comanda.mesa ? `Mesa ${comanda.mesa.numero}` : 'Balcão'}
            </CardTitle>
            <CardDescription>Acompanhe seus pedidos e o total da sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="font-bold mb-2">Itens Consumidos</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itensValidos.map(item => (
                  // 2. ATUALIZADA a 'key' para ser composta e única
                  <TableRow key={`${item.pedidoId}-${item.id}`}>
                    <TableCell>{item.quantidade}x</TableCell>
                    <TableCell className="font-medium">{item.produto.nome}</TableCell>
                    <TableCell><Badge variant="secondary">{item.pedidoStatus.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-right">{formatCurrency(item.produto.preco * item.quantidade)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 pt-4 border-t-2 font-bold text-xl flex justify-between">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}