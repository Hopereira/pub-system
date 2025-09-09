// Caminho: frontend/src/app/(protected)/dashboard/comandas/[id]/page.tsx
'use client';

import { AddItemDrawer } from "@/components/comandas/AddItemDrawer";
import { Button } from "@/components/ui/button";
import { getComandaById } from "@/services/comandaService";
import { Comanda } from "@/types/comanda";
import { PlusCircle, CheckCircle } from "lucide-react"; // ALTERADO: Adicionado ícone CheckCircle
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
// ALTERADO: Importamos as dependências necessárias
import { updatePedidoStatus } from "@/services/pedidoService";
import { PedidoStatus } from "@/types/pedido";
import { Badge } from "@/components/ui/badge";

export default function ComandaDetalhePage() {
  const params = useParams();
  const comandaId = params.id as string;

  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchComanda = useCallback(async () => {
    if (comandaId) {
      // Não definimos isLoading aqui para permitir refresh silencioso
      try {
        const data = await getComandaById(comandaId);
        setComanda(data);
      } catch (err) {
        console.error(err);
        setComanda(null);
      } finally {
        setIsLoading(false);
      }
    }
  }, [comandaId]);

  useEffect(() => {
    setIsLoading(true); // Define o loading inicial apenas uma vez
    fetchComanda();
  }, [fetchComanda]);

  const handleItensAdicionados = () => {
    setIsDrawerOpen(false);
    fetchComanda(); // Recarrega os dados da comanda
  };
  
  // NOVO: Handler para marcar um pedido como entregue
  const handleMarcarComoEntregue = async (pedidoId: string) => {
    try {
      await updatePedidoStatus(pedidoId, { status: PedidoStatus.ENTREGUE });
      // Recarrega os dados da comanda para refletir a mudança de status
      await fetchComanda();
    } catch (error) {
        alert("Falha ao marcar o item como entregue. Tente novamente.");
        console.error("Erro ao entregar pedido:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) {
    return <div className="p-4">Carregando detalhes da comanda...</div>;
  }

  if (!comanda) {
    return <div className="p-4 text-red-500">Comanda não encontrada ou erro ao carregar.</div>;
  }

  const todosOsItens = comanda.pedidos?.flatMap(pedido => 
    // Mapeamos os itens para incluir o status e id do pedido pai
    pedido.itens.map(item => ({...item, pedidoStatus: pedido.status, pedidoId: pedido.id }))
  ) ?? [];

  const total = comanda.pedidos
  ?.filter(pedido => pedido.status !== 'CANCELADO')
  .reduce((acc, pedido) => acc + (Number(pedido.total) || 0), 0) ?? 0;

  return (
    <div className="p-4 relative min-h-screen">
      <h1 className="text-3xl font-bold">Comanda da Mesa {comanda.mesa?.numero ?? 'Avulsa'}</h1>
      <p className="text-lg">Status: <span className="font-semibold">{comanda.status}</span></p>
      
      <div className="mt-6">
        <h2 className="text-2xl font-bold">Itens do Pedido</h2>
        {todosOsItens.length === 0 ? (
          <p className="text-gray-500 mt-4">Nenhum item adicionado ainda.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {/* ALTERADO: Lógica de renderização para incluir status e botão */}
            {todosOsItens.map(item => (
              <li key={item.id} className="flex justify-between items-center border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{item.quantidade}x {item.produto.nome}</p>
                    <Badge variant={item.pedidoStatus === 'PRONTO' ? 'destructive' : 'secondary'}>
                      {item.pedidoStatus.replace('_', ' ')}
                    </Badge>
                  </div>
                  {item.observacao && <p className="text-sm text-gray-500">Obs: {item.observacao}</p>}
                </div>
                <div className="flex items-center gap-4">
                    <p>{formatCurrency(item.produto.preco * item.quantidade)}</p>
                    {/* Botão de entregar aparece condicionalmente */}
                    {item.pedidoStatus === PedidoStatus.PRONTO && (
                        <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleMarcarComoEntregue(item.pedidoId)}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Entregar
                        </Button>
                    )}
                </div>
              </li>
            ))}
          </ul>
        )}
         <div className="mt-4 pt-4 border-t-2 font-bold text-xl flex justify-between">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
        </div>
      </div>
      
      <Button onClick={() => setIsDrawerOpen(true)} className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg">
        <PlusCircle className="h-8 w-8" />
      </Button>

      <AddItemDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        comandaId={comandaId}
        onItensAdicionados={handleItensAdicionados}
      />
    </div>
  );
}