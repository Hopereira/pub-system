'use client';

import { AddItemDrawer } from "@/components/comandas/AddItemDrawer";
import { Button } from "@/components/ui/button";
import { getComandaById, fecharComanda } from "@/services/comandaService";
import { Comanda } from "@/types/comanda";
import { PlusCircle, CheckCircle, Banknote } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { updatePedidoStatus } from "@/services/pedidoService";
import { PedidoStatus } from "@/types/pedido";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function ComandaDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const comandaId = params.id as string;
  const { user } = useAuth();

  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isCaixa = user?.cargo === 'ADMIN' || user?.cargo === 'CAIXA';
  const isGarcom = user?.cargo === 'ADMIN' || user?.cargo === 'GARCOM';

  const fetchComanda = useCallback(async () => {
    if (comandaId) {
      try {
        const data = await getComandaById(comandaId);
        setComanda(data);
      } catch (err) {
        console.error(err);
        setComanda(null);
        toast.error("Falha ao carregar dados da comanda.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [comandaId]);

  useEffect(() => {
    setIsLoading(true);
    fetchComanda();
  }, [fetchComanda]);

  const handleItensAdicionados = () => {
    setIsDrawerOpen(false);
    fetchComanda();
  };

  const handleMarcarComoEntregue = async (pedidoId: string) => {
    try {
      await updatePedidoStatus(pedidoId, { status: PedidoStatus.ENTREGUE });
      toast.success("Pedido marcado como entregue!");
      await fetchComanda();
    } catch (error) {
      toast.error("Falha ao marcar o pedido como entregue.");
      console.error("Erro ao entregar pedido:", error);
    }
  };

  const handleFecharComanda = async () => {
    if (window.confirm('Confirmar o pagamento e fechar esta comanda?')) {
      try {
        const comandaFechada = await fecharComanda(comandaId);
        setComanda(comandaFechada);
        toast.success('Comanda fechada com sucesso!');
        setTimeout(() => router.push('/dashboard/caixa'), 2000);
      } catch (error) {
        toast.error('Não foi possível fechar a comanda.');
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) return <div className="p-4">Carregando detalhes da comanda...</div>;
  if (!comanda) return <div className="p-4 text-red-500">Comanda não encontrada ou erro ao carregar.</div>;

  const total = comanda.pedidos?.filter(pedido => pedido.status !== 'CANCELADO').reduce((acc, pedido) => acc + (Number(pedido.total) || 0), 0) ?? 0;

  return (
    <div className="p-4 relative min-h-screen pb-40">
      <h1 className="text-3xl font-bold">Comanda da Mesa {comanda.mesa?.numero ?? 'Avulsa'}</h1>
      <p className="text-lg">Status: <span className="font-semibold">{comanda.status}</span></p>
      
      <div className="mt-6">
        <h2 className="text-2xl font-bold border-b pb-2 mb-4">Pedidos</h2>
        
        {/* --- LÓGICA DE RENDERIZAÇÃO CORRIGIDA --- */}
        {!comanda.pedidos || comanda.pedidos.length === 0 ? (
          <p className="text-gray-500 mt-4">Nenhum pedido realizado ainda.</p>
        ) : (
          <div className="space-y-6">
            {comanda.pedidos.map(pedido => (
              <div key={pedido.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">Pedido #{pedido.id.substring(0, 8)}</h3>
                  <Badge variant={pedido.status === 'PRONTO' ? 'default' : 'secondary'} className={pedido.status === 'PRONTO' ? 'bg-green-600' : ''}>
                    {pedido.status.replace('_', ' ')}
                  </Badge>
                </div>
                <ul className="space-y-2">
                  {pedido.itens.map(item => (
                    <li key={item.id} className="flex justify-between items-center text-sm">
                      <div>
                        <p><span className="font-semibold">{item.quantidade}x</span> {item.produto.nome}</p>
                        {item.observacao && <p className="text-xs text-gray-500">Obs: {item.observacao}</p>}
                      </div>
                      <p>{formatCurrency(item.produto.preco * item.quantidade)}</p>
                    </li>
                  ))}
                </ul>
                {pedido.status === PedidoStatus.PRONTO && isGarcom && (
                  <div className="flex justify-end mt-4">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleMarcarComoEntregue(pedido.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar Pedido como Entregue
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {/* --- FIM DA CORREÇÃO --- */}
        
        <div className="mt-4 pt-4 border-t-2 font-bold text-xl flex justify-between">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {isCaixa && comanda.status === 'ABERTA' && (
        <div className="mt-8 p-6 border-2 border-dashed rounded-lg">
          <h2 className="text-2xl font-bold text-center mb-4">Painel de Pagamento</h2>
          <div className="flex flex-col items-center">
            <p className="text-lg mb-4">Verifique os itens com o cliente antes de fechar a conta.</p>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={handleFecharComanda}>
              <Banknote className="h-6 w-6 mr-2" />
              Confirmar Pagamento e Fechar Comanda
            </Button>
          </div>
        </div>
      )}
      
      {isGarcom && comanda.status === 'ABERTA' && (
        <Button onClick={() => setIsDrawerOpen(true)} className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg">
          <PlusCircle className="h-8 w-8" />
        </Button>
      )}

      <AddItemDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        comandaId={comandaId}
        onItensAdicionados={handleItensAdicionados}
      />
    </div>
  );
}