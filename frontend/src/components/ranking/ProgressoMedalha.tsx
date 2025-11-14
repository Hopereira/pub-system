import React from 'react';
import { Progress } from '@/components/ui/progress';
import { TipoMedalha, NivelMedalha } from '@/types/ranking';

interface ProgressoMedalha {
  medalha: {
    id: string;
    tipo: TipoMedalha;
    nome: string;
    descricao: string;
    icone: string;
    nivel: NivelMedalha;
  };
  progresso: number;
  valorAtual: number;
  valorNecessario: number;
  faltam: number;
}

interface ProgressoMedalhaProps {
  progresso: ProgressoMedalha;
}

export function ProgressoMedalhaCard({ progresso }: ProgressoMedalhaProps) {
  const { medalha, progresso: percentual, valorAtual, valorNecessario, faltam } = progresso;

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl">{medalha.icone}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{medalha.nome}</h4>
          <p className="text-xs text-muted-foreground">{medalha.descricao}</p>
        </div>
        <div className={`text-xs font-semibold px-2 py-1 rounded ${getNivelBadgeClasse(medalha.nivel)}`}>
          {medalha.nivel.toUpperCase()}
        </div>
      </div>

      <div className="space-y-2">
        <Progress value={percentual} className="h-2" />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{valorAtual} / {valorNecessario}</span>
          <span className="font-medium text-foreground">
            {percentual.toFixed(0)}%
          </span>
        </div>

        {faltam > 0 && (
          <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">
            Faltam {faltam} {getMensagemFaltam(medalha.tipo)}
          </div>
        )}
      </div>
    </div>
  );
}

function getNivelBadgeClasse(nivel: NivelMedalha): string {
  switch (nivel) {
    case NivelMedalha.OURO:
      return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    case NivelMedalha.PRATA:
      return 'bg-gray-400/20 text-gray-700 dark:text-gray-300';
    case NivelMedalha.BRONZE:
      return 'bg-orange-700/20 text-orange-800 dark:text-orange-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getMensagemFaltam(tipo: TipoMedalha): string {
  switch (tipo) {
    case TipoMedalha.VELOCISTA:
      return 'entregas rápidas';
    case TipoMedalha.MARATONISTA:
      return 'entregas hoje';
    case TipoMedalha.PONTUAL:
      return '% de SLA';
    case TipoMedalha.MVP:
      return 'para ser MVP';
    case TipoMedalha.CONSISTENTE:
      return 'dias no top';
    case TipoMedalha.ROOKIE:
      return 'entrega';
    default:
      return 'para conquistar';
  }
}
