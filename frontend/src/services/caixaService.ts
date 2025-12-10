import api from './api';
import {
  AberturaCaixa,
  FechamentoCaixa,
  Sangria,
  Suprimento,
  MovimentacaoCaixa,
  ResumoCaixa,
  FormaPagamento,
} from '@/types/caixa';

export const caixaService = {
  /**
   * Abrir caixa (requer turno ativo)
   */
  async abrirCaixa(data: {
    turnoFuncionarioId: string;
    valorInicial: number;
    observacao?: string;
  }): Promise<AberturaCaixa> {
    try {
      const response = await api.post('/caixa/abertura', data);
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao abrir caixa:', error);
      throw error;
    }
  },

  /**
   * Fechar caixa
   */
  async fecharCaixa(data: {
    aberturaCaixaId: string;
    valorInformadoDinheiro: number;
    valorInformadoPix: number;
    valorInformadoDebito: number;
    valorInformadoCredito: number;
    valorInformadoValeRefeicao: number;
    valorInformadoValeAlimentacao: number;
    observacao?: string;
  }): Promise<FechamentoCaixa> {
    try {
      const response = await api.post('/caixa/fechamento', data);
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao fechar caixa:', error);
      throw error;
    }
  },

  /**
   * Registrar sangria
   */
  async registrarSangria(data: {
    aberturaCaixaId: string;
    valor: number;
    motivo: string;
    observacao?: string;
    autorizadoPor?: string;
  }): Promise<Sangria> {
    try {
      const response = await api.post('/caixa/sangria', data);
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao registrar sangria:', error);
      throw error;
    }
  },

  /**
   * Registrar suprimento
   */
  async registrarSuprimento(data: {
    aberturaCaixaId: string;
    valor: number;
    motivo: string;
    observacao?: string;
  }): Promise<Suprimento> {
    try {
      const response = await api.post('/caixa/suprimento', data);
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao registrar suprimento:', error);
      throw error;
    }
  },

  /**
   * Registrar venda (fechamento de comanda)
   */
  async registrarVenda(data: {
    aberturaCaixaId: string;
    valor: number;
    formaPagamento: FormaPagamento;
    comandaId: string;
    comandaNumero?: string;
    descricao?: string;
  }): Promise<MovimentacaoCaixa> {
    try {
      const response = await api.post('/caixa/venda', data);
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao registrar venda:', error);
      throw error;
    }
  },

  /**
   * Obter caixa aberto (com ou sem turnoId)
   * Se não informar turnoId, busca qualquer caixa aberto
   */
  async getCaixaAberto(turnoFuncionarioId?: string): Promise<AberturaCaixa | null> {
    try {
      const url = turnoFuncionarioId 
        ? `/caixa/aberto?turnoId=${turnoFuncionarioId}`
        : '/caixa/aberto';
      const response = await api.get(url);
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao buscar caixa aberto:', error);
      return null;
    }
  },

  /**
   * Obter caixa aberto do funcionário específico (isolamento de caixas)
   */
  async getCaixaAbertoPorFuncionario(funcionarioId: string): Promise<AberturaCaixa | null> {
    try {
      const response = await api.get(`/caixa/aberto?funcionarioId=${funcionarioId}`);
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao buscar caixa aberto do funcionário:', error);
      return null;
    }
  },

  /**
   * Obter todos os caixas abertos (apenas para admin/gestor)
   */
  async getTodosCaixasAbertos(): Promise<AberturaCaixa[]> {
    try {
      const response = await api.get('/caixa/aberto/todos');
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao buscar todos os caixas abertos:', error);
      return [];
    }
  },

  /**
   * Obter qualquer caixa aberto no momento (não requer turnoId)
   * Alias para getCaixaAberto() sem parâmetros
   * @deprecated Use getCaixaAbertoPorFuncionario para garantir isolamento
   */
  async getCaixaAbertoAtual(): Promise<AberturaCaixa | null> {
    return this.getCaixaAberto();
  },

  /**
   * Obter resumo completo do caixa
   */
  async getResumoCaixa(aberturaCaixaId: string): Promise<ResumoCaixa> {
    try {
      const response = await api.get(`/caixa/${aberturaCaixaId}/resumo`);
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao buscar resumo do caixa:', error);
      throw error;
    }
  },

  /**
   * Listar movimentações do caixa
   */
  async getMovimentacoes(aberturaCaixaId: string): Promise<MovimentacaoCaixa[]> {
    try {
      const response = await api.get(`/caixa/${aberturaCaixaId}/movimentacoes`);
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao buscar movimentações:', error);
      throw error;
    }
  },

  /**
   * Listar sangrias do caixa
   */
  async getSangrias(aberturaCaixaId: string): Promise<Sangria[]> {
    try {
      const response = await api.get(`/caixa/${aberturaCaixaId}/sangrias`);
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao buscar sangrias:', error);
      throw error;
    }
  },

  /**
   * Histórico de fechamentos
   */
  async getHistoricoFechamentos(params?: {
    funcionarioId?: string;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<FechamentoCaixa[]> {
    try {
      const response = await api.get('/caixa/historico', { params });
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }
  },
};

export default caixaService;
