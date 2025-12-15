'use client';

import { useState, useEffect, useCallback } from 'react';
import { getComandasAbertas } from '@/services/comandaService';
import { Comanda } from '@/types/comanda';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Receipt, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { io, Socket } from 'socket.io-client';

export default function ComandasAbertasPage() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const carregarComandas = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getComandasAbertas();
      setComandas(data);
    } catch (error) {
      logger.error('Erro ao carregar comandas abertas', { module: 'ComandasAbertasPage', error: error as Error });
      toast.error('Erro ao carregar comandas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // WebSocket para atualização em tempo real
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const socket: Socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      logger.log('🔌 WebSocket conectado - Comandas Abertas', { module: 'ComandasAbertasPage' });
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      logger.warn('⚠️ WebSocket desconectado - Comandas Abertas', { module: 'ComandasAbertasPage' });
      setIsConnected(false);
    });

    // Nova comanda criada
    socket.on('nova_comanda', (comanda: Comanda) => {
      logger.log('🆕 Nova comanda recebida via WebSocket', { module: 'ComandasAbertasPage', data: comanda.id });
      if (comanda.status === 'ABERTA') {
        setComandas((prev) => {
          // Evita duplicatas
          if (prev.some((c) => c.id === comanda.id)) return prev;
          return [comanda, ...prev];
        });
        toast.success(`Nova comanda: ${comanda.mesa ? `Mesa ${comanda.mesa.numero}` : comanda.cliente?.nome || 'Balcão'}`);
      }
    });

    // Comanda atualizada (fechada, etc)
    socket.on('comanda_atualizada', (comanda: Comanda) => {
      logger.log('🔄 Comanda atualizada via WebSocket', { module: 'ComandasAbertasPage', data: { id: comanda.id, status: comanda.status } });
      if (comanda.status === 'ABERTA') {
        // Atualiza comanda existente
        setComandas((prev) => prev.map((c) => (c.id === comanda.id ? comanda : c)));
      } else {
        // Remove comanda fechada/paga da lista
        setComandas((prev) => prev.filter((c) => c.id !== comanda.id));
        toast.info(`Comanda ${comanda.mesa ? `Mesa ${comanda.mesa.numero}` : 'Balcão'} foi ${comanda.status.toLowerCase()}`);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    carregarComandas();
  }, [carregarComandas]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/caixa">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Comandas Abertas</h1>
              <p className="text-muted-foreground mt-1">
                {comandas.length} comanda{comandas.length !== 1 ? 's' : ''} aguardando fechamento
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Indicador de conexão WebSocket */}
            <div className="flex items-center gap-1 text-xs">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
            </div>
            <Button onClick={carregarComandas} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Comandas */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando comandas...</p>
        </div>
      ) : comandas.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-xl font-semibold">Nenhuma comanda aberta</p>
            <p className="text-sm mt-2">Todas as comandas foram fechadas! 🎉</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comandas.map((comanda) => (
            <Link href={`/dashboard/comandas/${comanda.id}`} key={comanda.id}>
              <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      {comanda.mesa ? `Mesa ${comanda.mesa.numero}` : 
                       comanda.pontoEntrega ? comanda.pontoEntrega.nome : 
                       'Balcão'}
                    </CardTitle>
                    <Badge 
                      variant={comanda.status === 'ABERTA' ? 'default' : 'secondary'}
                    >
                      {comanda.status}
                    </Badge>
                  </div>
                  <CardDescription className="space-y-2 mt-3">
                    {comanda.cliente && (
                      <div>
                        <p className="font-semibold text-foreground text-base">
                          {comanda.cliente.nome}
                        </p>
                        {comanda.cliente.cpf && (
                          <p className="text-xs">CPF: {comanda.cliente.cpf}</p>
                        )}
                      </div>
                    )}
                    {comanda.mesa?.ambiente && (
                      <p className="text-xs">
                        Ambiente: {comanda.mesa.ambiente.nome}
                      </p>
                    )}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Aberta em: {new Date(comanda.dataAbertura || comanda.criadoEm || new Date()).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold text-lg">
                      R$ {(() => {
                        const total = comanda.pedidos?.reduce((acc, pedido) => {
                          const pedidoTotal = pedido.itens?.reduce((sum, item) => {
                            return sum + (item.precoUnitario * item.quantidade);
                          }, 0) || 0;
                          return acc + pedidoTotal;
                        }, 0) || 0;
                        return total.toFixed(2);
                      })()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
