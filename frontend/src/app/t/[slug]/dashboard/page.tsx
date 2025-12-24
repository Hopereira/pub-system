'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ShoppingBag, Users, CreditCard, TrendingUp, 
  Clock, CheckCircle, AlertCircle, DollarSign 
} from 'lucide-react';

interface DashboardStats {
  pedidosHoje: number;
  mesasOcupadas: number;
  totalMesas: number;
  comandasAbertas: number;
  faturamentoHoje: number;
  pedidosPendentes: number;
  pedidosProntos: number;
  ticketMedio: number;
}

export default function TenantDashboardPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [stats, setStats] = useState<DashboardStats>({
    pedidosHoje: 0,
    mesasOcupadas: 0,
    totalMesas: 10,
    comandasAbertas: 0,
    faturamentoHoje: 0,
    pedidosPendentes: 0,
    pedidosProntos: 0,
    ticketMedio: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Carregar estatísticas reais da API
    setLoading(false);
  }, [slug]);

  const statCards = [
    { title: 'Pedidos Hoje', value: stats.pedidosHoje, icon: ShoppingBag, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
    { title: 'Mesas Ocupadas', value: `${stats.mesasOcupadas}/${stats.totalMesas}`, icon: Users, color: 'bg-green-500', bgColor: 'bg-green-50' },
    { title: 'Comandas Abertas', value: stats.comandasAbertas, icon: CreditCard, color: 'bg-purple-500', bgColor: 'bg-purple-50' },
    { title: 'Faturamento', value: `R$ ${stats.faturamentoHoje.toFixed(2)}`, icon: DollarSign, color: 'bg-emerald-500', bgColor: 'bg-emerald-50', highlight: true },
  ];

  const statusCards = [
    { title: 'Pedidos Pendentes', value: stats.pedidosPendentes, icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { title: 'Pedidos Prontos', value: stats.pedidosProntos, icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-50' },
    { title: 'Ticket Médio', value: `R$ ${stats.ticketMedio.toFixed(2)}`, icon: TrendingUp, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Visão geral do seu estabelecimento</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.title} className={`${stat.bgColor} rounded-xl p-4 border ${stat.highlight ? 'border-emerald-200' : 'border-transparent'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${stat.highlight ? 'text-emerald-600' : 'text-gray-800'}`}>{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statusCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 border shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href={`/t/${slug}/pedidos`} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition">
            <ShoppingBag className="h-8 w-8 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">Ver Pedidos</span>
          </Link>
          <Link href={`/t/${slug}/mesas`} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-green-50 hover:bg-green-100 transition">
            <Users className="h-8 w-8 text-green-500" />
            <span className="text-sm font-medium text-gray-700">Ver Mesas</span>
          </Link>
          <Link href={`/t/${slug}/caixa/comandas`} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition">
            <CreditCard className="h-8 w-8 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">Comandas</span>
          </Link>
          <Link href={`/t/${slug}/relatorios`} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-amber-50 hover:bg-amber-100 transition">
            <TrendingUp className="h-8 w-8 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">Relatórios</span>
          </Link>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800">Bem-vindo ao Pub System!</p>
          <p className="text-sm text-amber-700">
            Use o menu lateral para navegar entre as funcionalidades.
            Configure seus ambientes, mesas e cardápio para começar.
          </p>
        </div>
      </div>
    </div>
  );
}
