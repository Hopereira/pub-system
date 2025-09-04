
// src/services/comandaService.ts (versão atualizada)
import { AbrirComandaDto, Comanda } from "@/types/comanda";
import api from "./api";

export const abrirComanda = async (data: AbrirComandaDto): Promise<Comanda> => {
  // ... função existente ...
  try {
    const response = await api.post('/comandas', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao abrir comanda:', error);
    throw error;
  }
};

// NOVA FUNÇÃO 1: Encontrar a comanda aberta de uma mesa específica
export const getComandaAbertaPorMesa = async (mesaId: string): Promise<Comanda> => {
  try {
    const response = await api.get(`/comandas/mesa/${mesaId}/aberta`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar comanda para a mesa ${mesaId}:`, error);
    throw error;
  }
};

// NOVA FUNÇÃO 2: Obter todos os detalhes de uma comanda pelo seu ID
export const getComandaById = async (comandaId: string): Promise<Comanda> => {
  try {
    const response = await api.get(`/comandas/${comandaId}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar detalhes da comanda ${comandaId}:`, error);
    throw error;
  }
};