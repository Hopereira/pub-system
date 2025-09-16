// Caminho: frontend/src/components/cozinha/CozinhaPageClient.tsx
'use client';

// 1. Importamos o novo serviço e DTO
import { getPedidos, updateItemStatus, UpdateItemStatusDto } from '@/services/pedidoService';
import { Pedido, PedidoStatus } from '@/types/pedido';
import React, { useEffect, useState } from 'react';
import PedidoCard from './PedidoCard';
import { Skeleton } from '../ui/skeleton';
import { socket } from '@/lib/socket';
import { toast } from 'sonner';

export default function CozinhaPageClient() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ... (useEffect de busca inicial e de websocket não foram alterados)
  useEffect(() => {
    // ...
  }, []);

  useEffect(() => {
    // ...
  }, []);

  // --- FUNÇÃO DE ATUALIZAÇÃO REFEITA ---
  const handleItemStatusChange = async (itemPedidoId: string, novoStatus: PedidoStatus) => {
      try {
        const data: UpdateItemStatusDto = { status: novoStatus };
        // 2. Chamamos o novo serviço que atualiza um item específico
        await updateItemStatus(itemPedidoId, data);
        toast.success(`Item atualizado para ${novoStatus.replace('_', ' ')}!`);
        
        // A mágica do WebSocket continua a funcionar: o backend emitirá um evento
        // 'status_atualizado' que será capturado pelo nosso useEffect,
        // atualizando a UI com o pedido completo e os novos status dos itens.
      } catch (err: any) {
        toast.error(err.message || 'Falha ao atualizar o status do item.');
      }
  };
  // --- FIM DA REATORAÇÃO ---

  if (isLoading) { /* ... */ }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Pedidos na Cozinha/Bar</h1>
      {pedidos.length === 0 ? (
        <p className='text-center text-muted-foreground mt-10'>Nenhum pedido aguardando preparo.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pedidos.map(pedido => (
            // 3. Passamos a nova função com o nome correto para o PedidoCard
            <PedidoCard 
                key={pedido.id} 
                pedido={pedido} 
                onItemStatusChange={handleItemStatusChange} 
            />
          ))}
        </div>
      )}
    </div>
  );
}