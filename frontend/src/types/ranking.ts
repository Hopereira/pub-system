// Tipos para o sistema de ranking de garçons

export interface RankingGarcom {
  posicao: number;
  funcionarioId: string;
  funcionarioNome: string;
  avatar?: string;
  pontos: number;
  totalEntregas: number;
  tempoMedioReacaoMinutos: number;
  tempoMedioEntregaFinalMinutos: number;
  percentualSLA: number;
  entregasRapidas: number;
  medalhas?: Medalha[];
  tendencia: 'subindo' | 'descendo' | 'estavel';
}

export interface Medalha {
  tipo: TipoMedalha;
  nome: string;
  descricao: string;
  icone: string;
  nivel: NivelMedalha;
  conquistadaEm: string;
}

export enum TipoMedalha {
  VELOCISTA = 'VELOCISTA',
  MARATONISTA = 'MARATONISTA',
  PONTUAL = 'PONTUAL',
  MVP = 'MVP',
  CONSISTENTE = 'CONSISTENTE',
  ROOKIE = 'ROOKIE',
}

export enum NivelMedalha {
  BRONZE = 'bronze',
  PRATA = 'prata',
  OURO = 'ouro',
}

export interface EstatisticasGarcom {
  periodo: 'hoje' | 'semana' | 'mes';
  totalEntregas: number;
  tempoMedioReacaoMinutos: number;
  tempoMedioEntregaFinalMinutos: number;
  percentualSLA: number;
  entregasRapidas: number;
  evolucaoDiaria: EvolucaoDiaria[];
}

export interface EvolucaoDiaria {
  data: string; // ISO date string
  totalEntregas: number;
  pontos: number;
}

export interface RankingResponse {
  periodo: 'hoje' | 'semana' | 'mes';
  dataInicio: string;
  dataFim: string;
  ranking: RankingGarcom[];
}
