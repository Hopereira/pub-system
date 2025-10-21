// Caminho: backend/src/modulos/pedido/enums/pedido-status.enum.ts

export enum PedidoStatus {
  FEITO = 'FEITO',
  EM_PREPARO = 'EM_PREPARO',
  PRONTO = 'PRONTO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
  DEIXADO_NO_AMBIENTE = 'DEIXADO_NO_AMBIENTE', // Quando garçom não encontra cliente
}