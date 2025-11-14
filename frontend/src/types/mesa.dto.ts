// Caminho: frontend/src/types/mesa.dto.ts

export interface CreateMesaDto {
  numero: number;
  ambienteId: string; // Ao criar, enviamos apenas o ID do ambiente
  // --- NOVO: Campos opcionais para criar mesa já posicionada ---
  posicao?: {
    x: number;
    y: number;
  };
  tamanho?: {
    width: number;
    height: number;
  };
  rotacao?: number; // 0, 90, 180, 270
}

// Já vamos deixar pronto o DTO para a atualização
export interface UpdateMesaDto {
  numero?: number;
  ambienteId?: string;
}