// Caminho: frontend/src/app/(protected)/dashboard/operacional/[ambienteId]/OperacionalClientPage.tsx

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PedidoCard, PedidoStatus } from '@/components/operacional/PedidoCard'; // Importamos PedidoStatus

// ... (interface Pedido continua igual)
interface Pedido {
  id: string;
  status: PedidoStatus; // Usamos o tipo importado
  itens: {
    quantidade: number;
    produto: {
      nome: string;
    };
  }[];
}


export function OperacionalClientPage({ ambienteId }: { ambienteId: string }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    // ... (useEffect para buscar os pedidos continua igual)
    const fetchPedidos = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:3000/pedidos?ambienteId=${ambienteId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error('Falha ao buscar os pedidos.');
        }

        const data = await response.json();
        setPedidos(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, [ambienteId, token]);

  // --- NOVA FUNÇÃO PARA ATUALIZAR O STATUS ---
  const handleUpdateStatus = async (pedidoId: string, novoStatus: PedidoStatus) => {
    if (!token) {
      setError('Ação não permitida. Faça login novamente.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/pedidos/${pedidoId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: novoStatus }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar o status do pedido.');
      }

      // Atualiza a lista de pedidos localmente para refletir a mudança na UI
      setPedidos((pedidosAtuais) =>
        pedidosAtuais.map((p) =>
          p.id === pedidoId ? { ...p, status: novoStatus } : p
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };
  // --- FIM DA NOVA FUNÇÃO ---


  if (loading) {
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
              onUpdateStatus={handleUpdateStatus} // Passamos a função como prop
            />
          ))}
        </div>
      )}
    </div>
  );
}