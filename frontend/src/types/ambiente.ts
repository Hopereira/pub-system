// Caminho: frontend/src/types/ambiente.ts

export enum TipoAmbiente {
  PREPARO = 'PREPARO',
  ATENDIMENTO = 'ATENDIMENTO',
}

export interface Ambiente {
  id: string;
  nome: string;
  tipo: TipoAmbiente | 'PREPARO' | 'ATENDIMENTO';
  descricao?: string;
  isPontoDeRetirada?: boolean;
  productCount?: number;
  tableCount?: number;
  criadoEm?: string;
  atualizadoEm?: string;
}