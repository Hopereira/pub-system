// Caminho: frontend/src/services/clienteService.ts
import { Cliente } from '@/types/cliente';
import { CreateClienteDto } from '@/types/cliente.dto';
import { publicApi } from './api'; 

/**
 * Cria um novo cliente no sistema.
 */
export const createCliente = async (data: CreateClienteDto): Promise<Cliente> => {
  try {
    // Rota: POST /clientes (Pública)
    const response = await publicApi.post<Cliente>('/clientes', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    throw error;
  }
};

/**
 * ✅ NOVO: Busca um cliente pelo CPF usando a nova rota pública. 
 */
export const getClienteByCpf = async (cpf: string): Promise<Cliente> => {
    try {
        // ✅ MUDANÇA CRÍTICA: Usa a nova rota PÚBLICA específica
        // Rota: GET /clientes/by-cpf?cpf=...
        const response = await publicApi.get<Cliente>(`/clientes/by-cpf`, { params: { cpf } });
        
        // Se a API retornar sucesso (Status 200) e dados, o cliente foi encontrado
        return response.data; 

    } catch (error) {
        // Se a API retornar 404, o erro é propagado para que o EventoClientPage possa criar o cliente.
        // Se a API retornar 401, algo ainda está errado com o decorador @Public no backend.
        console.error('Erro ao buscar cliente por CPF:', error);
        throw error;
    }
}