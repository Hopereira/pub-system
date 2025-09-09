// Caminho: frontend/src/app/(protected)/dashboard/operacional/[ambienteId]/OperacionalClientPage.tsx
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PedidoCard } from '@/components/operacional/PedidoCard';
import { Pedido, PedidoStatus } from '@/types/pedido';
// --- ALTERAÇÃO 1: Importando os nomes corretos do serviço ---
import { getPedidos, updatePedidoStatus } from '@/services/pedidoService';

interface OperacionalClientPageProps {
    ambienteId: string;
}

export function OperacionalClientPage({ ambienteId }: OperacionalClientPageProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        // --- ALTERAÇÃO 2: Usando a função correta 'getPedidos' ---
        const data = await getPedidos(ambienteId);
        setPedidos(Array.isArray(data) ? data : []);
      } catch (err: any) {
        toast.error(err.message || 'Falha ao buscar os pedidos.');
        setPedidos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
    const intervalId = setInterval(fetchPedidos, 15000);
    return () => clearInterval(intervalId);
  }, [ambienteId]);

  const handleUpdateStatus = async (pedidoId: string, novoStatus: PedidoStatus) => {
      try {
        // Esta função já estava correta
        const pedidoAtualizado = await updatePedidoStatus(pedidoId, { status: novoStatus });
        setPedidos((pedidosAtuais) =>
          pedidosAtuais.map((p) => (p.id === pedidoId ? pedidoAtualizado : p))
        );
        toast.success(`Pedido atualizado para ${novoStatus.replace('_', ' ')}!`);
      } catch (err: any) {
        toast.error(err.message || 'Falha ao atualizar o status do pedido.');
      }
  };

  // --- ALTERAÇÃO 3: Ajustando o cancelamento para usar 'updatePedidoStatus' ---
  const handleCancelPedido = async (pedidoId: string, motivo: string) => {
    try {
      const payload = {
        status: PedidoStatus.CANCELADO,
        motivoCancelamento: motivo
      };
      const pedidoCancelado = await updatePedidoStatus(pedidoId, payload);
      setPedidos((pedidosAtuais) =>
        pedidosAtuais.map((p) => (p.id === pedidoId ? pedidoCancelado : p))
      );
      toast.success("Pedido cancelado com sucesso!");
    } catch (err: any)      {
      toast.error(err.message || 'Falha ao cancelar o pedido.');
    }
  };

  const pedidosOrdenados = [...pedidos].sort((a, b) => {
    const statusOrder: Record<PedidoStatus, number> = {
      'PRONTO': 1,
      'EM_PREPARO': 2,
      'FEITO': 3,
      'ENTREGUE': 4,
      'CANCELADO': 5,
    };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  if (loading) {
    return <p className="mt-8 text-center">Carregando pedidos...</p>;
  }

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