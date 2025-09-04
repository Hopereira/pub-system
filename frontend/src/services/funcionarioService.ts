// Caminho: frontend/src/services/funcionarioService.ts

import api from './api';
import { Funcionario } from '@/types/funcionario';
import { CreateFuncionarioDto } from '@/types/funcionario.dto'; // NOVO: Importamos o DTO

export const getFuncionarios = async (): Promise<Funcionario[]> => {
  try {
    const response = await api.get<Funcionario[]>('/funcionarios');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
    throw error;
  }
};

// --- NOVO: Função para criar um novo funcionário ---
export const createFuncionario = async (
  funcionarioData: CreateFuncionarioDto
): Promise<Funcionario> => {
  try {
    const response = await api.post<Funcionario>('/funcionarios', funcionarioData);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    // Lançamos o erro para que o formulário possa capturá-lo e exibir uma mensagem
    throw error;
  }
};