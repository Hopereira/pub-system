// Caminho: frontend/src/services/produtoService.ts

import { Produto } from "@/types/produto";
import { CreateProdutoDto, UpdateProdutoDto } from "@/types/produto.dto";
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

export const createProduto = async (produtoData: CreateProdutoDto): Promise<Produto> => {
    try {
        const response = await api.post<Produto>('/produtos', produtoData);
        return response.data;
    } catch (error) {
        console.error("Erro ao criar produto:", error);
        throw error;
    }
}

export const updateProduto = async (id: string, produtoData: UpdateProdutoDto): Promise<Produto> => {
    try {
        const response = await api.patch<Produto>(`/produtos/${id}`, produtoData);
        return response.data;
    } catch (error) {
        console.error(`Erro ao atualizar produto ${id}:`, error);
        throw error;
    }
}

// --- NOVO: Função para deletar um produto ---
export const deleteProduto = async (id: string): Promise<void> => {
    try {
        await api.delete(`/produtos/${id}`);
    } catch (error) {
        console.error(`Erro ao deletar produto ${id}:`, error);
        throw error;
    }
}