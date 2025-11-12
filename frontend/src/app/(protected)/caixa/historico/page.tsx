'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Calendar, DollarSign, Receipt, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Fechamento {
  id: string;
  data: string;
  hora: string;
  comandasTotal: number;
  valorTotal: number;
  operador: string;
  status: 'ABERTO' | 'FECHADO' | 'CONFERIDO';
}

export default function CaixaHistoricoPage() {
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<Fechamento[]>([]);

  useEffect(() => {
    carregarHistorico();
  }, []);

  const carregarHistorico = async () => {
    setLoading(true);
    try {
      // TODO: Integrar com backend
      // const data = await caixaService.getHistoricoFechamentos();
      
      // Placeholder data
      const hoje = new Date().toISOString().split('T')[0];
      const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      setHistorico([
        {
          id: '1',
          data: hoje,
          hora: '12:11',
          comandasTotal: 8,
          valorTotal: 1250.50,
          operador: 'João (Caixa)',
          status: 'ABERTO'
        },
        {
          id: '2',
          data: ontem,
          hora: '23:45',
          comandasTotal: 15,
          valorTotal: 2890.00,
          operador: 'Maria (Caixa)',
          status: 'FECHADO'
        },
        {
          id: '3',
          data: ontem,
          hora: '14:30',
          comandasTotal: 12,
          valorTotal: 2150.75,
          operador: 'Pedro (Caixa)',
          status: 'CONFERIDO'
        }
      ]);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatData = (data: string) => {
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'ABERTO': 'default',
      'FECHADO': 'secondary',
      'CONFERIDO': 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/caixa">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Histórico de Fechamentos</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Acompanhe os fechamentos realizados
          </p>
        </div>
        <Button onClick={carregarHistorico} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Lista de Fechamentos */}
      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Carregando histórico...</p>
          </CardContent>
        </Card>
      ) : historico.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Nenhum fechamento encontrado</p>
            <p className="text-sm text-muted-foreground">
              O histórico de fechamentos aparecerá aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {historico.map((fechamento) => (
            <Card key={fechamento.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Receipt className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        Fechamento #{fechamento.id.padStart(5, '0')}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatData(fechamento.data)} às {fechamento.hora}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(fechamento.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Valor Total */}
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(fechamento.valorTotal)}
                      </p>
                    </div>
                  </div>

                  {/* Comandas */}
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <Receipt className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Comandas</p>
                      <p className="text-xl font-bold text-blue-600">
                        {fechamento.comandasTotal}
                      </p>
                    </div>
                  </div>

                  {/* Operador */}
                  <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <Clock className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Operador</p>
                      <p className="text-base font-semibold text-purple-600">
                        {fechamento.operador}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ticket Médio */}
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ticket médio:</span>
                  <span className="font-semibold">
                    {formatCurrency(fechamento.valorTotal / fechamento.comandasTotal)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resumo Geral */}
      {historico.length > 0 && (
        <Card className="bg-slate-50 dark:bg-slate-950">
          <CardHeader>
            <CardTitle>Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Total de fechamentos:</span>
              <span className="font-semibold">{historico.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Total geral em vendas:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(historico.reduce((acc, f) => acc + f.valorTotal, 0))}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">Total de comandas:</span>
              <span className="font-semibold">
                {historico.reduce((acc, f) => acc + f.comandasTotal, 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Observação */}
      <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="text-base">⚠️ Observação</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            Esta funcionalidade está em desenvolvimento. Em breve você poderá visualizar
            relatórios detalhados, exportar dados e conferir fechamentos de caixa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
