// Caminho: frontend/src/types/evento.ts
// Tipo baseado na entidade backend: evento.entity.ts

import { PaginaEvento } from './pagina-evento';

export interface Evento {
  id: string;
  titulo: string;
  descricao?: string;
  dataEvento: string; // ISO date string do backend
  valor: number;
  urlImagem?: string;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
  paginaEvento?: PaginaEvento;
}