import { IsString, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAberturaCaixaDto {
  @ApiProperty({
    description: 'ID do turno do funcionário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  turnoFuncionarioId: string;

  @ApiProperty({
    description: 'Valor inicial do caixa em reais',
    example: 100.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0, { message: 'Valor inicial deve ser maior ou igual a zero' })
  valorInicial: number;

  @ApiProperty({
    description: 'Observações sobre a abertura do caixa',
    example: 'Abertura do turno da manhã',
    required: false,
  })
  @IsOptional()
  @IsString()
  observacao?: string;
}
