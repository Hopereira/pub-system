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

// Mock data - substituir por dados reais da API
export default function DashboardPage() {
  const [metricas, setMetricas] = useState({
    vendasDia: 4250.00,
    vendasTrend: 12,
    mesasOcupadas: 18,
    totalMesas: 22,
    tempoMedioPreparo: 15,
    tempoPreparoStatus: 'success' as const,
    pedidosPendentes: 7,
    comandasAbertas: 12,
  });

  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState([
    { label: 'Picanha ao Molho', value: 24, color: 'bg-emerald-500' },
    { label: 'Cerveja Artesanal', value: 18, color: 'bg-blue-500' },
    { label: 'Caipirinha', value: 15, color: 'bg-amber-500' },
    { label: 'Contra-Filé', value: 12, color: 'bg-orange-500' },
    { label: 'Batata Rústica', value: 10, color: 'bg-purple-500' },
  ]);

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
          <MetricCard
            title="Pedidos Pendentes"
            value={metricas.pedidosPendentes}
            subtitle="Aguardando preparo"
            icon={AlertCircle}
            status={metricas.pedidosPendentes > 10 ? 'warning' : 'neutral'}
          />
        </BentoGridItem>

        <BentoGridItem>
          <MetricCard
            title="Comandas Abertas"
            value={metricas.comandasAbertas}
            subtitle="Em atendimento"
            icon={ShoppingBag}
            status="neutral"
          />
        </BentoGridItem>

        <BentoGridItem>
          <MetricCard
            title="Taxa de Satisfação"
            value="94%"
            subtitle="Baseado em 48 avaliações"
            icon={CheckCircle2}
            status="success"
            trend={{
              value: 3,
              label: 'vs. semana passada',
            }}
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