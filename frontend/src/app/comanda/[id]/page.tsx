'use client';

import { AddItemDrawer } from "@/components/comandas/AddItemDrawer";
import { Button } from "@/components/ui/button";
import { fecharComanda } from "@/services/comandaService";
import { PlusCircle, Banknote, ShieldAlert, MapPin } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PedidoStatus } from "@/types/pedido-status.enum";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { useAdminComandaSubscription } from "@/hooks/useAdminComandaSubscription";
import { MudarLocalModal } from "@/components/pontos-entrega/MudarLocalModal";

// Função para dar cor aos status (pode ser movida para um ficheiro de 'utils' no futuro)
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
      return 'destructive';
  }
};


export default function ComandaDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const comandaId = params.id as string;
  const { user } = useAuth();

  // Toda a lógica de busca de dados e estado agora vem do nosso hook!
  const { comanda, isLoading, error, fetchComanda } = useAdminComandaSubscription(comandaId);
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);

  const isCaixa = user?.cargo === 'ADMIN' || user?.cargo === 'CAIXA';
  const isGarcom = user?.cargo === 'ADMIN' || user?.cargo === 'GARCOM';

  // Usamos a função 'fetchComanda' retornada pelo hook para atualizar a tela
  const handleItensAdicionados = () => {
    setIsDrawerOpen(false);
    fetchComanda();
  };

  const handleFecharComanda = async () => {
    if (window.confirm('Confirmar o pagamento e fechar esta comanda?')) {
      try {
        await fecharComanda(comandaId, { formaPagamento: 'DINHEIRO' });
        // Não precisamos de 'setComanda', o hook já vai receber a atualização via WebSocket
        toast.success('Comanda fechada com sucesso!');
        // A navegação pode continuar como estava
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
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!comanda) return <div className="p-4 text-gray-500">Nenhum dado de comanda disponível.</div>;

  // As lógicas de cálculo continuam as mesmas e perfeitas
  const total = comanda.pedidos
    ?.flatMap(pedido => pedido.itens)
    .filter(item => item.status !== PedidoStatus.CANCELADO)
    .reduce((acc, item) => acc + (Number(item.precoUnitario) * item.quantidade), 0) ?? 0;

  const todosOsItens = comanda.pedidos?.flatMap(pedido => pedido.itens) ?? [];
  const podeFechar = todosOsItens.length > 0 && todosOsItens.every(
    item => item.status === PedidoStatus.ENTREGUE || 
            item.status === PedidoStatus.RETIRADO || 
            item.status === PedidoStatus.CANCELADO
  );

  return (
    <div className="p-4 relative min-h-screen pb-40">
      <h1 className="text-3xl font-bold">
        Sua Comanda - {comanda.mesa?.numero ? `Mesa ${comanda.mesa.numero}` : 'Balcão'}
      </h1>
      <p className="text-sm text-gray-600 mt-1">
        Acompanhe seus pedidos e o total da sua conta.
      </p>

      {/* Seção: Local de Entrega */}
      {comanda.status === 'ABERTA' && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Local de Retirada</p>
                <p className="text-sm text-gray-600">
                  {comanda.pontoEntrega?.nome || 'Nenhum local definido'}
                </p>
                {comanda.pontoEntrega?.descricao && (
                  <p className="text-xs text-gray-500 mt-1">
                    {comanda.pontoEntrega.descricao}
                  </p>
                )}
                {comanda.pontoEntrega?.ambienteAtendimento && (
                  <p className="text-xs text-blue-700 font-medium mt-2">
                    📍 Você está em: {comanda.pontoEntrega.ambienteAtendimento.nome}
                  </p>
                )}
                {comanda.pontoEntrega?.ambientePreparo && (
                  <p className="text-xs text-gray-500 mt-1">
                    🍳 Pedido vem de: {comanda.pontoEntrega.ambientePreparo.nome}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLocalModalOpen(true)}
              className="whitespace-nowrap"
            >
              <MapPin className="w-4 h-4 mr-1" />
              Mudar Local
            </Button>
          </div>
        </div>
      )}
      
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
                        <p><span className="font-semibold">{item.quantidade}x</span> {item.produto.nome}</p>
                        {item.observacao && <p className="text-xs text-gray-500">Obs: {item.observacao}</p>}
                      </div>
                      <div className="flex items-center gap-4">
                        <p>{formatCurrency(Number(item.precoUnitario) * item.quantidade)}</p>
                        <Badge variant={getStatusVariant(item.status || PedidoStatus.FEITO)}>
                          {(item.status || 'FEITO').replace('_', ' ')}
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
                Aguarde todos os itens serem entregues/retirados ou cancelados para fechar.
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

      <MudarLocalModal
        comandaId={comandaId}
        pontoAtualId={comanda.pontoEntrega?.id}
        agregadosAtuais={comanda.agregados}
        open={isLocalModalOpen}
        onOpenChange={setIsLocalModalOpen}
        onSuccess={fetchComanda}
      />
    </div>
  );
}