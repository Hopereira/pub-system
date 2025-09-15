// Caminho: frontend/src/components/cozinha/CozinhaPageClient.tsx
'use client';

import { getPedidos, updatePedidoStatus } from '@/services/pedidoService'; // ADIÇÃO
import { Pedido, PedidoStatus } from '@/types/pedido';
import React, { useEffect, useState } from 'react';
import PedidoCard from './PedidoCard';
import { Skeleton } from '../ui/skeleton';
import { socket } from '@/lib/socket';
import { toast } from 'sonner'; // ADIÇÃO

export default function CozinhaPageClient() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ... (useEffect de busca inicial e de websocket não foram alterados)
  useEffect(() => {
    const fetchPedidos = async () => { /* ... */ };
    fetchPedidos();
  }, []);

  useEffect(() => {
    socket.connect();
    function onNovoPedido(novoPedido: Pedido) { /* ... */ }
    function onStatusAtualizado(pedidoAtualizado: Pedido) { /* ... */ }
    socket.on('novo_pedido', onNovoPedido);
    socket.on('status_atualizado', onStatusAtualizado);
    return () => { /* ... */ };
  }, []);

  // --- ADIÇÃO: Função para lidar com a mudança de status ---
  const handleStatusChange = async (pedidoId: string, newStatus: PedidoStatus) => {
    try {
      // 1. Chamamos a API para atualizar o status no backend.
      await updatePedidoStatus(pedidoId, { status: newStatus });
      toast.success(`Pedido #${pedidoId.substring(0,8)} atualizado para ${newStatus.replace('_', ' ')}!`);
      
      // 2. E ISSO É TUDO! Não precisamos fazer setPedidos(..) aqui.
      // O backend, ao ser atualizado, vai emitir o evento 'status_atualizado'.
      // O nosso useEffect que escuta esse evento vai receber a notificação
      // e atualizar o estado da UI automaticamente. Mágico!
    } catch (error) {
      toast.error("Falha ao atualizar o status do pedido.");
      console.error("Erro ao atualizar status:", error);
    }
  };
  // --- FIM DA ADIÇÃO ---


  if (isLoading) { /* ... */ }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Pedidos na Cozinha/Bar</h1>
      {pedidos.length === 0 ? (
        <p className='text-center text-muted-foreground mt-10'>Nenhum pedido aguardando preparo.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pedidos.map(pedido => (
            // ALTERAÇÃO: Passamos a nova função como prop para o PedidoCard
            <PedidoCard 
                key={pedido.id} 
                pedido={pedido} 
                onStatusChange={handleStatusChange} 
            />
          ))}
        </div>
      )}
    </div>
  );
}