// Caminho: frontend/src/types/mesa.dto.ts

export interface CreateMesaDto {
  numero: number;
  ambienteId: string; // Ao criar, enviamos apenas o ID do ambiente
}

// Já vamos deixar pronto o DTO para a atualização
export interface UpdateMesaDto {
  numero?: number;
  ambienteId?: string;
}