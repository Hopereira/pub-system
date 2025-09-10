// Caminho: frontend/src/app/(protected)/dashboard/comandas/[id]/page.tsx
'use client';

import { AddItemDrawer } from "@/components/comandas/AddItemDrawer";
import { Button } from "@/components/ui/button";
import { getComandaById, fecharComanda } from "@/services/comandaService"; // ATUALIZADO
import { Comanda } from "@/types/comanda";
import { PlusCircle, CheckCircle, Banknote } from "lucide-react"; // ATUALIZADO
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { updatePedidoStatus } from "@/services/pedidoService";
import { PedidoStatus } from "@/types/pedido";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext"; // NOVO
import { toast } from "sonner"; // NOVO

export default function ComandaDetalhePage() {
  const params = useParams();
  const router = useRouter(); // NOVO
  const comandaId = params.id as string;
  const { user } = useAuth(); // NOVO: Buscamos o usuário do contexto

  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Lógica de permissão
  const isCaixa = user?.cargo === 'ADMIN' || user?.cargo === 'CAIXA';
  const isGarcom = user?.cargo === 'ADMIN' || user?.cargo === 'GARCOM';

  const fetchComanda = useCallback(async () => {
    // ... (lógica fetchComanda, sem alterações)
    if (comandaId) {
      try {
        const data = await getComandaById(comandaId);
        setComanda(data);
      } catch (err) {
        console.error(err); setComanda(null);
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
    // ... (lógica handleMarcarComoEntregue, sem alterações)
    try {
        await updatePedidoStatus(pedidoId, { status: PedidoStatus.ENTREGUE });
        await fetchComanda();
    } catch (error) {
        toast.error("Falha ao marcar o item como entregue.");
        console.error("Erro ao entregar pedido:", error);
    }
  };

  // NOVO: Handler para fechar a comanda
  const handleFecharComanda = async () => {
    if (window.confirm('Confirmar o pagamento e fechar esta comanda?')) {
      try {
        const comandaFechada = await fecharComanda(comandaId);
        setComanda(comandaFechada); // Atualiza o estado para "FECHADA"
        toast.success('Comanda fechada com sucesso!');
        // Opcional: redirecionar para a página do caixa após um tempo
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

  const todosOsItens = comanda.pedidos?.flatMap(pedido => pedido.itens.map(item => ({...item, pedidoStatus: pedido.status, pedidoId: pedido.id }))) ?? [];
  const total = comanda.pedidos?.filter(pedido => pedido.status !== 'CANCELADO').reduce((acc, pedido) => acc + (Number(pedido.total) || 0), 0) ?? 0;

  return (
    <div className="p-4 relative min-h-screen pb-40"> {/* Aumenta o padding inferior */}
      <h1 className="text-3xl font-bold">Comanda da Mesa {comanda.mesa?.numero ?? 'Avulsa'}</h1>
      <p className="text-lg">Status: <span className="font-semibold">{comanda.status}</span></p>
      
      <div className="mt-6">
        <h2 className="text-2xl font-bold">Itens do Pedido</h2>
        {/* ... (renderização da lista de itens, sem alterações) */}
        {todosOsItens.length === 0 ? <p className="text-gray-500 mt-4">Nenhum item adicionado ainda.</p> : ( <ul className="mt-4 space-y-4">{todosOsItens.map(item => ( <li key={item.id} className="flex justify-between items-center border-b pb-4"><div><div className="flex items-center gap-2"><p className="font-semibold">{item.quantidade}x {item.produto.nome}</p><Badge variant={item.pedidoStatus === 'PRONTO' ? 'destructive' : 'secondary'}>{item.pedidoStatus.replace('_', ' ')}</Badge></div>{item.observacao && <p className="text-sm text-gray-500">Obs: {item.observacao}</p>}</div><div className="flex items-center gap-4"><p>{formatCurrency(item.produto.preco * item.quantidade)}</p>{item.pedidoStatus === PedidoStatus.PRONTO && ( <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleMarcarComoEntregue(item.pedidoId)}><CheckCircle className="h-4 w-4 mr-2" />Entregar</Button> )}</div></li> ))}</ul> )}
        <div className="mt-4 pt-4 border-t-2 font-bold text-xl flex justify-between"><span>Total</span><span>{formatCurrency(total)}</span></div>
      </div>

      {/* NOVO: Renderização condicional do Painel de Pagamento */}
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
      
      {/* O botão de Adicionar Itens agora só aparece para o Garçom */}
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