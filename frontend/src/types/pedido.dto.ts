// Caminho: frontend/src/types/pedido.dto.ts

import { PedidoStatus } from './pedido-status.enum';

// DTO para criar um item de pedido
export interface CreateItemPedidoDto {
  produtoId: string;
  quantidade: number;
  observacao?: string;
}

// DTO para criar um pedido completo
export interface CreatePedidoDto {
  comandaId: string;
  itens: CreateItemPedidoDto[];
}

// DTO para adicionar itens a um pedido (compatibilidade com código legado)
export interface AddItemPedidoDto extends CreatePedidoDto {}

// DTO para atualizar status de um item de pedido
export interface UpdateItemPedidoStatusDto {
  status: PedidoStatus;
  motivoCancelamento?: string;
}

// DTO para atualizar status do pedido (obsoleto, mas mantido para compatibilidade)
export interface UpdatePedidoStatusDto {
  status: PedidoStatus;
}

// DTO para atualizar dados gerais do pedido
export interface UpdatePedidoDto {
  status?: PedidoStatus;
  motivoCancelamento?: string;
}
