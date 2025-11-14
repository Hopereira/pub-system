'use client';

import { RankingGarcom } from '@/types/ranking';
import { TrendingUp, TrendingDown, Minus, Award, Clock, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RankingTableProps {
  ranking: RankingGarcom[];
  garcomLogadoId?: string;
}

export default function RankingTable({ ranking, garcomLogadoId }: RankingTableProps) {
  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'subindo':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'descendo':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSLAColor = (percentual: number) => {
    if (percentual >= 95) return 'text-green-600 bg-green-50 border-green-200';
    if (percentual >= 85) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Ranking Completo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-muted-foreground">
                <th className="pb-3 font-medium w-12 text-center">#</th>
                <th className="pb-3 font-medium">Nome</th>
                <th className="pb-3 font-medium text-center">Pontos</th>
                <th className="pb-3 font-medium text-center">Entregas</th>
                <th className="pb-3 font-medium text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>Reação</span>
                  </div>
                </th>
                <th className="pb-3 font-medium text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>SLA</span>
                  </div>
                </th>
                <th className="pb-3 font-medium text-center">Tendência</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((garcom, index) => {
                const isLogado = garcom.funcionarioId === garcomLogadoId;
                const posicaoClass =
                  garcom.posicao === 1
                    ? 'bg-yellow-50 border-l-4 border-yellow-500'
                    : garcom.posicao === 2
                    ? 'bg-gray-50 border-l-4 border-gray-400'
                    : garcom.posicao === 3
                    ? 'bg-orange-50 border-l-4 border-orange-500'
                    : isLogado
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : '';

                return (
                  <tr
                    key={garcom.funcionarioId}
                    className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${posicaoClass}`}
                  >
                    <td className="py-3 text-center">
                      <span className="font-bold text-lg">
                        {garcom.posicao <= 3 ? (
                          <span>
                            {garcom.posicao === 1 && '🥇'}
                            {garcom.posicao === 2 && '🥈'}
                            {garcom.posicao === 3 && '🥉'}
                          </span>
                        ) : (
                          garcom.posicao
                        )}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-sm font-bold">
                          {garcom.funcionarioNome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">
                            {garcom.funcionarioNome}
                            {isLogado && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Você
                              </Badge>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Award className="h-4 w-4 text-primary" />
                        <span className="font-bold text-lg">{garcom.pontos}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-semibold">{garcom.totalEntregas}</span>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-medium">
                          {garcom.tempoMedioReacaoMinutos.toFixed(1)}min
                        </span>
                        {garcom.tempoMedioReacaoMinutos < 2 && (
                          <Zap className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <Badge
                        variant="outline"
                        className={`font-semibold ${getSLAColor(garcom.percentualSLA)}`}
                      >
                        {garcom.percentualSLA}%
                      </Badge>
                    </td>
                    <td className="py-3 text-center">
                      {getTendenciaIcon(garcom.tendencia)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {ranking.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum garçom no ranking ainda
          </div>
        )}
      </CardContent>
    </Card>
  );
}
