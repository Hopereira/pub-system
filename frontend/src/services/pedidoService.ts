import { Pedido, ItemPedido } from '@/types/pedido';
import { AddItemPedidoDto, CreatePedidoDto, UpdateItemPedidoStatusDto } from '@/types/pedido.dto';
import { DeixarNoAmbienteDto } from '@/types/ponto-entrega.dto';
import { logger } from '@/lib/logger';
import api from './api';

// ✅ CORREÇÃO: Interfaces tipadas para retornos de API
export interface ItemPedidoAtualizado extends ItemPedido {
  tempoReacaoMinutos?: number;
  tempoEntregaFinalMinutos?: number;
}

export const adicionarItensAoPedido = async (data: AddItemPedidoDto): Promise<Pedido> => {
  try {
    logger.log('📝 Adicionando itens ao pedido', { 
      module: 'PedidoService',
      data: { comandaId: data.comandaId, qtdItens: data.itens.length } 
    });
    const response = await api.post<Pedido>('/pedidos', data);
    logger.log('✅ Pedido criado com sucesso', { 
      module: 'PedidoService',
      data: { pedidoId: response.data.id } 
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao adicionar itens ao pedido', { 
      module: 'PedidoService', 
      error: error as Error 
    });
    throw error;
  }
};

export const createPedidoFromCliente = async (payload: CreatePedidoDto): Promise<Pedido> => {
  try {
    logger.log('📦 Criando pedido do cliente (público)', { 
      module: 'PedidoService',
      data: { comandaId: payload.comandaId } 
    });
    const response = await api.post<Pedido>('/pedidos/cliente', payload);
    logger.log('✅ Pedido do cliente criado', { 
      module: 'PedidoService',
      data: { pedidoId: response.data.id } 
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao criar pedido do cliente', { 
      module: 'PedidoService', 
      error: error as Error 
    });
    throw error;
  }
};

/**
 * Interface para filtros de busca de pedidos
 */
export interface GetPedidosFilters {
  ambienteId?: string;
  status?: string;
  comandaId?: string;
}

/**
 * Busca pedidos com filtros opcionais
 * @param filters - Filtros opcionais (ambienteId, status, comandaId)
 */
export const getPedidos = async (filters?: GetPedidosFilters): Promise<Pedido[]> => {
  try {
    const params: Record<string, string> = {};
    
    if (filters?.ambienteId) params.ambienteId = filters.ambienteId;
    if (filters?.status) params.status = filters.status;
    if (filters?.comandaId) params.comandaId = filters.comandaId;

    logger.debug('🔍 Buscando pedidos', { 
      module: 'PedidoService',
      data: { filters: params }
    });
    
    const response = await api.get<Pedido[]>('/pedidos', { params });
    
    logger.debug(`✅ ${response.data.length} pedidos encontrados`, { 
      module: 'PedidoService' 
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar pedidos', { 
      module: 'PedidoService',
      error: error as Error 
    });
    throw error;
  }
};

export const getPedidosPorAmbiente = async (ambienteId: string): Promise<Pedido[]> => {
  try {
    // ✅ CORREÇÃO: Validação com erro explícito ao invés de falha silenciosa
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ambienteId)) {
      const error = new Error('ID de ambiente inválido. Selecione um ambiente válido.');
      logger.error('❌ ambienteId inválido', {
        module: 'PedidoService',
        data: { ambienteId },
        error
      });
      throw error;
    }

    logger.debug('🔍 Buscando pedidos por ambiente', { 
      module: 'PedidoService',
      data: { ambienteId } 
    });
    const response = await api.get<Pedido[]>(`/pedidos`, { params: { ambienteId } });
    logger.debug(`✅ ${response.data.length} pedidos encontrados`, { 
      module: 'PedidoService' 
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar pedidos por ambiente', { 
      module: 'PedidoService',
      data: { ambienteId },
      error: error as Error 
    });
    throw error;
  }
};

export const updateItemStatus = async (
  itemPedidoId: string,
  data: UpdateItemPedidoStatusDto,
): Promise<ItemPedidoAtualizado> => {
  try {
    logger.log('🔄 Atualizando status do item', { 
      module: 'PedidoService',
      data: { itemPedidoId, novoStatus: data.status } 
    });
    const response = await api.patch(`/pedidos/item/${itemPedidoId}/status`, data);
    logger.log('✅ Status atualizado com sucesso', { 
      module: 'PedidoService',
      data: { itemPedidoId, status: data.status } 
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao atualizar status do item', { 
      module: 'PedidoService',
      data: { itemPedidoId },
      error: error as Error 
    });
    throw error;
  }
};

/**
 * @deprecated Esta função está obsoleta. Use updateItemStatus para atualizar itens individuais.
 * A rota /pedidos/:id/status não existe mais no backend.
 */
export const updatePedidoStatus = async (): Promise<never> => {
  throw new Error('Função obsoleta: use updateItemStatus para atualizar status de itens individuais');
};

/**
 * Lista pedidos prontos para entrega (status PRONTO)
 * Opcionalmente filtra por ambiente de preparo
 */
export const getPedidosProntos = async (ambienteId?: string): Promise<Pedido[]> => {
  try {
    logger.debug('🔍 Buscando pedidos prontos', { 
      module: 'PedidoService',
      data: { ambienteId: ambienteId || 'Todos' } 
    });
    const params = ambienteId ? { ambienteId } : {};
    const response = await api.get<Pedido[]>('/pedidos/prontos', { params });
    logger.log(`✅ ${response.data.length} pedidos prontos encontrados`, { 
      module: 'PedidoService' 
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar pedidos prontos', { 
      module: 'PedidoService',
      error: error as Error 
    });
    throw error;
  }
};

/**
 * Marca um item como "deixado no ambiente" quando o cliente não é encontrado
 */
export const deixarNoAmbiente = async (
  itemPedidoId: string,
  data: DeixarNoAmbienteDto
): Promise<ItemPedidoAtualizado> => {
  try {
    logger.log('📦 Deixando item no ambiente', { 
      module: 'PedidoService',
      data: { itemPedidoId, motivo: data.motivo || 'Não especificado' } 
    });
    const response = await api.patch(`/pedidos/item/${itemPedidoId}/deixar-no-ambiente`, data);
    logger.log('✅ Item marcado como deixado no ambiente', { 
      module: 'PedidoService',
      data: { itemPedidoId } 
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao deixar item no ambiente', { 
      module: 'PedidoService',
      data: { itemPedidoId },
      error: error as Error 
    });
    throw error;
  }
};

/**
 * ✅ NOVO: Cria pedido pelo garçom (com criação automática de comanda)
 * Rota: POST /pedidos/garcom
 */
export const criarPedidoGarcom = async (data: {
  clienteId: string;
  garcomId: string;
  mesaId?: string;
  observacao?: string;
  itens: Array<{
    produtoId: string;
    quantidade: number;
    observacao?: string;
  }>;
}): Promise<Pedido> => {
  try {
    logger.log('👨‍🍳 Garçom criando pedido', {
      module: 'PedidoService',
      data: { clienteId: data.clienteId, garcomId: data.garcomId, qtdItens: data.itens.length }
    });
    const response = await api.post<Pedido>('/pedidos/garcom', data);
    logger.log('✅ Pedido pelo garçom criado', {
      module: 'PedidoService',
      data: { pedidoId: response.data.id }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao criar pedido pelo garçom', {
      module: 'PedidoService',
      error: error as Error
    });
    throw error;
  }
};

/**
 * ✅ NOVO: Marca item como retirado pelo garçom
 * Rota: PATCH /pedidos/item/:id/retirar
 */
export const retirarItem = async (
  itemPedidoId: string,
  garcomId: string,
): Promise<ItemPedidoAtualizado> => {
  try {
    logger.log('🎯 Marcando item como retirado', {
      module: 'PedidoService',
      data: { itemPedidoId, garcomId }
    });
    const response = await api.patch(`/pedidos/item/${itemPedidoId}/retirar`, {
      garcomId
    });
    logger.log('✅ Item marcado como retirado', {
      module: 'PedidoService',
      data: { itemPedidoId, tempoReacao: response.data.tempoReacaoMinutos }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao marcar item como retirado', {
      module: 'PedidoService',
      data: { itemPedidoId },
      error: error as Error
    });
    throw error;
  }
};

/**
 * ✅ NOVO: Marca item como entregue pelo garçom
 * Rota: PATCH /pedidos/item/:id/marcar-entregue
 */
export const marcarComoEntregue = async (
  itemPedidoId: string,
  garcomId: string,
): Promise<ItemPedidoAtualizado> => {
  try {
    logger.log('🚚 Marcando item como entregue', {
      module: 'PedidoService',
      data: { itemPedidoId, garcomId }
    });
    const response = await api.patch(`/pedidos/item/${itemPedidoId}/marcar-entregue`, {
      garcomId
    });
    logger.log('✅ Item marcado como entregue', {
      module: 'PedidoService',
      data: { itemPedidoId }
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao marcar item como entregue', {
      module: 'PedidoService',
      data: { itemPedidoId },
      error: error as Error
    });
    throw error;
  }
};