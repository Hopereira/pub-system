// frontend/src/types/evento.dto.ts

export interface CreateEventoDto {
  titulo: string;
  descricao?: string;
  dataEvento: Date;
  valor: number;
  // A imagem será enviada separadamente, então não a incluímos aqui
}

export interface UpdateEventoDto {
  titulo?: string;
  descricao?: string;
  dataEvento?: Date;
  valor?: number;
  ativo?: boolean;
}