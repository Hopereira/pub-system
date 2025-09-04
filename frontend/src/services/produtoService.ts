// Caminho: frontend/src/services/produtoService.ts

import { Produto } from "@/types/produto";
import api from "./api";

export const getProdutos = async (): Promise<Produto[]> => {
    try {
        const response = await api.get('/produtos');
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar produtos:", error);
        throw error;
    }
}