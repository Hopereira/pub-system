// Caminho: frontend/src/app/(protected)/dashboard/operacional/[ambienteId]/OperacionalClientPage.tsx
'use client';

import { useEffect, useState } from 'react';
import { PedidoCard, PedidoStatus } from '@/components/operacional/PedidoCard';
import { Pedido } from '@/types/pedido';
// NOVO: Importamos as funções do nosso serviço centralizado
import { getPedidos, updatePedidoStatus } from '@/services/pedidoService';

export function OperacionalClientPage({ ambienteId }: { ambienteId: string }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        setLoading(true);
        // A chamada de API agora é uma simples função do serviço
        const data = await getPedidos(ambienteId);
        setPedidos(data);
      } catch (err: any) {
        setError(err.message || 'Falha ao buscar os pedidos.');
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
    
    // Adicionamos um intervalo para buscar novos pedidos a cada 30 segundos
    const intervalId = setInterval(fetchPedidos, 30000);

    // Limpa o intervalo quando o componente é desmontado
    return () => clearInterval(intervalId);
  }, [ambienteId]);

  const handleUpdateStatus = async (pedidoId: string, novoStatus: PedidoStatus) => {
      try {
        // Lógica de atualização simplificada
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
      // Lógica de cancelamento simplificada
      const pedidoCancelado = await updatePedidoStatus(pedidoId, { 
        status: PedidoStatus.CANCELADO,
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
    return <p className="mt-8">Carregando pedidos para o ambiente...</p>;
  }
  
  if (error) {
    return <p className="mt-8 text-red-500">Erro: {error}</p>;
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