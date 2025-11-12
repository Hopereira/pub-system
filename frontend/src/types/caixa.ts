// Types para gestão financeira do caixa

export enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  PIX = 'PIX',
  DEBITO = 'DEBITO',
  CREDITO = 'CREDITO',
  VALE_REFEICAO = 'VALE_REFEICAO',
  VALE_ALIMENTACAO = 'VALE_ALIMENTACAO',
}

export type TipoMovimentacao = 
  | 'ABERTURA'
  | 'VENDA'
  | 'SANGRIA'
  | 'SUPRIMENTO'
  | 'FECHAMENTO';

export type StatusCaixa = 
  | 'ABERTO'
  | 'FECHADO'
  | 'CONFERENCIA';

export interface AberturaCaixa {
  id: string;
  turnoFuncionarioId: string;
  funcionarioId: string;
  funcionarioNome: string;
  dataAbertura: string;
  horaAbertura: string;
  valorInicial: number;
  observacao?: string;
  status: StatusCaixa;
}

export interface FechamentoCaixa {
  id: string;
  aberturaCaixaId: string;
  turnoFuncionarioId: string;
  funcionarioId: string;
  funcionarioNome: string;
  dataFechamento: string;
  horaFechamento: string;
  
  // Valores esperados (sistema)
  valorEsperadoDinheiro: number;
  valorEsperadoPix: number;
  valorEsperadoDebito: number;
  valorEsperadoCredito: number;
  valorEsperadoValeRefeicao: number;
  valorEsperadoValeAlimentacao: number;
  valorEsperadoTotal: number;
  
  // Valores informados (conferência física)
  valorInformadoDinheiro: number;
  valorInformadoPix: number;
  valorInformadoDebito: number;
  valorInformadoCredito: number;
  valorInformadoValeRefeicao: number;
  valorInformadoValeAlimentacao: number;
  valorInformadoTotal: number;
  
  // Diferenças
  diferencaDinheiro: number;
  diferencaPix: number;
  diferencaDebito: number;
  diferencaCredito: number;
  diferencaValeRefeicao: number;
  diferencaValeAlimentacao: number;
  diferencaTotal: number;
  
  // Sangrias
  totalSangrias: number;
  quantidadeSangrias: number;
  
  // Vendas
  quantidadeVendas: number;
  quantidadeComandasFechadas: number;
  ticketMedio: number;
  
  observacao?: string;
  status: StatusCaixa;
}

export interface Sangria {
  id: string;
  aberturaCaixaId: string;
  turnoFuncionarioId: string;
  funcionarioId: string;
  funcionarioNome: string;
  dataSangria: string;
  horaSangria: string;
  valor: number;
  motivo: string;
  observacao?: string;
  autorizadoPor?: string;
  autorizadoCargo?: string;
}

export interface Suprimento {
  id: string;
  aberturaCaixaId: string;
  turnoFuncionarioId: string;
  funcionarioId: string;
  funcionarioNome: string;
  dataSuprimento: string;
  horaSuprimento: string;
  valor: number;
  motivo: string;
  observacao?: string;
}

export interface MovimentacaoCaixa {
  id: string;
  aberturaCaixaId: string;
  tipo: TipoMovimentacao;
  data: string;
  hora: string;
  valor: number;
  formaPagamento?: FormaPagamento;
  descricao: string;
  funcionarioId: string;
  funcionarioNome: string;
  comandaId?: string;
  comandaNumero?: string;
}

export interface ResumoFormaPagamento {
  formaPagamento: FormaPagamento;
  valorEsperado: number;
  valorInformado: number;
  diferenca: number;
  quantidadeVendas: number;
}

export interface ResumoCaixa {
  abertura: AberturaCaixa;
  fechamento?: FechamentoCaixa;
  movimentacoes: MovimentacaoCaixa[];
  sangrias: Sangria[];
  suprimentos: Suprimento[];
  resumoPorFormaPagamento: ResumoFormaPagamento[];
  totalVendas: number;
  totalSangrias: number;
  totalSuprimentos: number;
  saldoFinal: number;
}

export const formasPagamentoLabels: Record<FormaPagamento, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'PIX',
  DEBITO: 'Cartão de Débito',
  CREDITO: 'Cartão de Crédito',
  VALE_REFEICAO: 'Vale Refeição',
  VALE_ALIMENTACAO: 'Vale Alimentação',
};

export const formasPagamentoCores: Record<FormaPagamento, string> = {
  DINHEIRO: 'text-green-600 bg-green-50',
  PIX: 'text-blue-600 bg-blue-50',
  DEBITO: 'text-purple-600 bg-purple-50',
  CREDITO: 'text-orange-600 bg-orange-50',
  VALE_REFEICAO: 'text-pink-600 bg-pink-50',
  VALE_ALIMENTACAO: 'text-teal-600 bg-teal-50',
};
