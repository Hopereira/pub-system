'use client';

import { AddItemDrawer } from "@/components/comandas/AddItemDrawer";
import { Button } from "@/components/ui/button";
import { getComandaById } from "@/services/comandaService";
import { Comanda } from "@/types/comanda";
import { PlusCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function ComandaDetalhePage() {
  const params = useParams();
  const comandaId = params.id as string;

  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchComanda = useCallback(async () => {
    if (comandaId) {
      setIsLoading(true);
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
    fetchComanda();
  }, [fetchComanda]);

  const handleItensAdicionados = () => {
    setIsDrawerOpen(false);
    fetchComanda();
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

  // --- CORREÇÃO AQUI ---
  // A comanda tem múltiplos 'pedidos', e cada pedido tem 'itens'.
  // Usamos flatMap para juntar todos os 'itens' de todos os 'pedidos' em uma única lista.
  const todosOsItens = comanda.pedidos?.flatMap(pedido => pedido.itens) ?? [];

  // O cálculo do total agora usa a lista corrigida 'todosOsItens'.
  const total = todosOsItens.reduce((acc, item) => acc + (item.produto.preco * item.quantidade), 0);

  return (
    <div className="p-4 relative min-h-screen">
      <h1 className="text-3xl font-bold">Comanda da Mesa {comanda.mesa?.numero}</h1>
      <p className="text-lg">Status: <span className="font-semibold">{comanda.status}</span></p>
      
      <div className="mt-6">
        <h2 className="text-2xl font-bold">Itens do Pedido</h2>
        {/* A verificação e o map agora usam a lista corrigida 'todosOsItens' */}
        {todosOsItens.length === 0 ? (
          <p className="text-gray-500 mt-4">Nenhum item adicionado ainda.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {todosOsItens.map(item => (
              <li key={item.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-semibold">{item.quantidade}x {item.produto.nome}</p>
                  {item.observacao && <p className="text-sm text-gray-500">Obs: {item.observacao}</p>}
                </div>
                <p>{formatCurrency(item.produto.preco * item.quantidade)}</p>
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