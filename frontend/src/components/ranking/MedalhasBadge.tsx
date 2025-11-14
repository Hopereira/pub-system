import React from 'react';
import { TipoMedalha, NivelMedalha, Medalha } from '@/types/ranking';

interface MedalhasBadgeProps {
  medalhas: Medalha[];
  limite?: number;
  tamanho?: 'sm' | 'md' | 'lg';
}

const tamanhos = {
  sm: 'text-base',
  md: 'text-2xl',
  lg: 'text-4xl',
};

export function MedalhasBadge({ 
  medalhas, 
  limite = 5,
  tamanho = 'md' 
}: MedalhasBadgeProps) {
  const medalhasExibidas = medalhas.slice(0, limite);
  const resto = medalhas.length - medalhasExibidas.length;

  if (medalhas.length === 0) {
    return (
      <div className="text-muted-foreground text-sm italic">
        Nenhuma medalha conquistada ainda
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {medalhasExibidas.map((medalha, index) => (
        <div
          key={index}
          className="group relative"
          title={`${medalha.nome} - ${medalha.descricao}`}
        >
          <span className={`${tamanhos[tamanho]} ${getNivelClasse(medalha.nivel)}`}>
            {medalha.icone}
          </span>
          
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
            <div className="font-semibold">{medalha.nome}</div>
            <div className="text-gray-300">{medalha.descricao}</div>
            {medalha.conquistadaEm && (
              <div className="text-gray-400 mt-1">
                {new Date(medalha.conquistadaEm).toLocaleDateString('pt-BR')}
              </div>
            )}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      ))}
      
      {resto > 0 && (
        <div className="text-sm text-muted-foreground font-medium">
          +{resto}
        </div>
      )}
    </div>
  );
}

function getNivelClasse(nivel: NivelMedalha): string {
  switch (nivel) {
    case NivelMedalha.OURO:
      return 'filter drop-shadow-[0_0_8px_rgba(234,179,8,0.6)] brightness-110';
    case NivelMedalha.PRATA:
      return 'filter drop-shadow-[0_0_6px_rgba(156,163,175,0.5)]';
    case NivelMedalha.BRONZE:
      return 'filter drop-shadow-[0_0_4px_rgba(180,83,9,0.4)]';
    default:
      return '';
  }
}
