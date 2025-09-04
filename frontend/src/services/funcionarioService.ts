// Caminho: frontend/src/services/funcionarioService.ts

import api from './api';
import { Funcionario } from '@/types/funcionario';
// ATUALIZADO: A importação agora vem do novo arquivo DTO
import { CreateFuncionarioDto } from '@/types/funcionario.dto'; 

export const getFuncionarios = async (): Promise<Funcionario[]> => {
  try {
    const response = await api.get<Funcionario[]>('/funcionarios');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
    throw error;
  }
};

export const createFuncionario = async (
  funcionarioData: CreateFuncionarioDto
): Promise<Funcionario> => {
  try {
    const response = await api.post<Funcionario>('/funcionarios', funcionarioData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    throw error;
  }
};