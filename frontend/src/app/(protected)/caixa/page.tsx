'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTurno } from '@/context/TurnoContext';
import { useCaixa } from '@/context/CaixaContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Lock,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { CardCheckIn } from '@/components/turno/CardCheckIn';
import { ResumoCaixaCard } from '@/components/caixa/ResumoCaixaCard';
import { AberturaCaixaModal } from '@/components/caixa/AberturaCaixaModal';
import { FechamentoCaixaModal } from '@/components/caixa/FechamentoCaixaModal';
import { SangriaModal } from '@/components/caixa/SangriaModal';

export default function CaixaPage() {
  const { user } = useAuth();
  const { temCheckIn } = useTurno();
  const { 
    temCaixaAberto, 
    resumoCaixa, 
    abrirCaixa, 
    fecharCaixa, 
    registrarSangria 
  } = useCaixa();
  
  const [estatisticas, setEstatisticas] = useState({
    comandasAbertas: 0,
    totalVendas: 0,
    pedidosPendentes: 0,
  });
  const [carregandoEstatisticas, setCarregandoEstatisticas] = useState(true);

  // Estados dos modais
  const [showAbertura, setShowAbertura] = useState(false);
  const [showFechamento, setShowFechamento] = useState(false);
  const [showSangria, setShowSangria] = useState(false);

  // Alerta ao tentar sair sem fazer checkout
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (temCheckIn) {
        e.preventDefault();
        e.returnValue = 'Você ainda não fez check-out! Tem certeza que deseja sair?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [temCheckIn]);

  // Buscar estatísticas do dia
  useEffect(() => {
    const buscarEstatisticas = async () => {
      try {
        setCarregandoEstatisticas(true);
        
        // Importar dinamicamente para evitar circular dependency
        const { getComandasAbertas } = await import('@/services/comandaService');
        const { getPedidos } = await import('@/services/pedidoService');
        
        // Buscar comandas abertas
        const comandas = await getComandasAbertas();
        
        // Buscar todos os pedidos para contar pendentes
        const pedidos = await getPedidos();
        const pedidosPendentes = pedidos.filter(
          p => p.status === 'AGUARDANDO' || p.status === 'EM_PREPARO'
        );
        
        // Total de vendas vem do resumo do caixa
        const totalVendas = resumoCaixa?.totalVendas || 0;
        
        setEstatisticas({
          comandasAbertas: comandas.length,
          totalVendas,
          pedidosPendentes: pedidosPendentes.length,
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setCarregandoEstatisticas(false);
      }
    };

    buscarEstatisticas();
  }, [resumoCaixa]);

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

      {/* Grid: Check-in + Resumo do Caixa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card de Check-in/Check-out */}
        {user?.id && (
          <CardCheckIn 
            funcionarioId={user.id} 
            funcionarioNome={user.nome || 'Usuário'} 
          />
        )}

        {/* Card de Resumo do Caixa */}
        {temCheckIn && (
          <ResumoCaixaCard
            resumoCaixa={resumoCaixa}
            temCaixaAberto={temCaixaAberto}
            onAbrirCaixa={() => setShowAbertura(true)}
            onFecharCaixa={() => setShowFechamento(true)}
            onRegistrarSangria={() => setShowSangria(true)}
          />
        )}
      </div>

      {/* Alerta: Faça check-in */}
      {!temCheckIn && (
        <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              Faça Check-in para Começar
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-yellow-700 dark:text-yellow-300">
            <p>
              <strong>Atenção:</strong> Você precisa fazer check-in antes de acessar as funções do caixa.
              As ações rápidas estarão bloqueadas até que você inicie seu turno.
            </p>
          </CardContent>
        </Card>
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
            {carregandoEstatisticas ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{estatisticas.comandasAbertas}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aguardando fechamento
                </p>
              </>
            )}
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
            {carregandoEstatisticas ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  R$ {estatisticas.totalVendas.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Hoje
                </p>
              </>
            )}
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
            {carregandoEstatisticas ? (
              <div className="flex items-center gap-2">
                <div className="h-8 w-10 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{estatisticas.pedidosPendentes}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Em preparo/aguardando
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Buscar Comanda */}
          <Link href={temCheckIn ? "/caixa/terminal" : "#"} onClick={(e) => !temCheckIn && e.preventDefault()}>
            <Card className={`transition-all border-2 ${
              temCheckIn 
                ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary' 
                : 'opacity-50 cursor-not-allowed grayscale'
            }`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Search className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Terminal de Caixa
                      {!temCheckIn && <Lock className="h-4 w-4" />}
                    </CardTitle>
                    <CardDescription>Buscar e fechar comandas</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Comandas Abertas */}
          <Link href={temCheckIn ? "/caixa/comandas-abertas" : "#"} onClick={(e) => !temCheckIn && e.preventDefault()}>
            <Card className={`transition-all border-2 ${
              temCheckIn 
                ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary' 
                : 'opacity-50 cursor-not-allowed grayscale'
            }`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Receipt className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Comandas Abertas
                      {!temCheckIn && <Lock className="h-4 w-4" />}
                    </CardTitle>
                    <CardDescription>Ver todas as comandas</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Relatório de Vendas */}
          <Link href={temCheckIn ? "/caixa/relatorios" : "#"} onClick={(e) => !temCheckIn && e.preventDefault()}>
            <Card className={`transition-all border-2 ${
              temCheckIn 
                ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary' 
                : 'opacity-50 cursor-not-allowed grayscale'
            }`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Relatórios
                      {!temCheckIn && <Lock className="h-4 w-4" />}
                    </CardTitle>
                    <CardDescription>Visualizar vendas do dia</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Gestão de Caixas (Admin/Gerente) */}
          {(user?.cargo === 'ADMIN' || user?.cargo === 'GERENTE') && (
            <Link href="/caixa/gestao">
              <Card className="transition-all border-2 hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary border-yellow-500/50 bg-yellow-500/5">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/10 rounded-lg">
                      <DollarSign className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        Gestão de Caixas
                        <Badge variant="secondary" className="ml-2">Admin</Badge>
                      </CardTitle>
                      <CardDescription>Ver todos os caixas abertos</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )}

          {/* Clientes */}
          <Link href={temCheckIn ? "/caixa/clientes" : "#"} onClick={(e) => !temCheckIn && e.preventDefault()}>
            <Card className={`transition-all border-2 ${
              temCheckIn 
                ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary' 
                : 'opacity-50 cursor-not-allowed grayscale'
            }`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Clientes
                      {!temCheckIn && <Lock className="h-4 w-4" />}
                    </CardTitle>
                    <CardDescription>Clientes com comandas</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          {/* Calculadora */}
          <Card 
            className={`transition-all border-2 ${
              temCheckIn 
                ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary' 
                : 'opacity-50 cursor-not-allowed grayscale'
            }`}
            onClick={() => {
              if (!temCheckIn) return;
              // Abre a calculadora do sistema operacional
              if (typeof window !== 'undefined') {
                // Tenta abrir a calculadora
                const opened = window.open('calculator://', '_blank') || window.open('calc:', '_blank');
                if (!opened) {
                  alert('Abra a calculadora do sistema:\nWindows: Tecla Windows + R, digite "calc"\nMac: Spotlight (Cmd+Space) e digite "calculadora"');
                }
              }
            }}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <Calculator className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Calculadora
                    {!temCheckIn && <Lock className="h-4 w-4" />}
                  </CardTitle>
                  <CardDescription>Abre a calculadora do sistema</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Histórico de Fechamentos */}
          <Link href={temCheckIn ? "/caixa/historico" : "#"} onClick={(e) => !temCheckIn && e.preventDefault()}>
            <Card className={`transition-all border-2 ${
              temCheckIn 
                ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary' 
                : 'opacity-50 cursor-not-allowed grayscale'
            }`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gray-500/10 rounded-lg">
                    <Clock className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Histórico
                      {!temCheckIn && <Lock className="h-4 w-4" />}
                    </CardTitle>
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
          <p>• <strong>Abra o caixa</strong> logo após o check-in com o valor inicial</p>
          <p>• Registre <strong>sangrias</strong> quando o caixa estiver muito cheio</p>
          <p>• <strong>Feche o caixa</strong> e confira os valores antes do check-out</p>
          <p>• Clique em <strong>Calculadora</strong> para abrir a calculadora do Windows</p>
        </CardContent>
      </Card>

      {/* Modais */}
      {user && (
        <>
          <AberturaCaixaModal
            open={showAbertura}
            onClose={() => setShowAbertura(false)}
            onConfirm={abrirCaixa}
            funcionarioNome={user.nome || 'Usuário'}
          />

          {resumoCaixa && (
            <>
              <FechamentoCaixaModal
                open={showFechamento}
                onClose={() => setShowFechamento(false)}
                onConfirm={fecharCaixa}
                resumoCaixa={resumoCaixa}
              />

              <SangriaModal
                open={showSangria}
                onClose={() => setShowSangria(false)}
                onConfirm={registrarSangria}
                saldoAtual={resumoCaixa.saldoFinal}
                funcionarioNome={user.nome || 'Usuário'}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
