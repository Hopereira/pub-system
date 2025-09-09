// Caminho: frontend/src/app/(protected)/dashboard/operacional/[ambienteId]/OperacionalClientPage.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
// ALTERADO: Importamos de '/types/pedido' e não mais de 'PedidoCard'
import { Pedido, PedidoStatus } from '@/types/pedido';
import { PedidoCard } from '@/components/operacional/PedidoCard';
import { getPedidos, updatePedidoStatus } from '@/services/pedidoService';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export function OperacionalClientPage({ ambienteId }: { ambienteId: string }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPedidos = useCallback(async () => {
    const controller = new AbortController();
    try {
      setLoading(true);
      const data = await getPedidos(ambienteId);
      setPedidos(data);
      setError(null);
    } catch (err: any) {
      if (err.name !== 'CanceledError') {
        setError(err.message || 'Falha ao buscar os pedidos.');
      }
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, [ambienteId]);

  useEffect(() => {
    fetchPedidos();
    const intervalId = setInterval(fetchPedidos, 30000);
    return () => clearInterval(intervalId);
  }, [fetchPedidos]);

  const handleUpdateStatus = async (pedidoId: string, novoStatus: PedidoStatus) => {
    try {
      const pedidoAtualizado = await updatePedidoStatus(pedidoId, { status: novoStatus });
      setPedidos((pedidosAtuais) =>
        pedidosAtuais.map((p) =>
          p.id === pedidoId ? { ...p, status: pedidoAtualizado.status } : p
        )
      );
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar o status do pedido.');
    }
  };

  const handleCancelPedido = async (pedidoId: string, motivo: string) => {
    try {
      const pedidoCancelado = await updatePedidoStatus(pedidoId, { 
        status: PedidoStatus.CANCELADO, // Agora isto funciona, pois PedidoStatus é um objeto (enum)
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

  if (loading && pedidos.length === 0) {
    return ( <div className="p-4 mt-8"> <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"> {Array.from({ length: 4 }).map((_, index) => ( <Skeleton key={index} className="h-48 w-full rounded-lg" /> ))} </div> </div> );
  }
  
  if (error) {
    return ( <div className="p-4 mt-8"> <Alert variant="destructive"> <Terminal className="h-4 w-4" /> <AlertTitle>Ocorreu um Erro</AlertTitle> <AlertDescription>{error}</AlertDescription> </Alert> </div> );
  }

  return (
    <div className="mt-8 flow-root">
      {pedidos.length === 0 ? (
        <p>Nenhum pedido encontrado para este ambiente.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pedidos.map((pedido) => (
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