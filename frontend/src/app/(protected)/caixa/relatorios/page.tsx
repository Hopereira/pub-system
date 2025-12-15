'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Users, 
  RefreshCw,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
} from 'lucide-react';
import Link from 'next/link';
import caixaService, { RelatorioVendasPorCaixa, CaixaVendas } from '@/services/caixaService';

type Periodo = 'hoje' | 'semana' | 'mes';

export default function CaixaRelatoriosPage() {
  const [loading, setLoading] = useState(false);
  const [periodo, setPeriodo] = useState<Periodo>('hoje');
  const [relatorio, setRelatorio] = useState<RelatorioVendasPorCaixa | null>(null);

  const carregarRelatorio = useCallback(async () => {
    setLoading(true);
    try {
      const data = await caixaService.getRelatorioVendasPorCaixa({ periodo });
      setRelatorio(data);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    carregarRelatorio();
  }, [carregarRelatorio]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getFormaPagamentoIcon = (forma: string) => {
    switch (forma) {
      case 'DINHEIRO':
        return <Banknote className="h-4 w-4" />;
      case 'PIX':
        return <Smartphone className="h-4 w-4" />;
      case 'DEBITO':
      case 'CREDITO':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getFormaPagamentoLabel = (forma: string) => {
    const labels: Record<string, string> = {
      DINHEIRO: 'Dinheiro',
      PIX: 'PIX',
      DEBITO: 'Débito',
      CREDITO: 'Crédito',
      VALE_REFEICAO: 'Vale Refeição',
      VALE_ALIMENTACAO: 'Vale Alimentação',
    };
    return labels[forma] || forma;
  };

  const getPeriodoLabel = (p: Periodo) => {
    const labels: Record<Periodo, string> = {
      hoje: 'Hoje',
      semana: 'Esta Semana',
      mes: 'Este Mês',
    };
    return labels[p];
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/caixa">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold">Relatório de Vendas por Caixa</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Acompanhe o desempenho de cada operador de caixa
          </p>
        </div>
        <Button onClick={carregarRelatorio} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Filtros de Período */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-2 mr-4">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Período:</span>
        </div>
        {(['hoje', 'semana', 'mes'] as Periodo[]).map((p) => (
          <Button
            key={p}
            variant={periodo === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriodo(p)}
          >
            {getPeriodoLabel(p)}
          </Button>
        ))}
      </div>

      {/* Cards de Resumo Geral */}
      {relatorio && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Geral */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(relatorio.resumo.totalGeral)}
              </div>
              <p className="text-xs text-muted-foreground">{getPeriodoLabel(periodo)}</p>
            </CardContent>
          </Card>

          {/* Quantidade de Vendas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Realizadas</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{relatorio.resumo.quantidadeTotal}</div>
              <p className="text-xs text-muted-foreground">Transações</p>
            </CardContent>
          </Card>

          {/* Ticket Médio */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(relatorio.resumo.ticketMedio)}
              </div>
              <p className="text-xs text-muted-foreground">Por venda</p>
            </CardContent>
          </Card>

          {/* Caixas Ativos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operadores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{relatorio.resumo.quantidadeCaixas}</div>
              <p className="text-xs text-muted-foreground">Caixas com vendas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vendas por Caixa (Funcionário) */}
      {relatorio && relatorio.caixas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Vendas por Operador de Caixa
            </CardTitle>
            <CardDescription>
              Período: {formatDate(relatorio.periodo.dataInicio)} a {formatDate(relatorio.periodo.dataFim)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatorio.caixas.map((caixa: CaixaVendas, index: number) => (
                <div
                  key={caixa.funcionarioId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 mb-3 sm:mb-0">
                    {/* Posição no ranking */}
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : ''}
                      ${index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' : ''}
                      ${index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' : ''}
                      ${index > 2 ? 'bg-muted text-muted-foreground' : ''}
                    `}>
                      {index + 1}º
                    </div>
                    <div>
                      <p className="font-semibold">{caixa.funcionarioNome}</p>
                      <p className="text-sm text-muted-foreground">
                        {caixa.quantidadeVendas} {caixa.quantidadeVendas === 1 ? 'venda' : 'vendas'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Formas de pagamento */}
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(caixa.porFormaPagamento).map(([forma, dados]) => (
                        <Badge key={forma} variant="secondary" className="text-xs">
                          {getFormaPagamentoIcon(forma)}
                          <span className="ml-1">{formatCurrency(dados.valor)}</span>
                        </Badge>
                      ))}
                    </div>
                    {/* Total do caixa */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(caixa.totalVendas)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo por Forma de Pagamento */}
      {relatorio && Object.keys(relatorio.resumo.porFormaPagamento).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Resumo por Forma de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(relatorio.resumo.porFormaPagamento).map(([forma, dados]) => (
                <div
                  key={forma}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {getFormaPagamentoIcon(forma)}
                    <div>
                      <p className="font-medium">{getFormaPagamentoLabel(forma)}</p>
                      <p className="text-sm text-muted-foreground">
                        {dados.quantidade} {dados.quantidade === 1 ? 'transação' : 'transações'}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold">{formatCurrency(dados.valor)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {relatorio && relatorio.caixas.length === 0 && (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma venda registrada</p>
            <p className="text-sm text-muted-foreground">
              Não há vendas no período selecionado ({getPeriodoLabel(periodo)})
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
