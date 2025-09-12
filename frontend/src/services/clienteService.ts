// Caminho: frontend/src/services/clienteService.ts
import api from './api';

// Interface para os dados de um Cliente, como vêm da API
export interface ClienteData {
  id: string;
  nome: string;
  cpf: string;
}

// DTO para criar um novo cliente
export interface CreateClienteDto {
  nome: string;
  cpf: string;
}

/**
 * Cria um novo cliente no sistema.
 * @param data Os dados do cliente (nome e CPF).
 * @returns Os dados do cliente criado, incluindo o seu ID.
 */
export const createCliente = async (data: CreateClienteDto): Promise<ClienteData> => {
  try {
    const response = await api.post<ClienteData>('/clientes', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    throw error;
  }
};