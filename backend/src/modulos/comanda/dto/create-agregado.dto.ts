// Caminho: backend/src/modulos/comanda/dto/create-agregado.dto.ts
import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgregadoDto {
  @ApiProperty({
    description: 'Nome do agregado',
    example: 'Maria Silva',
  })
  @IsString()
  @MaxLength(100)
  nome: string;

  @ApiPropertyOptional({
    description: 'CPF do agregado (apenas números, sem formatação)',
    example: '12345678901',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{11}$/, {
    message: 'CPF deve conter exatamente 11 dígitos numéricos',
  })
  cpf?: string;
}
