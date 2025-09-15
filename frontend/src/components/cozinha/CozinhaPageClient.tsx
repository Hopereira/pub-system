// Caminho: frontend/src/components/cozinha/CozinhaPageClient.tsx
'use client';

import { getPedidos } from '@/services/pedidoService';
import { Pedido, PedidoStatus } from '@/types/pedido';
import React, { useEffect, useState } from 'react';
import PedidoCard from './PedidoCard';
import { Skeleton } from '../ui/skeleton';
// --- ADIÇÃO ---
import { socket } from '@/lib/socket';

export default function CozinhaPageClient() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- ALTERAÇÃO: Refatoramos a lógica de useEffect ---

  // 1. O primeiro useEffect busca os dados iniciais, como antes.
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const data = await getPedidos();
        const pedidosAtivos = data.filter(p => p.status === 'FEITO' || p.status === 'EM_PREPARO');
        setPedidos(pedidosAtivos);
      } catch (error) {
        console.error("Erro ao buscar pedidos para a cozinha", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPedidos();
  }, []);

  // 2. Este novo useEffect gerencia a conexão WebSocket.
  useEffect(() => {
    // Conecta ao servidor quando o componente é montado
    socket.connect();

    // Função para lidar com a chegada de um novo pedido
    function onNovoPedido(novoPedido: Pedido) {
        // Adicionamos o novo pedido no topo da lista, sem buscar todos novamente
        setPedidos(prevPedidos => [novoPedido, ...prevPedidos]);
    }

    // Função para lidar com a atualização de status
    function onStatusAtualizado(pedidoAtualizado: Pedido) {
        setPedidos(prevPedidos => 
            // Primeiro, atualizamos o pedido que mudou
            prevPedidos.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p)
            // Depois, filtramos a lista para remover pedidos que não são mais para a cozinha
            .filter(p => p.status === PedidoStatus.FEITO || p.status === PedidoStatus.EM_PREPARO)
        );
    }

    // Adicionamos os "ouvintes" de eventos
    socket.on('novo_pedido', onNovoPedido);
    socket.on('status_atualizado', onStatusAtualizado);

    // Função de limpeza: executada quando o componente é desmontado
    return () => {
      // Removemos os "ouvintes" para evitar vazamentos de memória
      socket.off('novo_pedido', onNovoPedido);
      socket.off('status_atualizado', onStatusAtualizado);
      // Desconecta do servidor
      socket.disconnect();
    };
  }, []); // O array vazio garante que este efeito rode apenas uma vez (montar/desmontar)

  // ... (o resto do componente, incluindo o return, continua igual)

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