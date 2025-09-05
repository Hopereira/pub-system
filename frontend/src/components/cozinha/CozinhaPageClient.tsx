// Caminho: frontend/src/components/cozinha/CozinhaPageClient.tsx
'use client';

import { getPedidos } from '@/services/pedidoService';
import { Pedido } from '@/types/pedido';
import React, { useEffect, useState } from 'react';
import PedidoCard from './PedidoCard';
import { Skeleton } from '../ui/skeleton';

export default function CozinhaPageClient() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const data = await getPedidos();
        // Filtramos para mostrar apenas pedidos que precisam de ação
        const pedidosAtivos = data.filter(p => p.status === 'FEITO' || p.status === 'EM_PREPARO');
        setPedidos(pedidosAtivos);
      } catch (error) {
        console.error("Erro ao buscar pedidos para a cozinha", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPedidos();
    // Poderíamos adicionar um polling aqui para atualizar a cada X segundos
    // setInterval(fetchPedidos, 15000); // Ex: a cada 15 segundos
  }, []);

  if (isLoading) {
    return (
        <div className="container mx-auto p-4">
             <h1 className="text-3xl font-bold tracking-tight mb-6">Pedidos na Cozinha/Bar</h1>
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className='h-64 w-full' />)}
             </div>
        </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Pedidos na Cozinha/Bar</h1>
      {pedidos.length === 0 ? (
        <p className='text-center text-muted-foreground mt-10'>Nenhum pedido aguardando preparo.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pedidos.map(pedido => (
            <PedidoCard key={pedido.id} pedido={pedido} />
          ))}
        </div>
      )}
    </div>
  );
}