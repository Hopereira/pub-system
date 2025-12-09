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
    const response = await api.post('/turnos/check-in', data);
    return response.data;
  },

  /**
   * Fazer check-out (finalizar turno)
   */
  async checkOut(data: CheckOutDto): Promise<TurnoFuncionario> {
    const response = await api.post('/turnos/check-out', data);
    return response.data;
  },

  /**
   * Listar funcionários ativos (com check-in)
   */
  async getFuncionariosAtivos(): Promise<FuncionarioAtivo[]> {
    const response = await api.get('/turnos/ativos');
    return response.data;
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
    const response = await api.get(`/turnos/funcionario/${funcionarioId}`, {
      params,
    });
    return response.data;
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
    const response = await api.get(
      `/turnos/funcionario/${funcionarioId}/estatisticas`,
      { params },
    );
    return response.data;
  },

  /**
   * Verificar se funcionário tem turno ativo (método legado)
   * @deprecated Use getTurnoAtivo para obter o turno completo
   */
  async verificarTurnoAtivo(funcionarioId: string): Promise<boolean> {
    try {
      const turno = await this.getTurnoAtivo(funcionarioId);
      return turno !== null;
    } catch {
      return false;
    }
  },

  /**
   * Buscar turno ativo de um funcionário específico
   * Retorna o turno completo ou null se não houver turno ativo
   */
  async getTurnoAtivo(funcionarioId: string): Promise<TurnoFuncionario | null> {
    try {
      const response = await api.get(`/turnos/funcionario/${funcionarioId}/ativo`);
      return response.data;
    } catch {
      return null;
    }
  },
};

export default turnoService;
