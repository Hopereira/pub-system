"use client";

import { useEffect, useState } from "react";
import { BentoGrid, BentoGridItem } from "@/components/dashboard/BentoGrid";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChartCard, MiniBarChart } from "@/components/dashboard/ChartCard";
import { RoleGuard } from "@/components/guards/RoleGuard";
import { 
  Users, 
  UtensilsCrossed, 
  Clock, 
  DollarSign,
  ShoppingBag,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { getRelatorioGeral } from "@/services/analyticsService";
import { getComandasAbertas } from "@/services/comandaService";
import { getMesas } from "@/services/mesaService";
import { getPedidos } from "@/services/pedidoService";
import { getEstatisticasDoDia } from "@/services/avaliacaoService";
import { Comanda, ComandaStatus } from "@/types/comanda";
import { Mesa } from "@/types/mesa";
import { Pedido } from "@/types/pedido";
import { logger } from "@/lib/logger";
import { socket } from "@/lib/socket";
import { toast } from "sonner";

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
    taxaSatisfacao: 0,
    mediaSatisfacao: 0,
    totalAvaliacoes: 0,
  });

  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<Array<{label: string, value: number, color: string}>>([]);

  // Carrega dados reais da API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Busca dados do dia atual
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const [relatorio, comandas, mesas, pedidos, estatisticasSatisfacao] = await Promise.all([
          getRelatorioGeral({
            dataInicio: hoje,
            dataFim: new Date(),
            limite: 5,
          }),
          getComandasAbertas(),
          getMesas(),
          getPedidos(),
          getEstatisticasDoDia().catch(() => ({
            mediaSatisfacao: 0,
            totalAvaliacoes: 0,
            taxaSatisfacao: 0,
            distribuicao: { nota1: 0, nota2: 0, nota3: 0, nota4: 0, nota5: 0 },
            tempoMedioEstadia: 0,
            valorMedioGasto: 0,
          })),
        ]);

        // Conta mesas ocupadas (com comanda aberta)
        const mesasOcupadas = mesas.filter((m: Mesa) => 
          comandas.some((c: Comanda) => c.mesa?.id === m.id && c.status === ComandaStatus.ABERTA)
        ).length;

        // Conta pedidos pendentes (FEITO ou EM_PREPARO)
        const pedidosPendentes = pedidos.filter((p: Pedido) => 
          p.itens.some((i) => i.status === 'FEITO' || i.status === 'EM_PREPARO')
        ).length;

        // Atualiza métricas com dados reais
        setMetricas(prev => ({
          ...prev,
          vendasDia: relatorio.resumo.valorTotal,
          tempoMedioPreparo: relatorio.resumo.tempoMedioPreparo,
          mesasOcupadas,
          totalMesas: mesas.length,
          pedidosPendentes,
          comandasAbertas: comandas.length,
          taxaSatisfacao: estatisticasSatisfacao.taxaSatisfacao,
          mediaSatisfacao: estatisticasSatisfacao.mediaSatisfacao,
          totalAvaliacoes: estatisticasSatisfacao.totalAvaliacoes,
        }));

        // Atualiza produtos mais vendidos
        if (relatorio.produtosMaisVendidos.length > 0) {
          const cores = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-orange-500', 'bg-purple-500'];
          setProdutosMaisVendidos(
            relatorio.produtosMaisVendidos.slice(0, 5).map((p: any, i: number) => ({
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
        toast.error('Erro ao carregar dados do dashboard');
      }
    };

    loadDashboardData();

    // Atualiza a cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);

    // WebSocket - atualiza em tempo real
    socket.on('novo_pedido', () => {
      logger.debug('Novo pedido recebido, atualizando dashboard', { module: 'Dashboard' });
      loadDashboardData();
    });

    socket.on('status_atualizado', () => {
      logger.debug('Status atualizado, atualizando dashboard', { module: 'Dashboard' });
      loadDashboardData();
    });

    socket.on('comanda_aberta', () => {
      logger.debug('Comanda aberta, atualizando dashboard', { module: 'Dashboard' });
      loadDashboardData();
    });

    socket.on('comanda_fechada', () => {
      logger.debug('Comanda fechada, atualizando dashboard', { module: 'Dashboard' });
      loadDashboardData();
    });

    return () => {
      clearInterval(interval);
      socket.off('novo_pedido');
      socket.off('status_atualizado');
      socket.off('comanda_aberta');
      socket.off('comanda_fechada');
    };
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

  const satisfacaoStatus =
    metricas.taxaSatisfacao >= 80 ? 'success' :
    metricas.taxaSatisfacao >= 60 ? 'warning' :
    metricas.taxaSatisfacao > 0 ? 'danger' :
    'neutral';

  return (
    <RoleGuard allowedRoles={['ADMIN', 'GERENTE', 'CAIXA']}>
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
            href="/dashboard/operacional/mesas"
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
            href="/dashboard/operacional/pedidos-pendentes"
          />
        </BentoGridItem>

        <BentoGridItem>
          <MetricCard
            title="Comandas Abertas"
            value={metricas.comandasAbertas}
            subtitle="Em atendimento"
            icon={ShoppingBag}
            status="neutral"
            href="/dashboard/operacional/caixa?tab=clientes"
          />
        </BentoGridItem>

        <BentoGridItem>
          <MetricCard
            title="Taxa de Satisfação"
            value={metricas.totalAvaliacoes > 0 ? `${metricas.taxaSatisfacao}%` : '-'}
            subtitle={metricas.totalAvaliacoes > 0 ? `${metricas.totalAvaliacoes} avaliações (⭐ ${metricas.mediaSatisfacao.toFixed(1)}/5)` : 'Nenhuma avaliação hoje'}
            icon={CheckCircle2}
            status={satisfacaoStatus}
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
    </RoleGuard>
  );
}