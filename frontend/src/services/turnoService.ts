import api from './api';
import {
  TurnoFuncionario,
  CheckInDto,
  CheckOutDto,
  FuncionarioAtivo,
  EstatisticasTurno,
} from '@/types/turno';

export const turnoService = {
  /**
   * Fazer check-in (iniciar turno)
   */
  async checkIn(data: CheckInDto): Promise<TurnoFuncionario> {
    try {
      const response = await api.post('/turnos/check-in', data);
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao fazer check-in:', error);
      throw error;
    }
  },

  /**
   * Fazer check-out (finalizar turno)
   */
  async checkOut(data: CheckOutDto): Promise<TurnoFuncionario> {
    try {
      const response = await api.post('/turnos/check-out', data);
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao fazer check-out:', error);
      throw error;
    }
  },

  /**
   * Listar funcionários ativos (com check-in)
   */
  async getFuncionariosAtivos(): Promise<FuncionarioAtivo[]> {
    try {
      const response = await api.get('/turnos/ativos');
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao buscar funcionários ativos:', error);
      throw error;
    }
  },

  /**
   * Listar turnos de um funcionário
   */
  async getTurnosFuncionario(
    funcionarioId: string,
    params?: {
      dataInicio?: string;
      dataFim?: string;
    },
  ): Promise<TurnoFuncionario[]> {
    try {
      const response = await api.get(`/turnos/funcionario/${funcionarioId}`, {
        params,
      });
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao buscar turnos do funcionário:', error);
      throw error;
    }
  },

  /**
   * Obter estatísticas de turnos de um funcionário
   */
  async getEstatisticasFuncionario(
    funcionarioId: string,
    params?: {
      dataInicio?: string;
      dataFim?: string;
    },
  ): Promise<EstatisticasTurno> {
    try {
      const response = await api.get(
        `/turnos/funcionario/${funcionarioId}/estatisticas`,
        { params },
      );
      return response.data;
    } catch (error: unknown) {
      console.error('Erro ao buscar estatísticas do funcionário:', error);
      throw error;
    }
  },

  /**
   * Verificar se funcionário tem turno ativo
   */
  async verificarTurnoAtivo(funcionarioId: string): Promise<boolean> {
    try {
      const turnos = await this.getTurnosFuncionario(funcionarioId);
      return turnos.some((t) => t.ativo && !t.checkOut);
    } catch (error: unknown) {
      console.error('Erro ao verificar turno ativo:', error);
      return false;
    }
  },
};

export default turnoService;
