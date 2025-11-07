'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getPedidos } from '@/services/pedidoService';
import { Pedido, ItemPedido, PedidoStatus } from '@/types/pedido';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { Clock, User, MapPin, Package, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { socket } from '@/lib/socket';

interface ItemPendente {
  id: string;
  produto: string;
  quantidade: number;
  status: PedidoStatus;
  criadoEm: Date;
  ambiente: {
    id: string;
    nome: string;
  };
  pedido: {
    id: string;
    cliente?: {
      nome: string;
    };
    mesa?: {
      numero: number;
    };
  };
  funcionario: {
    nome: string;
  };
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
            itens.push({
              id: item.id,
              produto: item.produto.nome,
              quantidade: item.quantidade,
              status: item.status,
              criadoEm: new Date(item.criadoEm),
              ambiente: {
                id: item.ambiente.id,
                nome: item.ambiente.nome,
              },
              pedido: {
                id: pedido.id,
                cliente: pedido.cliente,
                mesa: pedido.mesa,
              },
              funcionario: {
                nome: pedido.funcionario.nome,
              },
            });
          });
      });

      // Ordena por mais antigos primeiro
      itens.sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime());
      
      setItensPendentes(itens);
      logger.log('✅ Pedidos pendentes carregados', { 
        module: 'PedidosPendentes',
        total: itens.length 
      });
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

  const getStatusBadge = (status: PedidoStatus) => {
    const statusConfig = {
      FEITO: { label: 'Feito', color: 'bg-yellow-500' },
      EM_PREPARO: { label: 'Em Preparo', color: 'bg-blue-500' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: 'bg-gray-500',
    };

    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const getTempoCorClass = (criadoEm: Date) => {
    const minutos = Math.floor((Date.now() - criadoEm.getTime()) / 60000);
    
    if (minutos > 8) return 'text-red-600 dark:text-red-400 font-bold';
    if (minutos > 5) return 'text-orange-600 dark:text-orange-400 font-semibold';
    return 'text-green-600 dark:text-green-400';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos Pendentes</h1>
          <p className="text-muted-foreground mt-1">
            Carregando...
          </p>
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
          Acompanhe todos os itens aguardando preparo ou em preparo
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pendente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{itensPendentes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Itens aguardando ou em preparo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Feito (Aguardando)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {itensPendentes.filter(i => i.status === 'FEITO').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando início do preparo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Preparo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {itensPendentes.filter(i => i.status === 'EM_PREPARO').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Sendo preparados agora
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Itens Pendentes */}
      {itensPendentes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhum pedido pendente
            </p>
            <p className="text-sm text-muted-foreground">
              Todos os pedidos foram preparados! 🎉
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {itensPendentes.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Produto e Quantidade */}
                  <div className="md:col-span-2">
                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 text-muted-foreground mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg">{item.produto}</h3>
                        <p className="text-sm text-muted-foreground">
                          Quantidade: {item.quantidade}x
                        </p>
                        <div className="mt-2">
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quem Fez o Pedido */}
                  <div>
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Solicitado por
                        </p>
                        <p className="font-medium">{item.funcionario.nome}</p>
                        {item.pedido.mesa && (
                          <p className="text-sm text-muted-foreground">
                            Mesa {item.pedido.mesa.numero}
                          </p>
                        )}
                        {item.pedido.cliente && (
                          <p className="text-sm text-muted-foreground">
                            Cliente: {item.pedido.cliente.nome}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ambiente de Preparo */}
                  <div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Ambiente
                        </p>
                        <p className="font-medium">{item.ambiente.nome}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tempo de Pendência */}
                  <div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          Tempo de Espera
                        </p>
                        <p className={getTempoCorClass(item.criadoEm)}>
                          {formatDistanceToNow(item.criadoEm, {
                            locale: ptBR,
                            addSuffix: true,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.floor((Date.now() - item.criadoEm.getTime()) / 60000)} min
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alerta de Tempo Crítico */}
                {Math.floor((Date.now() - item.criadoEm.getTime()) / 60000) > 15 && (
                  <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      Atenção: Este item está há mais de 15 minutos pendente!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
