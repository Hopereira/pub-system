'use client';

import { useEffect, useState, useRef } from 'react';
import { RefreshCw, Package, Filter } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { getPedidosProntos, marcarComoEntregue, retirarItem } from '@/services/pedidoService';
import { getAmbientes } from '@/services/ambienteService';
import { useAuth } from '@/context/AuthContext';
import { Ambiente } from '@/types/ambiente';
import { PedidoProntoCard } from '@/components/pedidos/PedidoProntoCard';
import { DeixarNoAmbienteModal } from '@/components/pedidos/DeixarNoAmbienteModal';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface PedidoPronto {
  pedidoId: string;
  comandaId: string;
  cliente: string;
  local: {
    tipo: 'MESA' | 'PONTO_ENTREGA';
    mesa?: { numero: number; ambiente: string };
    pontoEntrega?: { nome: string; mesaProxima?: number; ambientePreparo: string };
  };
  itens: Array<{
    id: string;
    produto: { nome: string };
    quantidade: number;
    observacao?: string;
    status?: string;
  }>;
  tempoEspera: string;
  data: Date;
}

const PedidosProntosPage = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoPronto[]>([]);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<string>('todos');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [comandasDestacadas, setComandasDestacadas] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Estado do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<{
    id: string;
    produtoNome: string;
    localEntrega: string;
  } | null>(null);

  useEffect(() => {
    loadInitialData();
    
    // Conectar ao WebSocket
    const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    socketRef.current = io(SOCKET_URL);
    
    socketRef.current.on('connect', () => {
      logger.log('🔌 WebSocket conectado', { module: 'PedidosProntosPage' });
    });
    
    // Escuta mudanças de ponto de entrega
    socketRef.current.on('comanda_atualizada', (comanda: any) => {
      logger.log('📍 Comanda atualizada - local mudou', { 
        module: 'PedidosProntosPage',
        data: { comandaId: comanda.id }
      });
      
      // Destaca o card por 5 segundos
      setComandasDestacadas(prev => new Set(prev).add(comanda.id));
      
      // Remove destaque anterior se existir
      const timeoutAnterior = timeoutsRef.current.get(comanda.id);
      if (timeoutAnterior) {
        clearTimeout(timeoutAnterior);
      }
      
      // Remove destaque após 5 segundos
      const novoTimeout = setTimeout(() => {
        setComandasDestacadas(prev => {
          const novo = new Set(prev);
          novo.delete(comanda.id);
          return novo;
        });
        timeoutsRef.current.delete(comanda.id);
      }, 5000);
      
      timeoutsRef.current.set(comanda.id, novoTimeout);
      
      // Recarrega pedidos para mostrar novo local
      loadPedidos();
    });
    
    return () => {
      // Limpa todos os timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
      
      // Desconecta WebSocket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    loadPedidos();
  }, [ambienteSelecionado]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [pedidosData, ambientesData] = await Promise.all([
        getPedidosProntos(),
        getAmbientes(),
      ]);
      setPedidos(pedidosData || []);
      // Filtrar apenas ambientes de preparo
      const ambientesPreparo = ambientesData?.filter((amb) => amb.tipo === 'PREPARO') || [];
      setAmbientes(ambientesPreparo);
    } catch (error) {
      logger.error('❌ Erro ao carregar dados', {
        module: 'PedidosProntosPage',
        error: error as Error,
      });
      toast.error('Erro ao carregar pedidos prontos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPedidos = async () => {
    try {
      setIsRefreshing(true);
      const ambienteId = ambienteSelecionado === 'todos' ? undefined : ambienteSelecionado;
      const data = await getPedidosProntos(ambienteId);
      setPedidos(data || []);
      logger.log(`✅ ${data.length} pedidos prontos carregados`, {
        module: 'PedidosProntosPage',
      });
    } catch (error) {
      logger.error('❌ Erro ao atualizar pedidos', {
        module: 'PedidosProntosPage',
        error: error as Error,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeixarNoAmbiente = (itemId: string, pedido: PedidoPronto) => {
    const item = pedido.itens.find((i) => i.id === itemId);
    if (!item) return;

    let localEntrega = '';
    if (pedido.local.tipo === 'MESA' && pedido.local.mesa) {
      localEntrega = `Mesa ${pedido.local.mesa.numero} - ${pedido.local.mesa.ambiente}`;
    } else if (pedido.local.tipo === 'PONTO_ENTREGA' && pedido.local.pontoEntrega) {
      localEntrega = pedido.local.pontoEntrega.nome;
    }

    setItemSelecionado({
      id: itemId,
      produtoNome: item.produto.nome,
      localEntrega,
    });
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadPedidos(); // Recarregar lista após sucesso
  };

  const handleMarcarEntregue = async (itemId: string) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    // Verifica se é garçom
    if (user.cargo !== 'GARCOM') {
      toast.error('Apenas garçons podem entregar pedidos');
      return;
    }

    try {
      // 1º Passo: RETIRAR (PRONTO → RETIRADO)
      // Backend valida se item está PRONTO, se não estiver retorna erro específico
      logger.log('🛍️ Retirando item...', {
        module: 'PedidosProntosPage',
        data: { itemId }
      });
      
      try {
        await retirarItem(itemId, user.id);
      } catch (retirarError: any) {
        // Se erro for "já retirado", continua para entrega
        const mensagem = retirarError.response?.data?.message || '';
        if (mensagem.includes('Status atual: RETIRADO')) {
          logger.log('⏭️ Item já foi retirado, pulando para entrega...', {
            module: 'PedidosProntosPage',
            data: { itemId }
          });
        } else {
          // Outro erro, propaga
          throw retirarError;
        }
      }
      
      // 2º Passo: ENTREGAR (RETIRADO → ENTREGUE)
      logger.log('📦 Marcando como entregue...', {
        module: 'PedidosProntosPage',
        data: { itemId }
      });
      await marcarComoEntregue(itemId, user.id);
      
      toast.success('Item entregue com sucesso!');
      loadPedidos(); // Recarregar lista
    } catch (error: any) {
      logger.error('Erro ao entregar item', {
        module: 'PedidosProntosPage',
        error: error as Error,
      });
      toast.error(error.response?.data?.message || 'Erro ao entregar item');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando pedidos prontos...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="w-8 h-8" />
            Pedidos Prontos
          </h1>
          <p className="text-muted-foreground mt-1">
            {pedidos.length} {pedidos.length === 1 ? 'pedido aguardando' : 'pedidos aguardando'}{' '}
            entrega
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Filtro por Ambiente */}
          <Select value={ambienteSelecionado} onValueChange={setAmbienteSelecionado}>
            <SelectTrigger className="w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por ambiente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Ambientes</SelectItem>
              {ambientes.map((ambiente) => (
                <SelectItem key={ambiente.id} value={ambiente.id}>
                  {ambiente.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Botão Atualizar */}
          <Button
            variant="outline"
            size="icon"
            onClick={loadPedidos}
            disabled={isRefreshing}
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Lista de Pedidos */}
      {pedidos.length === 0 ? (
        <Alert>
          <Package className="w-4 h-4" />
          <AlertDescription>
            Nenhum pedido pronto no momento.
            {ambienteSelecionado !== 'todos' && ' Tente remover o filtro de ambiente.'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {pedidos.map((pedido) => (
            <div
              key={pedido.pedidoId}
              className={`transition-all duration-500 ${
                comandasDestacadas.has(pedido.comandaId)
                  ? 'ring-4 ring-blue-500 ring-offset-2 shadow-2xl scale-105'
                  : ''
              }`}
            >
              <PedidoProntoCard
                pedidoId={pedido.pedidoId}
                comandaId={pedido.comandaId}
                cliente={pedido.cliente}
                local={pedido.local}
                itens={pedido.itens}
                tempoEspera={pedido.tempoEspera}
                data={pedido.data}
                onDeixarNoAmbiente={(itemId) => handleDeixarNoAmbiente(itemId, pedido)}
                onMarcarEntregue={handleMarcarEntregue}
                isDestacado={comandasDestacadas.has(pedido.comandaId)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal Deixar no Ambiente */}
      <DeixarNoAmbienteModal
        itemId={itemSelecionado?.id || null}
        produtoNome={itemSelecionado?.produtoNome}
        localEntrega={itemSelecionado?.localEntrega}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default PedidosProntosPage;
