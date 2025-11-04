import { Ambiente } from './ambiente';
import { Mesa } from './mesa';

export interface PontoEntrega {
  id: string;
  nome: string;
  descricao?: string;
  mesaProximaId?: string;
  mesaProxima?: Mesa;
  ambientePreparoId: string;
  ambientePreparo?: Ambiente;
  ativo: boolean;
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
