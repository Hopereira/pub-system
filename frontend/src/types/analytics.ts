// Tipos para Analytics e Relatórios

export interface PedidoTempo {
  pedidoId: string;
  criadoEm: Date;
  tempoPreparoMinutos?: number;
  tempoEntregaMinutos?: number;
  tempoTotalMinutos?: number;
  ambiente?: string;
  status: string;
}

export interface GarcomPerformance {
  funcionarioId: string;
  funcionarioNome: string;
  totalPedidosEntregues: number;
  tempoMedioEntregaMinutos: number;
  ultimaEntrega?: Date;
}

export interface AmbientePerformance {
  ambienteId: string;
  ambienteNome: string;
  totalPedidosPreparados: number;
  tempoMedioPreparoMinutos: number;
  pedidosEmPreparo: number;
}

export interface ProdutoVendas {
  produtoId: string;
  produtoNome: string;
  quantidadeVendida: number;
  valorTotal: number;
  ultimaVenda?: Date;
}

export interface RelatorioGeral {
  periodo: {
    inicio: Date;
    fim: Date;
  };
  
  resumo: {
    totalPedidos: number;
    totalItens: number;
    valorTotal: number;
    tempoMedioPreparo: number;
    tempoMedioEntrega: number;
  };
  
  garcons: GarcomPerformance[];
  ambientes: AmbientePerformance[];
  produtosMaisVendidos: ProdutoVendas[];
  produtosMenosVendidos: ProdutoVendas[];
  
  pedidosPorHora: {
    hora: number;
    quantidade: number;
  }[];
  
  pedidosPorDiaSemana: {
    dia: string;
    quantidade: number;
  }[];
}

export interface FiltroRelatorio {
  dataInicio?: Date;
  dataFim?: Date;
  ambienteId?: string;
  funcionarioId?: string;
  produtoId?: string;
  limite?: number;
}
