export interface CreatePaginaEventoDto {
  titulo: string;
}

// ADICIONAR ESTA INTERFACE
export interface UpdatePaginaEventoDto {
  titulo?: string;
  ativa?: boolean;
}