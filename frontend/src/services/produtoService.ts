// Caminho: frontend/src/services/produtoService.ts

import { Produto } from "@/types/produto";
import { CreateProdutoDto } from "@/types/produto.dto";
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

// --- NOVO: Função para criar um novo produto ---
export const createProduto = async (produtoData: CreateProdutoDto): Promise<Produto> => {
    try {
        const response = await api.post<Produto>('/produtos', produtoData);
        return response.data;
    } catch (error) {
        console.error("Erro ao criar produto:", error);
        throw error;
    }
}