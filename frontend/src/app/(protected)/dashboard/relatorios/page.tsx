'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/analytics/MetricCard';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  Clock, 
  Package, 
  TrendingUp,
  Users,
  ChefHat,
  RefreshCw,
  Calendar,
  Download
} from 'lucide-react';
import { getRelatorioGeral } from '@/services/analyticsService';
import { RelatorioGeral } from '@/types/analytics';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export default function RelatoriosPage() {
  const [relatorio, setRelatorio] = useState<RelatorioGeral | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadRelatorio();
  }, []);

  const loadRelatorio = async () => {
    try {
      setIsLoading(true);
      
      // Últimos 30 dias por padrão
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - 30);
      
      const data = await getRelatorioGeral({
        dataInicio,
        dataFim: new Date(),
        limite: 10,
      });
      
      setRelatorio(data);
      logger.log('✅ Relatório carregado', { module: 'RelatoriosPage' });
    } catch (error) {
      logger.error('❌ Erro ao carregar relatório', {
        module: 'RelatoriosPage',
        error: error as Error,
      });
      toast.error('Erro ao carregar relatório');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRelatorio();
    setIsRefreshing(false);
    toast.success('Relatório atualizado!');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  if (!relatorio) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Erro ao carregar relatório</p>
          <Button onClick={loadRelatorio}>Tentar Novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios e Analytics</h1>
          <p className="text-muted-foreground">
            Análise detalhada de pedidos, vendas e performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Período */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Período: {new Date(relatorio.periodo.inicio).toLocaleDateString('pt-BR')} até{' '}
              {new Date(relatorio.periodo.fim).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Vendas do Período"
          value={formatCurrency(relatorio.resumo.valorTotal)}
          subtitle="Total em vendas"
          icon={DollarSign}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        
        <MetricCard
          title="Total de Pedidos"
          value={relatorio.resumo.totalPedidos}
          subtitle={`${relatorio.resumo.totalItens} itens`}
          icon={Package}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        
        <MetricCard
          title="Tempo Médio de Preparo"
          value={`${relatorio.resumo.tempoMedioPreparo} min`}
          subtitle="Últimos 10 pedidos"
          icon={Clock}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
        
        <MetricCard
          title="Tempo Médio de Entrega"
          value={`${relatorio.resumo.tempoMedioEntrega} min`}
          subtitle="Do pedido à entrega"
          icon={TrendingUp}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Produtos Mais Vendidos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Mais Vendidos</CardTitle>
          <CardDescription>Top {relatorio.produtosMaisVendidos.length} do período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {relatorio.produtosMaisVendidos.map((produto, index) => (
              <div key={produto.produtoId} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">{produto.produtoNome}</p>
                    <p className="text-sm font-medium">{produto.quantidadeVendida} un</p>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${(produto.quantidadeVendida / relatorio.produtosMaisVendidos[0].quantidadeVendida) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">
                    {formatCurrency(produto.valorTotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance de Garçons e Ambientes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Garçons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Performance de Garçons
            </CardTitle>
            <CardDescription>Entregas realizadas no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatorio.garcons.slice(0, 5).map((garcom, index) => (
                <div key={garcom.funcionarioId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-secondary text-secondary-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{garcom.funcionarioNome}</p>
                      <p className="text-xs text-muted-foreground">
                        Tempo médio: {garcom.tempoMedioEntregaMinutos} min
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{garcom.totalPedidosEntregues}</p>
                    <p className="text-xs text-muted-foreground">entregas</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ambientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              Performance de Ambientes
            </CardTitle>
            <CardDescription>Pedidos preparados no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatorio.ambientes.map((ambiente, index) => (
                <div key={ambiente.ambienteId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-green-100 text-green-700' :
                      'bg-secondary text-secondary-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{ambiente.ambienteNome}</p>
                      <p className="text-xs text-muted-foreground">
                        Tempo médio: {ambiente.tempoMedioPreparoMinutos} min
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{ambiente.totalPedidosPreparados}</p>
                    <p className="text-xs text-muted-foreground">preparados</p>
                    {ambiente.pedidosEmPreparo > 0 && (
                      <p className="text-xs text-orange-600 font-medium">
                        {ambiente.pedidosEmPreparo} em preparo
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produtos Menos Vendidos */}
      {relatorio.produtosMenosVendidos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Produtos Menos Vendidos</CardTitle>
            <CardDescription>Produtos com menor saída no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {relatorio.produtosMenosVendidos.map((produto) => (
                <div
                  key={produto.produtoId}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium text-sm">{produto.produtoNome}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(produto.valorTotal)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-muted-foreground">
                      {produto.quantidadeVendida}
                    </p>
                    <p className="text-xs text-muted-foreground">vendidos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
