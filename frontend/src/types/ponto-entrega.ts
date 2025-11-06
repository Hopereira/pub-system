import { Ambiente } from './ambiente';
import { Mesa } from './mesa';

export interface PontoEntrega {
  id: string;
  nome: string;
  descricao?: string;
  mesaProximaId?: string;
  mesaProxima?: Mesa;
  ambienteAtendimentoId?: string;
  ambienteAtendimento?: Ambiente;
  ambientePreparoId: string;
  ambientePreparo?: Ambiente;
  ativo: boolean;
  posicao?: {
    x: number;
    y: number;
  };
  tamanho?: {
    width: number;
    height: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Agregado {
  id: string;
  nome: string;
  cpf?: string;
  pontoEntregaId: string;
  comandaId: string;
  createdAt: Date;
  updatedAt: Date;
}
