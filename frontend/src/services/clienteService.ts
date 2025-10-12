// Caminho: frontend/src/services/clienteService.ts

import { Cliente } from '@/types/cliente';
import { CreateClienteDto } from '@/types/cliente.dto';
import api, { publicApi } from './api'; 

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

/**
 * Busca um cliente pelo CPF. 
 * Rota: GET /clientes/by-cpf?cpf=...
 */
export const getClienteByCpf = async (cpf: string): Promise<Cliente> => {
    try {
        const response = await publicApi.get<Cliente>(`/clientes/by-cpf`, { params: { cpf } });
        return response.data; 
    } catch (error) {
        console.error('Erro ao buscar cliente por CPF:', error);
        throw error;
    }
}

/**
 * ✅ NOVO: Combina a busca por CPF com a criação. Essencial para a reentrada.
 */
export const findOrCreateClient = async (values: {
  cpf: string;
  nome: string;
  email?: string;
  celular?: string;
}): Promise<Cliente> => {
  try {
    // 1. Tenta buscar o cliente pelo CPF
    const clienteExistente = await getClienteByCpf(values.cpf);
    return clienteExistente;
  } catch (error: any) {
    // 2. Se a busca retornar 404 (cliente não encontrado), cria um novo
    if (error.response?.status === 404) {
      const novoCliente = await createCliente({
        nome: values.nome,
        cpf: values.cpf,
        email: values.email || undefined,
        celular: values.celular || undefined,
      });
      return novoCliente;
    }
    // Para qualquer outro erro (servidor, etc.), lança o erro
    throw error;
  }
};