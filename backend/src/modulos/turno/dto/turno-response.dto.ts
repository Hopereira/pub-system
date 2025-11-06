import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FuncionarioAtivoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  cargo: string;

  @ApiProperty()
  checkIn: Date;

  @ApiProperty()
  tempoTrabalhado: number; // minutos

  @ApiPropertyOptional()
  evento?: {
    id: string;
    nome: string;
  };
}

export class TurnoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  funcionarioId: string;

  @ApiProperty()
  checkIn: Date;

  @ApiPropertyOptional()
  checkOut?: Date;

  @ApiPropertyOptional()
  horasTrabalhadas?: number;

  @ApiProperty()
  ativo: boolean;

  @ApiPropertyOptional()
  eventoId?: string;

  @ApiProperty()
  criadoEm: Date;
}

export class EstatisticasTurnoDto {
  @ApiProperty()
  totalTurnos: number;

  @ApiProperty()
  horasTotais: number; // minutos

  @ApiProperty()
  horasMedia: number; // minutos

  @ApiProperty()
  turnoMaisLongo: number; // minutos

  @ApiProperty()
  turnoMaisCurto: number; // minutos
}
