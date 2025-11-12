'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, DollarSign, Receipt, Users, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function CaixaRelatoriosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [estatisticas, setEstatisticas] = useState({
    vendasDia: 0,
    comandasFechadas: 0,
    ticketMedio: 0,
    clientesAtendidos: 0,
  });

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    setLoading(true);
    try {
      // TODO: Integrar com backend
      // const data = await caixaService.getEstatisticasDia();
      
      // Placeholder data
      setEstatisticas({
        vendasDia: 2450.80,
        comandasFechadas: 12,
        ticketMedio: 204.23,
        clientesAtendidos: 18,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
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
            <h1 className="text-3xl font-bold">Relatórios do Dia</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Acompanhe o desempenho das vendas de hoje
          </p>
        </div>
        <Button onClick={carregarEstatisticas} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total em Vendas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total em Vendas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(estatisticas.vendasDia)}
            </div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>

        {/* Comandas Fechadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Comandas Fechadas
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.comandasFechadas}</div>
            <p className="text-xs text-muted-foreground">Comandas</p>
          </CardContent>
        </Card>

        {/* Ticket Médio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ticket Médio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(estatisticas.ticketMedio)}
            </div>
            <p className="text-xs text-muted-foreground">Por comanda</p>
          </CardContent>
        </Card>

        {/* Clientes Atendidos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes Atendidos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.clientesAtendidos}</div>
            <p className="text-xs text-muted-foreground">Pessoas</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo do Caixa */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Caixa</CardTitle>
          <CardDescription>Operador: {user?.nome}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Total de vendas:</span>
            <span className="font-semibold">{formatCurrency(estatisticas.vendasDia)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Comandas fechadas:</span>
            <span className="font-semibold">{estatisticas.comandasFechadas}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Ticket médio:</span>
            <span className="font-semibold">{formatCurrency(estatisticas.ticketMedio)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Clientes atendidos:</span>
            <span className="font-semibold">{estatisticas.clientesAtendidos} pessoas</span>
          </div>
        </CardContent>
      </Card>

      {/* Observação */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base">📊 Observação</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            Os dados apresentados são referentes ao dia atual e são atualizados em tempo real.
            Para relatórios completos e históricos, consulte o sistema administrativo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
