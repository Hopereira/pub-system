// frontend/src/types/cliente.dto.ts
export interface CreateClienteDto {
  nome: string;
  cpf: string;
  email?: string;
  celular?: string;
}