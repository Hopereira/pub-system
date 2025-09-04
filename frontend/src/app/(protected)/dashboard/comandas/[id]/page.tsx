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
      } finally {
        setIsLoading(false);
      }
    }
  }, [comandaId]);

  useEffect(() => {
    fetchComanda();
  }, [fetchComanda]);

  const handleItensAdicionados = () => {
    setIsDrawerOpen(false); // Fecha a gaveta
    fetchComanda();       // Busca os dados atualizados da comanda
  };

  const formatCurrency = (value: number) => { /* ... continua igual ... */ };

  if (isLoading) { /* ... */ }
  if (!comanda) { /* ... */ }

  const total = comanda.itensPedido.reduce((acc, item) => acc + (item.produto.preco * item.quantidade), 0);

  return (
    <div className="p-4 relative min-h-screen">
      {/* ... O resto do JSX continua exatamente igual ao passo anterior ... */}
      <h1 className="text-3xl font-bold">Comanda da Mesa {comanda.mesa?.numero}</h1>
      <p className="text-lg">Status: <span className="font-semibold">{comanda.status}</span></p>
      <div className="mt-6">
        <h2 className="text-2xl font-bold">Itens do Pedido</h2>
        {comanda.itensPedido.length === 0 ? (
          <p className="text-gray-500 mt-4">Nenhum item adicionado ainda.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {comanda.itensPedido.map(item => (
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
      <Button onClick={() => setIsDrawerOpen(true)} className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"><PlusCircle className="h-8 w-8" /></Button>

      {/* Passando as props necessárias para o Drawer */}
      <AddItemDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        comandaId={comandaId}
        onItensAdicionados={handleItensAdicionados}
      />
    </div>
  );
}