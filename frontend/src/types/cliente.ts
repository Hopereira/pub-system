// Caminho: frontend/src/types/cliente.ts
// Tipo baseado na entidade backend: cliente.entity.ts

import { Ambiente } from './ambiente';
import { PontoEntrega } from './ponto-entrega';

export interface Cliente {
  id: string;
  cpf: string;
  nome: string;
  email?: string;
  celular?: string;
  ambienteId?: string;
  ambiente?: Ambiente;
  pontoEntregaId?: string;
  pontoEntrega?: PontoEntrega;
}

// Re-exportar para compatibilidade com imports existentes
export type { Cliente as ClienteType };
