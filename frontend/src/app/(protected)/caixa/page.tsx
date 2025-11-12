'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Calculator,
  Receipt,
  Users,
  TrendingUp,
  Clock,
  DollarSign,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { CardCheckIn } from '@/components/turno/CardCheckIn';

export default function CaixaPage() {
  const { user } = useAuth();
  const [estatisticas, setEstatisticas] = useState({
    comandasAbertas: 0,
    totalVendas: 0,
    pedidosPendentes: 0,
  });

  // Buscar estatísticas do dia
  useEffect(() => {
    // TODO: Implementar busca de estatísticas da API
    setEstatisticas({
      comandasAbertas: 12,
      totalVendas: 2450.80,
      pedidosPendentes: 5,
    });
  }, []);

  // Saudação baseada no horário
  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho com Saudação */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">
            {getSaudacao()}, {user?.nome?.split(' ')[0]}! 👋
          </h1>
        </div>
        <p className="text-muted-foreground">
          Área do Caixa - Terminal de Pagamentos
        </p>
      </div>

      {/* Card de Check-in/Check-out */}
      {user?.id && (
        <CardCheckIn 
          funcionarioId={user.id} 
          funcionarioNome={user.nome || 'Usuário'} 
        />
      )}

      {/* Estatísticas do Dia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Comandas Abertas
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.comandasAbertas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando fechamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total em Vendas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {estatisticas.totalVendas.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos Pendentes
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.pedidosPendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Em preparo/aguardando
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Buscar Comanda */}
          <Link href="/caixa/terminal">
            <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-2 hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Terminal de Caixa</CardTitle>
                    <CardDescription>Buscar e fechar comandas</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Comandas Abertas */}
          <Link href="/caixa/comandas-abertas">
            <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-2 hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Receipt className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Comandas Abertas</CardTitle>
                    <CardDescription>Ver todas as comandas</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Relatório de Vendas */}
          <Link href="/caixa/relatorios">
            <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-2 hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Relatórios</CardTitle>
                    <CardDescription>Visualizar vendas do dia</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Clientes */}
          <Link href="/caixa/clientes">
            <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-2 hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Clientes</CardTitle>
                    <CardDescription>Clientes com comandas</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Calculadora */}
          <Link href="/caixa/calculadora">
            <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-2 hover:border-primary">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Calculator className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Calculadora</CardTitle>
                  <CardDescription>
                    <Badge variant="outline" className="text-xs">Em breve</Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            </Card>
          </Link>

          {/* Histórico de Fechamentos */}
          <Link href="/caixa/historico">
            <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-2 hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-500/10 rounded-lg">
                    <Clock className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Histórico</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="text-xs">Em breve</Badge>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>

      {/* Dicas Rápidas */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">💡 Dicas Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• Use o <strong>Terminal de Caixa</strong> para buscar comandas por mesa, cliente ou CPF</p>
          <p>• Não esqueça de fazer <strong>check-in</strong> no início do turno</p>
          <p>• Verifique sempre se há pedidos pendentes antes de fechar uma comanda</p>
          <p>• Acesse os <strong>Relatórios</strong> para acompanhar o desempenho do dia</p>
        </CardContent>
      </Card>
    </div>
  );
}
