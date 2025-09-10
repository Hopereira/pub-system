// Caminho: frontend/src/app/(protected)/dashboard/operacional/[ambienteId]/OperacionalClientPage.tsx
'use client';

import { useEffect, useState } from 'react';
// --- ALTERAÇÃO: A importação de 'PedidoStatus' foi removida daqui ---
import { PedidoCard } from '@/components/operacional/PedidoCard'; 
// --- E adicionamos as importações corretas de tipos ---
import { Pedido, PedidoStatus } from '@/types/pedido';
import { getPedidos, updatePedidoStatus } from '@/services/pedidoService';

export function OperacionalClientPage({ ambienteId }: { ambienteId: string }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        // Não resetamos mais o loading a cada poll para evitar piscar a tela
        const data = await getPedidos(ambienteId);
        // Garantimos que a resposta é sempre um array
        setPedidos(Array.isArray(data) ? data : []); 
      } catch (err: any) {
        setError(err.message || 'Falha ao buscar os pedidos.');
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
    const intervalId = setInterval(fetchPedidos, 15000); // Polling a cada 15s
    return () => clearInterval(intervalId);
  }, [ambienteId]);

  const handleUpdateStatus = async (pedidoId: string, novoStatus: PedidoStatus) => {
      try {
        const pedidoAtualizado = await updatePedidoStatus(pedidoId, { status: novoStatus });
        setPedidos((pedidosAtuais) =>
          pedidosAtuais.map((p) =>
            p.id === pedidoId ? pedidoAtualizado : p
          )
        );
      } catch (err: any) {
        setError(err.message || 'Falha ao atualizar o status do pedido.');
      }
  };

  const handleCancelPedido = async (pedidoId: string, motivo: string) => {
    try {
      const pedidoCancelado = await updatePedidoStatus(pedidoId, { 
        status: PedidoStatus.CANCELADO, // Agora usa o Enum correto
        motivoCancelamento: motivo,
      });

      setPedidos((pedidosAtuais) =>
        pedidosAtuais.map((p) =>
          p.id === pedidoId ? pedidoCancelado : p
        )
      );
    } catch (err: any) {
      setError(err.message || 'Falha ao cancelar o pedido.');
    }
  };

  if (loading) {
    return <p className="mt-8 text-center">Carregando pedidos...</p>;
  }
  
  if (error) {
    return <p className="mt-8 text-center text-red-500">Erro: {error}</p>;
  }

  // Lógica de ordenação para uma melhor UX
  const pedidosOrdenados = [...pedidos].sort((a, b) => {
    const statusOrder: Record<PedidoStatus, number> = {
      'PRONTO': 1, 'EM_PREPARO': 2, 'FEITO': 3, 'ENTREGUE': 4, 'CANCELADO': 5,
    };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="mt-8 flow-root">
      {pedidosOrdenados.length === 0 ? (
        <p className="text-center text-muted-foreground">Nenhum pedido encontrado para este ambiente.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {pedidosOrdenados.map((pedido) => (
            <PedidoCard 
              key={pedido.id} 
              pedido={pedido} 
              onUpdateStatus={handleUpdateStatus}
              onCancel={handleCancelPedido}
            />
          ))}
        </div>
      )}
    </div>
  );
}