// Caminho: frontend/src/types/empresa.dto.ts

export interface CreateEmpresaDto {
  cnpj: string;
  nomeFantasia: string;
  razaoSocial: string;
  telefone?: string;
  endereco?: string;
}

export interface UpdateEmpresaDto {
  cnpj?: string;
  nomeFantasia?: string;
  razaoSocial?: string;
  telefone?: string;
  endereco?: string;
}
