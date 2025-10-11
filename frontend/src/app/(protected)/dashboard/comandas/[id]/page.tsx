'use client';

import { AddItemDrawer } from "@/components/comandas/AddItemDrawer";
import { Button } from "@/components/ui/button";
import { getComandaById, fecharComanda } from "@/services/comandaService";
import { Comanda } from "@/types/comanda";
import { PlusCircle, Banknote, ShieldAlert } from "lucide-react"; 
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PedidoStatus } from "@/types/pedido-status.enum";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Função para dar cor aos status
const getStatusVariant = (status: PedidoStatus) => {
  switch (status) {
    case PedidoStatus.FEITO:
      return 'secondary';
    case PedidoStatus.EM_PREPARO:
      return 'default';
    case PedidoStatus.PRONTO:
      return 'success';
    case PedidoStatus.ENTREGUE:
      return 'outline';
    default:
      return 'destructive'; // Vermelho para cancelado
  }
};


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
        toast.error("Falha ao atualizar dados da comanda.");
      } finally {
        setIsLoading(false);
      }
    }
  }, [comandaId]);

  useEffect(() => {
    fetchComanda();
    const intervalId = setInterval(fetchComanda, 10000); // Polling para atualizações
    return () => clearInterval(intervalId);
  }, [fetchComanda]);

  const handleItensAdicionados = () => {
    setIsDrawerOpen(false);
    fetchComanda();
  };

  const handleFecharComanda = async () => {
    if (window.confirm('Confirmar o pagamento e fechar esta comanda?')) {
      try {
        const comandaFechada = await fecharComanda(comandaId);
        setComanda(comandaFechada);
        toast.success('Comanda fechada com sucesso!');
        setTimeout(() => router.push('/dashboard/mesas'), 2000);
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

  const total = comanda.pedidos
    ?.flatMap(pedido => pedido.itens)
    .filter(item => item.status !== PedidoStatus.CANCELADO)
    .reduce((acc, item) => acc + (Number(item.precoUnitario) * item.quantidade), 0) ?? 0;

  // ==================================================================
  // ## Lógica de Fechamento de Comanda (Correta)
  // ==================================================================
  const todosOsItens = comanda.pedidos?.flatMap(pedido => pedido.itens) ?? [];
  const podeFechar = todosOsItens.length > 0 && todosOsItens.every(
    item => item.status === PedidoStatus.ENTREGUE || item.status === PedidoStatus.CANCELADO
  );

  return (
    <div className="p-4 relative min-h-screen pb-40">
      <h1 className="text-3xl font-bold">Comanda da Mesa {comanda.mesa?.numero ?? 'Avulsa'}</h1>
      <p className="text-lg">Status: <span className="font-semibold">{comanda.status}</span></p>
      
      <div className="mt-6">
        <h2 className="text-2xl font-bold border-b pb-2 mb-4">Pedidos</h2>
        
        {!comanda.pedidos || comanda.pedidos.length === 0 ? (
          <p className="text-gray-500 mt-4">Nenhum pedido realizado ainda.</p>
        ) : (
          <div className="space-y-6">
            {comanda.pedidos.map(pedido => (
              <div key={pedido.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">Pedido #{pedido.id.substring(0, 8)}</h3>
                </div>

                <ul className="space-y-3">
                  {pedido.itens.map(item => (
                    <li key={item.id} className="flex justify-between items-center text-sm border-t pt-3 first:border-t-0 first:pt-0">
                      <div>
                        {/* ✅ CORREÇÃO CRÍTICA AQUI: Usa item.observacao se item.produto for null */}
                        <p>
                          <span className="font-semibold">{item.quantidade}x</span> 
                          {item.produto ? item.produto.nome : item.observacao || 'Item Avulso (Verificar)'}
                        </p>
                        
                        {/* Exibe a observação apenas para produtos reais, se a observação do item de entrada já foi usada acima */}
                        {item.observacao && item.produto && <p className="text-xs text-gray-500">Obs: {item.observacao}</p>}
                      </div>
                      <div className="flex items-center gap-4">
                        <p>{formatCurrency(Number(item.precoUnitario) * item.quantidade)}</p>
                        <Badge variant={getStatusVariant(item.status as PedidoStatus)}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        
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
            
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed" onClick={handleFecharComanda} disabled={!podeFechar}>
              <Banknote className="h-6 w-6 mr-2" />
              Confirmar Pagamento e Fechar Comanda
            </Button>
            {!podeFechar && (
              <p className="text-red-600 text-sm mt-3 flex items-center">
                <ShieldAlert className="h-4 w-4 mr-1"/>
                Apenas comandas com todos os itens entregues ou cancelados podem ser fechadas.
              </p>
            )}
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