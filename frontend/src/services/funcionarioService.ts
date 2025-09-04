// Caminho: frontend/src/services/funcionarioService.ts

import api from './api';
import { Funcionario } from '@/types/funcionario';
import { CreateFuncionarioDto, UpdateFuncionarioDto } from '@/types/funcionario.dto';

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

export const updateFuncionario = async (
  id: string,
  funcionarioData: UpdateFuncionarioDto
): Promise<Funcionario> => {
  try {
    const response = await api.patch<Funcionario>(`/funcionarios/${id}`, funcionarioData);
    return response.data;
  } catch (error) {
    console.error(`Erro ao atualizar funcionário ${id}:`, error);
    throw error;
  }
};

// Adicionando a função de deletar que faltava
export const deleteFuncionario = async (id: string): Promise<void> => {
  try {
    await api.delete(`/funcionarios/${id}`);
  } catch (error) {
    console.error(`Erro ao deletar funcionário ${id}:`, error);
    throw error;
  }
};