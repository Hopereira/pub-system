'use client';

import { useState, useEffect } from 'react';
import { getComandasAbertas } from '@/services/comandaService';
import { Comanda } from '@/types/comanda';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Receipt, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export default function ComandasAbertasPage() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const carregarComandas = async () => {
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
  };

  useEffect(() => {
    carregarComandas();
  }, []);

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
          <Button onClick={carregarComandas} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
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
                        Aberta em: {new Date(comanda.dataAbertura).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold text-lg">
                      R$ {(comanda.valorTotal || 0).toFixed(2)}
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
