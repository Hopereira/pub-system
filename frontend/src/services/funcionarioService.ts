// Caminho: frontend/src/services/funcionarioService.ts

import { Funcionario } from '@/types/funcionario';
import  api  from './api';

export const getAllFuncionarios = async (): Promise<Funcionario[]> => {
  const response = await api.get<Funcionario[]>('/funcionarios');
  return response.data;
};

// NOVO: Adicione esta função
// O tipo 'any' aqui é temporário, poderíamos criar um tipo específico para os dados de criação
export const createFuncionario = async (data: any): Promise<Funcionario> => {
  const response = await api.post<Funcionario>('/funcionarios', data);
  return response.data;
};