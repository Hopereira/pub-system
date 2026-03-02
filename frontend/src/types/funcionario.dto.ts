// Caminho: frontend/src/types/funcionario.dto.ts

import { CargoType } from './funcionario';

// Este tipo define os dados que nosso formulário enviará para a API ao CRIAR
export interface CreateFuncionarioDto {
  nome: string;
  email: string;
  senha?: string; // Obrigatório na criação
  cargo: CargoType;
  telefone?: string;
  endereco?: string;
  fotoUrl?: string;
}

// DTO para ATUALIZAÇÃO - todos os campos são opcionais
export interface UpdateFuncionarioDto {
  nome?: string;
  email?: string;
  senha?: string;
  cargo?: CargoType;
  telefone?: string;
  endereco?: string;
  fotoUrl?: string;
  ativo?: boolean;
}