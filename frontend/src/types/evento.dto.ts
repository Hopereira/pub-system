// frontend/src/types/evento.dto.ts

export interface CreateEventoDto {
  titulo: string;
  descricao?: string | null;
  dataEvento: Date;
  valor: number;
  paginaEventoId?: string | null;
}

export interface UpdateEventoDto {
  titulo?: string;
  descricao?: string | null;
  dataEvento?: Date;
  valor?: number;
  ativo?: boolean;
  paginaEventoId?: string | null;
}