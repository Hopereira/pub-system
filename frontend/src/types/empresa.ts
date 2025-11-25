// Caminho: frontend/src/types/empresa.ts
// Tipo baseado na entidade backend: empresa.entity.ts

export interface Empresa {
  id: string;
  cnpj: string;
  nomeFantasia: string;
  razaoSocial: string;
  telefone?: string;
  endereco?: string;
}
