export interface Avaliacao {
  id: string;
  comandaId: string;
  clienteNome: string;
  nota: number;
  comentario: string | null;
  tempoEstadia: number | null;
  valorGasto: number;
  criadoEm: string;
  mesaNumero?: number;
  ambienteNome?: string;
}

export interface CreateAvaliacaoDto {
  comandaId: string;
  nota: number;
  comentario?: string;
}

export interface EstatisticasSatisfacao {
  mediaSatisfacao: number;
  totalAvaliacoes: number;
  distribuicao: {
    nota1: number;
    nota2: number;
    nota3: number;
    nota4: number;
    nota5: number;
  };
  tempoMedioEstadia: number;
  valorMedioGasto: number;
  taxaSatisfacao: number;
}
