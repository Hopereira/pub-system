"use client";

import { useEffect, useState } from "react";
import { BentoGrid, BentoGridItem } from "@/components/dashboard/BentoGrid";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChartCard, MiniBarChart } from "@/components/dashboard/ChartCard";
import { 
  TrendingUp, 
  Users, 
  UtensilsCrossed, 
  Clock, 
  DollarSign,
  ShoppingBag,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { getRelatorioGeral } from "@/services/analyticsService";
import { logger } from "@/lib/logger";

export default function DashboardPage() {
  const [metricas, setMetricas] = useState({
    vendasDia: 0,
    vendasTrend: 0,
    mesasOcupadas: 0,
    totalMesas: 0,
    tempoMedioPreparo: 0,
    tempoPreparoStatus: 'neutral' as const,
    pedidosPendentes: 0,
    comandasAbertas: 0,
  });

  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<Array<{label: string, value: number, color: string}>>([]);

  // Carrega dados reais da API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Busca dados do dia atual
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const relatorio = await getRelatorioGeral({
          dataInicio: hoje,
          dataFim: new Date(),
          limite: 5,
        });

        // Atualiza métricas com dados reais
        setMetricas(prev => ({
          ...prev,
          vendasDia: relatorio.resumo.valorTotal,
          tempoMedioPreparo: relatorio.resumo.tempoMedioPreparo,
        }));

        // Atualiza produtos mais vendidos
        if (relatorio.produtosMaisVendidos.length > 0) {
          const cores = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-orange-500', 'bg-purple-500'];
          setProdutosMaisVendidos(
            relatorio.produtosMaisVendidos.slice(0, 5).map((p, i) => ({
              label: p.produtoNome,
              value: p.quantidadeVendida,
              color: cores[i] || 'bg-gray-500',
            }))
          );
        }

        logger.log('✅ Dados do dashboard carregados', { module: 'Dashboard' });
      } catch (error) {
        logger.error('❌ Erro ao carregar dados do dashboard', {
          module: 'Dashboard',
          error: error as Error,
        });
        // Mantém dados mock em caso de erro
      }
    };

    loadDashboardData();
  }, []);

  const mesasPercentual = ((metricas.mesasOcupadas / metricas.totalMesas) * 100).toFixed(0);
  const mesasStatus = 
    metricas.mesasOcupadas >= metricas.totalMesas * 0.9 ? 'danger' : 
    metricas.mesasOcupadas >= metricas.totalMesas * 0.7 ? 'warning' : 
    'success';

  const tempoStatus = 
    metricas.tempoMedioPreparo > 20 ? 'danger' : 
    metricas.tempoMedioPreparo > 15 ? 'warning' : 
    'success';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral das operações do estabelecimento
        </p>
      </div>

      {/* Métricas Principais - Bento Grid */}
      <BentoGrid>
        <BentoGridItem>
          <MetricCard
            title="Vendas do Dia"
            value={`R$ ${metricas.vendasDia.toFixed(2)}`}
            subtitle="Atualizado em tempo real"
            icon={DollarSign}
            status="success"
            trend={{
              value: metricas.vendasTrend,
              label: 'vs. ontem',
            }}
          />
        </BentoGridItem>

        <BentoGridItem>
          {/* TODO: Integrar com API de mesas quando disponível */}
          <MetricCard
            title="Ocupação de Mesas"
            value={`${metricas.mesasOcupadas}/${metricas.totalMesas}`}
            subtitle={`${mesasPercentual}% ocupado`}
            icon={UtensilsCrossed}
            status={mesasStatus}
          />
        </BentoGridItem>

        <BentoGridItem>
          <MetricCard
            title="Tempo Médio de Preparo"
            value={`${metricas.tempoMedioPreparo} min`}
            subtitle="Últimos 10 pedidos"
            icon={Clock}
            status={tempoStatus}
          />
        </BentoGridItem>

        <BentoGridItem>
          {/* TODO: Integrar com API de pedidos quando disponível */}
          <MetricCard
            title="Pedidos Pendentes"
            value={metricas.pedidosPendentes}
            subtitle="Aguardando preparo"
            icon={AlertCircle}
            status={metricas.pedidosPendentes > 10 ? 'warning' : 'neutral'}
          />
        </BentoGridItem>

        <BentoGridItem>
          {/* TODO: Integrar com API de comandas quando disponível */}
          <MetricCard
            title="Comandas Abertas"
            value={metricas.comandasAbertas}
            subtitle="Em atendimento"
            icon={ShoppingBag}
            status="neutral"
          />
        </BentoGridItem>

        <BentoGridItem>
          {/* TODO: Implementar sistema de avaliações */}
          <MetricCard
            title="Taxa de Satisfação"
            value="-"
            subtitle="Sistema em desenvolvimento"
            icon={CheckCircle2}
            status="neutral"
          />
        </BentoGridItem>

        {/* Gráfico de Produtos Mais Vendidos - 2 colunas */}
        <BentoGridItem span={{ tablet: 2, desktop: 2 }}>
          <ChartCard
            title="Produtos Mais Vendidos"
            description="Top 5 do dia"
          >
            <MiniBarChart data={produtosMaisVendidos} />
          </ChartCard>
        </BentoGridItem>
      </BentoGrid>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <a
          href="/dashboard/operacional/caixa"
          className="p-6 border-2 rounded-lg hover:border-primary hover:shadow-md transition-all text-center group"
        >
          <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
          <h3 className="font-semibold">Terminal de Caixa</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gerenciar comandas e pagamentos
          </p>
        </a>

        <a
          href="/dashboard/gestaopedidos"
          className="p-6 border-2 rounded-lg hover:border-primary hover:shadow-md transition-all text-center group"
        >
          <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
          <h3 className="font-semibold">Gestão de Pedidos</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Supervisão ou preparo baseado no seu perfil
          </p>
        </a>

        <a
          href="/dashboard/admin/cardapio"
          className="p-6 border-2 rounded-lg hover:border-primary hover:shadow-md transition-all text-center group"
        >
          <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
          <h3 className="font-semibold">Cardápio</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gerenciar produtos e categorias
          </p>
        </a>
      </div>
    </div>
  );
}