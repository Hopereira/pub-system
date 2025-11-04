// Caminho: frontend/src/components/cozinha/CozinhaPageClient.tsx
'use client';

// 1. Importamos o novo serviço e DTO
import { getPedidos, updateItemStatus } from '@/services/pedidoService';
import { UpdateItemPedidoStatusDto } from '@/types/pedido.dto';
import { Pedido, PedidoStatus } from '@/types/pedido';
import React, { useEffect, useState } from 'react';
import PedidoCard from './PedidoCard';
import { Skeleton } from '../ui/skeleton';
import { socket } from '@/lib/socket';
import { toast } from 'sonner';
import { useAmbienteNotification } from '@/hooks/useAmbienteNotification';
import { Button } from '../ui/button';
import { Bell, BellOff, Filter } from 'lucide-react';
import { getAmbientes } from '@/services/ambienteService';
import { Ambiente } from '@/types/ambiente';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CozinhaPageClientProps {
  ambienteId?: string;
}

export default function CozinhaPageClient({ ambienteId: initialAmbienteId }: CozinhaPageClientProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<string | null>(initialAmbienteId || null);
  
  // Hook de notificação de ambiente - atualiza quando muda a seleção
  const { 
    novoPedidoId, 
    audioConsentNeeded, 
    handleAllowAudio,
    clearNotification 
  } = useAmbienteNotification(ambienteSelecionado);

  // Carrega a lista de ambientes disponíveis
  useEffect(() => {
    const fetchAmbientes = async () => {
      try {
        const data = await getAmbientes();
        setAmbientes(data);
        
        // Se não tem ambiente selecionado e há ambientes disponíveis, seleciona o primeiro
        if (!ambienteSelecionado && data.length > 0) {
          setAmbienteSelecionado(data[0].id);
        }
      } catch (error) {
        toast.error('Erro ao carregar ambientes');
      }
    };
    
    fetchAmbientes();
  }, []);

  // Carrega pedidos inicialmente
  useEffect(() => {
    const fetchPedidos = async () => {
      setIsLoading(true);
      try {
        const data = await getPedidos();
        setPedidos(data);
      } catch (error) {
        toast.error('Erro ao carregar pedidos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPedidos();
  }, []);

  // WebSocket - escuta novos pedidos e atualizações
  useEffect(() => {
    socket.on('novo_pedido', (novoPedido: Pedido) => {
      setPedidos(prev => [novoPedido, ...prev]);
    });

    socket.on('status_atualizado', (pedidoAtualizado: Pedido) => {
      setPedidos(prev => 
        prev.map(p => p.id === pedidoAtualizado.id ? pedidoAtualizado : p)
      );
    });

    return () => {
      socket.off('novo_pedido');
      socket.off('status_atualizado');
    };
  }, []);

  // --- FUNÇÃO DE ATUALIZAÇÃO REFEITA ---
  const handleItemStatusChange = async (itemPedidoId: string, novoStatus: PedidoStatus) => {
      try {
        const data: UpdateItemPedidoStatusDto = { status: novoStatus };
        // 2. Chamamos o novo serviço que atualiza um item específico
        await updateItemStatus(itemPedidoId, data);
        toast.success(`Item atualizado para ${novoStatus.replace('_', ' ')}!`);
        
        // A mágica do WebSocket continua a funcionar: o backend emitirá um evento
        // 'status_atualizado' que será capturado pelo nosso useEffect,
        // atualizando a UI com o pedido completo e os novos status dos itens.
      } catch (err: any) {
        toast.error(err.message || 'Falha ao atualizar o status do item.');
      }
  };
  // --- FIM DA REATORAÇÃO ---

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  // Filtra pedidos que contêm itens do ambiente selecionado
  const pedidosFiltrados = ambienteSelecionado
    ? pedidos.filter(pedido => 
        pedido.itens.some(item => item.produto?.ambiente?.id === ambienteSelecionado)
      )
    : pedidos;

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Pedidos de Preparo</h1>
          
          {/* Seletor de Ambiente */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select 
              value={ambienteSelecionado || undefined} 
              onValueChange={setAmbienteSelecionado}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione o ambiente" />
              </SelectTrigger>
              <SelectContent>
                {ambientes.map(ambiente => (
                  <SelectItem key={ambiente.id} value={ambiente.id}>
                    {ambiente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Botão para ativar som de notificação */}
        {audioConsentNeeded && (
          <Button 
            onClick={handleAllowAudio} 
            variant="secondary" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Ativar Som de Notificações
          </Button>
        )}
        
        {!audioConsentNeeded && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4 text-green-600" />
            <span>Notificações ativadas</span>
          </div>
        )}
      </div>

      {pedidosFiltrados.length === 0 ? (
        <p className='text-center text-muted-foreground mt-10'>
          {ambienteSelecionado 
            ? 'Nenhum pedido aguardando preparo neste ambiente.' 
            : 'Selecione um ambiente para ver os pedidos.'}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pedidosFiltrados.map(pedido => (
            // 3. Passamos a nova função com o nome correto para o PedidoCard
            // Destaca o pedido se for novo
            <div 
              key={pedido.id}
              className={`transition-all duration-500 ${
                novoPedidoId === pedido.id 
                  ? 'ring-4 ring-green-500 ring-opacity-50 animate-pulse' 
                  : ''
              }`}
            >
              <PedidoCard 
                pedido={pedido} 
                onItemStatusChange={handleItemStatusChange} 
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}