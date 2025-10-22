// Caminho: frontend/src/types/mesa.ts

// Importamos a interface de Ambiente, pois uma mesa pertence a um ambiente
import { AmbienteData } from "@/services/ambienteService";

export enum MesaStatus {
  LIVRE = 'LIVRE',
  OCUPADA = 'OCUPADA',
  RESERVADA = 'RESERVADA',
  AGUARDANDO_PAGAMENTO = 'AGUARDANDO_PAGAMENTO',
}

export interface Mesa {
  id: string;
  numero: number;
  status: MesaStatus;
  // A API deve retornar o objeto do ambiente aninhado
  ambiente: AmbienteData;
}