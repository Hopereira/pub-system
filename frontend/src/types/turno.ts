export interface TurnoFuncionario {
  id: string;
  funcionarioId: string;
  checkIn: Date;
  checkOut?: Date;
  horasTrabalhadas?: number;
  ativo: boolean;
  eventoId?: string;
  criadoEm: Date;
}

export interface CheckInDto {
  funcionarioId: string;
  eventoId?: string;
}

export interface CheckOutDto {
  funcionarioId: string;
}

export interface FuncionarioAtivo {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  checkIn: Date;
  tempoTrabalhado: number; // minutos
  evento?: {
    id: string;
    nome: string;
  };
}

export interface EstatisticasTurno {
  totalTurnos: number;
  horasTotais: number; // minutos
  horasMedia: number; // minutos
  turnoMaisLongo: number; // minutos
  turnoMaisCurto: number; // minutos
}
