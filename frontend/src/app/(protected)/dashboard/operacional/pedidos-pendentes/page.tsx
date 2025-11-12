'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPedidos } from '@/services/pedidoService';
import { Pedido, ItemPedido, PedidoStatus } from '@/types/pedido';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { Clock, User, MapPin, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { socket } from '@/lib/socket';

interface ItemPendente {
  id: string;
  produto: string;
  quantidade: number;
  status: PedidoStatus;
  criadoEm: Date;
  ambiente: string;
  funcionario: string;
  mesa?: number;
  cliente?: string;
}

export default function PedidosPendentesPage() {
  const [itensPendentes, setItensPendentes] = useState<ItemPendente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPedidosPendentes = async () => {
    try {
      const pedidos = await getPedidos();
      
      // Extrai todos os itens pendentes (FEITO ou EM_PREPARO)
      const itens: ItemPendente[] = [];
      
      pedidos.forEach((pedido: Pedido) => {
        pedido.itens
          .filter((item: ItemPedido) => 
            item.status === 'FEITO' || item.status === 'EM_PREPARO'
          )
          .forEach((item: ItemPedido) => {
            // Validar se criadoEm existe e é válido (vem do pedido, não do item)
            const criadoEm = pedido.data ? new Date(pedido.data) : new Date();
            
            // Verificar se a data é válida
            if (isNaN(criadoEm.getTime())) {
              logger.warn('⚠️ Data inválida no pedido', {
                module: 'PedidosPendentes',
                data: { pedidoId: pedido.id, data: pedido.data }
              });
              return; // Pula este item
            }
            
            itens.push({
              id: item.id,
              produto: item.produto.nome,
              quantidade: item.quantidade,
              status: item.status,
              criadoEm: criadoEm,
              ambiente: item.produto?.ambiente?.nome || 'N/A',
              funcionario: pedido.comanda?.cliente?.nome || 'N/A',
              mesa: pedido.comanda?.mesa?.numero,
              cliente: pedido.comanda?.cliente?.nome,
            });
          });
      });

      // Ordena por mais antigos primeiro
      itens.sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime());
      
      setItensPendentes(itens);
    } catch (error) {
      logger.error('❌ Erro ao carregar pedidos pendentes', {
        module: 'PedidosPendentes',
        error: error as Error,
      });
      toast.error('Erro ao carregar pedidos pendentes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPedidosPendentes();

    // Atualiza a cada 30 segundos
    const interval = setInterval(loadPedidosPendentes, 30000);

    // WebSocket - atualiza em tempo real
    socket.on('novo_pedido', loadPedidosPendentes);
    socket.on('status_atualizado', loadPedidosPendentes);
    socket.on('item_iniciado', loadPedidosPendentes);
    socket.on('item_quase_pronto', loadPedidosPendentes);
    socket.on('item_pronto', loadPedidosPendentes);

    return () => {
      clearInterval(interval);
      socket.off('novo_pedido');
      socket.off('status_atualizado');
      socket.off('item_iniciado');
      socket.off('item_quase_pronto');
      socket.off('item_pronto');
    };
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos Pendentes</h1>
          <p className="text-muted-foreground mt-1">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pedidos Pendentes</h1>
        <p className="text-muted-foreground mt-1">
          {itensPendentes.length} {itensPendentes.length === 1 ? 'item' : 'itens'} aguardando preparo ou em preparo
        </p>
      </div>

      {/* Lista Simples */}
      {itensPendentes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-muted-foreground">
              Nenhum pedido pendente
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {itensPendentes.map((item) => {
            const minutos = Math.floor((Date.now() - item.criadoEm.getTime()) / 60000);
            const isUrgente = minutos > 15;
            
            return (
              <Card key={item.id} className={isUrgente ? 'border-red-500 border-2' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Produto e Info */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{item.quantidade}x {item.produto}</h3>
                        <Badge className={
                          item.status === 'FEITO' 
                            ? 'bg-yellow-500 text-white' 
                            : 'bg-blue-500 text-white'
                        }>
                          {item.status === 'FEITO' ? 'Feito' : 'Em Preparo'}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-col gap-2 text-sm">
                        {/* Cliente e Mesa */}
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-foreground">
                            {item.cliente || 'Cliente não identificado'}
                          </span>
                          {item.mesa && (
                            <Badge variant="outline" className="ml-2">
                              Mesa {item.mesa}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Ambiente (onde foi preparado) */}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-orange-600" />
                          <span className="text-muted-foreground">
                            Preparado em: <span className="font-medium text-foreground">{item.ambiente}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tempo */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className={`font-semibold ${
                          minutos > 8 ? 'text-red-600' : 
                          minutos > 5 ? 'text-orange-600' : 
                          'text-green-600'
                        }`}>
                          {minutos} min
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(item.criadoEm, { locale: ptBR, addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Alerta Urgente */}
                  {isUrgente && (
                    <div className="mt-3 flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/20 rounded">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <p className="text-sm font-medium text-red-600">
                        Atenção: Mais de 15 minutos pendente!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
