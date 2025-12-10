// Caminho: frontend/src/types/pagina-evento.ts
// Tipo baseado na entidade backend: pagina-evento.entity.ts

export interface PaginaEvento {
  id: string;
  titulo: string;
  urlImagem?: string | null;
  ativa: boolean;
  criadoEm: string; // ISO date string do backend
  atualizadoEm: string; // ISO date string do backend
}
