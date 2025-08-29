// src/types/mesa.ts
export type MesaStatus = 'Livre' | 'Ocupada' | 'Aguardando Pagamento' | 'Reservada';

export interface Mesa {
  id: string;
  numero: number;
  status: MesaStatus;
}