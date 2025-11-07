'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getRanking, getEstatisticas } from '@/services/rankingService';
import { RankingGarcom, EstatisticasGarcom } from '@/types/ranking';
import PodiumCard from '@/components/ranking/PodiumCard';
import RankingTable from '@/components/ranking/RankingTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Clock, Zap, Target, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Periodo = 'hoje' | 'semana' | 'mes';

export default function RankingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [periodo, setPeriodo] = useState<Periodo>('hoje');
  const [ranking, setRanking] = useState<RankingGarcom[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasGarcom | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregarDados = async () => {
    try {
      setRefreshing(true);

      // Buscar ranking
      const rankingData = await getRanking(periodo);
      setRanking(rankingData.ranking);

      // Buscar estatísticas do garçom logado
      if (user?.id) {
        const estatisticasData = await getEstatisticas(user.id, periodo);
        setEstatisticas(estatisticasData);
      }
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar ranking',
        description: 'Não foi possível carregar os dados do ranking.',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [periodo]);

  const minhasPosicao = ranking.find(r => r.funcionarioId === user?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold">Ranking de Garçons</h1>
            <p className="text-muted-foreground">
              Acompanhe sua performance e compare com a equipe
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <Button
              variant={periodo === 'hoje' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriodo('hoje')}
            >
              Hoje
            </Button>
            <Button
              variant={periodo === 'semana' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriodo('semana')}
            >
              Semana
            </Button>
            <Button
              variant={periodo === 'mes' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriodo('mes')}
            >
              Mês
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={carregarDados}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Pódio */}
      <PodiumCard ranking={ranking} />

      {/* Suas Estatísticas */}
      {estatisticas && minhasPosicao && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Suas Estatísticas
              </span>
              <Badge variant="outline" className="text-lg">
                #{minhasPosicao.posicao}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-4 bg-primary/5 rounded-lg">
                <Trophy className="h-8 w-8 text-primary mb-2" />
                <span className="text-2xl font-bold">{minhasPosicao.pontos}</span>
                <span className="text-sm text-muted-foreground">Pontos</span>
              </div>

              <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
                <span className="text-2xl font-bold">{estatisticas.totalEntregas}</span>
                <span className="text-sm text-muted-foreground">Entregas</span>
              </div>

              <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg">
                <Zap className="h-8 w-8 text-green-600 mb-2" />
                <span className="text-2xl font-bold">
                  {estatisticas.tempoMedioReacaoMinutos.toFixed(1)}min
                </span>
                <span className="text-sm text-muted-foreground">Tempo Médio</span>
              </div>

              <div className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg">
                <Clock className="h-8 w-8 text-yellow-600 mb-2" />
                <span className="text-2xl font-bold">{estatisticas.percentualSLA}%</span>
                <span className="text-sm text-muted-foreground">SLA</span>
              </div>
            </div>

            {/* Comparação com o próximo */}
            {minhasPosicao.posicao > 1 && ranking[minhasPosicao.posicao - 2] && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-center text-muted-foreground">
                  Você está{' '}
                  <span className="font-bold text-foreground">
                    {ranking[minhasPosicao.posicao - 2].pontos - minhasPosicao.pontos} pontos
                  </span>{' '}
                  atrás de{' '}
                  <span className="font-bold text-foreground">
                    {ranking[minhasPosicao.posicao - 2].funcionarioNome}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tabela Completa */}
      <RankingTable ranking={ranking} garcomLogadoId={user?.id} />
    </div>
  );
}
