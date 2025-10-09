// frontend/src/services/clienteService.ts
import { Cliente } from '@/types/cliente';
import { CreateClienteDto } from '@/types/cliente.dto';
import { publicApi } from './api'; // ✅ CORREÇÃO: Usar publicApi para cadastro

/**
 * Cria um novo cliente no sistema.
 */
export const createCliente = async (data: CreateClienteDto): Promise<Cliente> => {
  try {
    const response = await publicApi.post<Cliente>('/clientes', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    throw error;
  }
};