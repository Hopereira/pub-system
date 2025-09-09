// Caminho: frontend/src/services/comandaService.ts

import { Comanda } from "@/types/comanda";
import api from "./api";

// DTO para abrir uma nova comanda
export interface AbrirComandaDto {
  mesaId?: string;
  clienteId?: string;
}

/**
 * Busca os dados completos de uma comanda específica pelo seu ID.
 * @param id O ID da comanda.
 * @returns Os dados da comanda.
 */
export const getComandaById = async (id: string): Promise<Comanda> => {
    try {
        const response = await api.get<Comanda>(`/comandas/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar comanda ${id}:`, error);
        throw error;
    }
}

/**
 * Busca a comanda que está ABERTA para uma determinada mesa.
 * @param mesaId O ID da mesa.
 * @returns Os dados da comanda aberta.
 */
export const getComandaAbertaPorMesa = async (mesaId: string): Promise<Comanda> => {
    try {
        const response = await api.get<Comanda>(`/comandas/mesa/${mesaId}/aberta`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar comanda aberta para a mesa ${mesaId}:`, error);
        throw error;
    }
}

/**
 * Cria uma nova comanda, associada a uma mesa ou cliente.
 * @param data Os dados para a criação da comanda.
 * @returns Os dados da comanda criada.
 */
export const abrirComanda = async (data: AbrirComandaDto): Promise<Comanda> => {
    try {
        const response = await api.post<Comanda>('/comandas', data);
        return response.data;
    } catch (error) {
        console.error('Erro ao abrir comanda:', error);
        throw error;
    }
}

// --- FUNÇÃO DE BUSCA QUE ESTAVA EM FALTA ---
/**
 * Busca comandas abertas que correspondam a um termo de busca.
 * @param term O termo a ser buscado (número da mesa ou nome/CPF do cliente).
 * @returns Uma lista de comandas correspondentes.
 */
export const searchComandas = async (term: string): Promise<Comanda[]> => {
  if (!term) return []; // Retorna vazio se o termo de busca for vazio
  try {
    const response = await api.get('/comandas/search', {
      params: { term },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar comandas:', error);
    throw error;
  }
};