import { IsString, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFechamentoCaixaDto {
  @ApiProperty({
    description: 'ID da abertura do caixa a ser fechado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  aberturaCaixaId: string;

  @ApiProperty({
    description: 'Valor contado em dinheiro',
    example: 835.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  valorInformadoDinheiro: number;

  @ApiProperty({
    description: 'Valor contado em PIX',
    example: 450.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  valorInformadoPix: number;

  @ApiProperty({
    description: 'Valor contado em cartão de débito',
    example: 200.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  valorInformadoDebito: number;

  @ApiProperty({
    description: 'Valor contado em cartão de crédito',
    example: 300.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  valorInformadoCredito: number;

  @ApiProperty({
    description: 'Valor contado em vale refeição',
    example: 150.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  valorInformadoValeRefeicao: number;

  @ApiProperty({
    description: 'Valor contado em vale alimentação',
    example: 100.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  valorInformadoValeAlimentacao: number;

  @ApiProperty({
    description: 'Observações sobre o fechamento',
    example: 'Fechamento do turno da manhã',
    required: false,
  })
  @IsOptional()
  @IsString()
  observacao?: string;
}
