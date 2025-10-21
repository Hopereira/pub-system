// Caminho: backend/src/modulos/pedido/dto/deixar-no-ambiente.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeixarNoAmbienteDto {
  @ApiPropertyOptional({
    description: 'Motivo pelo qual o cliente não foi encontrado (opcional)',
    example: 'Cliente não estava no local informado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;
}
