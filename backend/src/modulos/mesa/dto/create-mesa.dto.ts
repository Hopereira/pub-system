// Caminho: backend/src/modulos/mesa/dto/create-mesa.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateMesaDto {
  @ApiProperty({
    description: 'O número de identificação da mesa no estabelecimento.',
    example: 15,
  })
  @IsNumber({}, { message: 'O número da mesa deve ser um número.' })
  @IsPositive({ message: 'O número da mesa deve ser um número positivo.' })
  numero: number;

  // --- NOVO: Adicionamos o campo para receber o ID do ambiente ---
  @ApiProperty({
    description: 'O ID do ambiente ao qual a mesa pertence.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID('4', { message: 'O ID do ambiente deve ser um UUID válido.' })
  ambienteId: string;
}