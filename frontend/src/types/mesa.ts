// Caminho: frontend/src/types/mesa.ts

// Importamos a interface de Ambiente, pois uma mesa pertence a um ambiente
import { AmbienteData } from "@/services/ambienteService";

export interface Mesa {
  id: string;
  numero: number;
  // A API deve retornar o objeto do ambiente aninhado
  ambiente: AmbienteData;
}