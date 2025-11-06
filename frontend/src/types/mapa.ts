export interface Posicao {
  x: number;
  y: number;
}

export interface Tamanho {
  width: number;
  height: number;
}

export interface MesaMapa {
  id: string;
  numero: number;
  status: 'LIVRE' | 'OCUPADA' | 'RESERVADA' | 'AGUARDANDO_PAGAMENTO';
  posicao?: Posicao;
  tamanho?: Tamanho;
  rotacao?: number;
  comanda?: {
    id: string;
    pedidosProntos: number;
    totalPedidos: number;
  };
}

export interface PontoEntregaMapa {
  id: string;
  nome: string;
  ativo: boolean;
  posicao?: Posicao;
  tamanho?: Tamanho;
  pedidosProntos?: number;
}

export interface LayoutEstabelecimento {
  width: number;
  height: number;
  backgroundImage?: string;
  gridSize?: number;
}

export interface MapaCompleto {
  mesas: MesaMapa[];
  pontosEntrega: PontoEntregaMapa[];
  layout: LayoutEstabelecimento;
}

export interface AtualizarPosicaoDto {
  posicao: Posicao;
  tamanho?: Tamanho;
  rotacao?: number;
}
