import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateSuprimentoDto {
  @ApiProperty({ description: 'ID da abertura de caixa' })
  @IsUUID()
  @IsNotEmpty()
  aberturaCaixaId: string;

  @ApiProperty({ description: 'Valor do suprimento', example: 100.0 })
  @IsNumber()
  @Min(0.01, { message: 'Valor deve ser maior que zero' })
  valor: number;

  @ApiProperty({ description: 'Motivo do suprimento', required: false })
  @IsString()
  @IsOptional()
  motivo?: string;
}
