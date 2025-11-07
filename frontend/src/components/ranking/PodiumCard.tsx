'use client';

import { RankingGarcom } from '@/types/ranking';
import { Trophy, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PodiumCardProps {
  ranking: RankingGarcom[];
}

export default function PodiumCard({ ranking }: PodiumCardProps) {
  const top3 = ranking.slice(0, 3);

  if (top3.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Nenhum garçom no ranking ainda
        </CardContent>
      </Card>
    );
  }

  const getMedalColor = (posicao: number) => {
    switch (posicao) {
      case 1:
        return 'text-yellow-500'; // Ouro
      case 2:
        return 'text-gray-400'; // Prata
      case 3:
        return 'text-orange-600'; // Bronze
      default:
        return 'text-gray-500';
    }
  };

  const getMedalEmoji = (posicao: number) => {
    switch (posicao) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-500 via-gray-400 to-orange-600 h-2" />
      <CardContent className="p-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Pódio do Dia</h2>
        </div>

        <div className="grid grid-cols-3 gap-4 items-end">
          {/* 2º Lugar */}
          {top3[1] && (
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {top3[1].funcionarioNome.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -top-2 -right-2 text-3xl">
                  {getMedalEmoji(2)}
                </div>
              </div>
              <div className={`h-24 w-full bg-gradient-to-t from-gray-300/20 to-gray-400/20 rounded-t-lg flex flex-col items-center justify-center border-2 border-gray-400`}>
                <p className="font-bold text-sm truncate max-w-full px-2">
                  {top3[1].funcionarioNome}
                </p>
                <div className="flex items-center gap-1 text-sm">
                  <Award className="h-3 w-3" />
                  <span className="font-semibold">{top3[1].pontos}</span>
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {top3[1].totalEntregas} entregas
                </p>
              </div>
            </div>
          )}

          {/* 1º Lugar */}
          {top3[0] && (
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4 ring-yellow-200 animate-pulse">
                  {top3[0].funcionarioNome.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -top-2 -right-2 text-4xl">
                  {getMedalEmoji(1)}
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
                  <Trophy className="h-6 w-6 text-yellow-500 drop-shadow-lg" />
                </div>
              </div>
              <div className={`h-32 w-full bg-gradient-to-t from-yellow-400/20 to-yellow-500/20 rounded-t-lg flex flex-col items-center justify-center border-2 border-yellow-500`}>
                <p className="font-bold text-base truncate max-w-full px-2">
                  {top3[0].funcionarioNome}
                </p>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <span className="font-bold text-lg text-yellow-600">{top3[0].pontos}</span>
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {top3[0].totalEntregas} entregas
                </p>
                {top3[0].percentualSLA >= 95 && (
                  <Badge variant="outline" className="mt-1 text-xs border-green-500 text-green-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {top3[0].percentualSLA}% SLA
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* 3º Lugar */}
          {top3[2] && (
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {top3[2].funcionarioNome.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -top-2 -right-2 text-3xl">
                  {getMedalEmoji(3)}
                </div>
              </div>
              <div className={`h-20 w-full bg-gradient-to-t from-orange-400/20 to-orange-500/20 rounded-t-lg flex flex-col items-center justify-center border-2 border-orange-500`}>
                <p className="font-bold text-sm truncate max-w-full px-2">
                  {top3[2].funcionarioNome}
                </p>
                <div className="flex items-center gap-1 text-sm">
                  <Award className="h-3 w-3" />
                  <span className="font-semibold">{top3[2].pontos}</span>
                  <span className="text-xs text-muted-foreground">pts</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {top3[2].totalEntregas} entregas
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
