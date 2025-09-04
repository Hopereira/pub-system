// Caminho: frontend/src/services/funcionarioService.ts

import api from './api';
import { Funcionario } from '@/types/funcionario';

// Por enquanto, teremos apenas a função para buscar todos os funcionários.
// Adicionaremos as de criar, atualizar e deletar nos próximos passos.

export const getFuncionarios = async (): Promise<Funcionario[]> => {
  try {
    const response = await api.get<Funcionario[]>('/funcionarios');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
    // Em uma aplicação real, poderíamos ter um sistema de notificação de erros mais robusto.
    throw error;
  }
};