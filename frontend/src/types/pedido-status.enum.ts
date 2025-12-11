// Caminho: frontend/src/types/pedido-status.enum.ts
// ✅ CORREÇÃO: Ordem alinhada com backend
export enum PedidoStatus {
  FEITO = 'FEITO',
  EM_PREPARO = 'EM_PREPARO',
  QUASE_PRONTO = 'QUASE_PRONTO', // Sinal antecipado 30-60s antes de pronto
  PRONTO = 'PRONTO',
  RETIRADO = 'RETIRADO', // Garçom pegou o item no ambiente
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO', // ← Movido para antes de DEIXADO_NO_AMBIENTE (igual backend)
  DEIXADO_NO_AMBIENTE = 'DEIXADO_NO_AMBIENTE', // Quando garçom não encontra cliente
}