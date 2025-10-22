export interface CreatePontoEntregaDto {
  nome: string;
  descricao?: string;
  mesaProximaId?: string;
  ambientePreparoId: string;
}

export interface UpdatePontoEntregaDto {
  nome?: string;
  descricao?: string;
  mesaProximaId?: string;
  ambientePreparoId?: string;
}

export interface CreateAgregadoDto {
  nome: string;
  cpf?: string;
}

export interface UpdatePontoComandaDto {
  pontoEntregaId: string;
  agregados?: CreateAgregadoDto[];
}

export interface DeixarNoAmbienteDto {
  motivo?: string;
}
