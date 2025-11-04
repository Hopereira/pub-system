import { ApiProperty } from '@nestjs/swagger';

export class AvaliacaoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  comandaId: string;

  @ApiProperty()
  clienteNome: string;

  @ApiProperty()
  nota: number;

  @ApiProperty()
  comentario: string;

  @ApiProperty()
  tempoEstadia: number;

  @ApiProperty()
  valorGasto: number;

  @ApiProperty()
  criadoEm: Date;

  @ApiProperty()
  mesaNumero?: number;

  @ApiProperty()
  ambienteNome?: string;
}

export class EstatisticasSatisfacaoDto {
  @ApiProperty({ description: 'Média de satisfação (1-5)' })
  mediaSatisfacao: number;

  @ApiProperty({ description: 'Total de avaliações' })
  totalAvaliacoes: number;

  @ApiProperty({ description: 'Distribuição por nota' })
  distribuicao: {
    nota1: number;
    nota2: number;
    nota3: number;
    nota4: number;
    nota5: number;
  };

  @ApiProperty({ description: 'Tempo médio de estadia (minutos)' })
  tempoMedioEstadia: number;

  @ApiProperty({ description: 'Valor médio gasto' })
  valorMedioGasto: number;

  @ApiProperty({ description: 'Taxa de satisfação (%)' })
  taxaSatisfacao: number; // Porcentagem de notas 4 e 5
}
