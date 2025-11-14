// Caminho: backend/src/modulos/pedido/enums/pedido-status.enum.ts

export enum PedidoStatus {
  FEITO = 'FEITO',
  EM_PREPARO = 'EM_PREPARO',
  QUASE_PRONTO = 'QUASE_PRONTO', // Sinal antecipado 30-60s antes de pronto
  PRONTO = 'PRONTO',
  RETIRADO = 'RETIRADO', // Garçom pegou o item no ambiente
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
  DEIXADO_NO_AMBIENTE = 'DEIXADO_NO_AMBIENTE', // Quando garçom não encontra cliente
}