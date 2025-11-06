// Caminho: backend/src/modulos/mesa/dto/create-mesa.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsUUID, IsOptional, ValidateNested, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PosicaoDto, TamanhoDto } from './mapa.dto';

export class CreateMesaDto {
  @ApiProperty({
    description: 'O número de identificação da mesa no estabelecimento.',
    example: 15,
  })
  @IsNumber({}, { message: 'O número da mesa deve ser um número.' })
  @IsPositive({ message: 'O número da mesa deve ser um número positivo.' })
  numero: number;

  @ApiProperty({
    description: 'O ID do ambiente ao qual a mesa pertence.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID('4', { message: 'O ID do ambiente deve ser um UUID válido.' })
  ambienteId: string;

  // --- NOVO: Campos opcionais para criar mesa já posicionada ---
  @ApiPropertyOptional({
    description: 'Posição inicial da mesa no mapa (X, Y)',
    type: PosicaoDto,
    example: { x: 100, y: 100 },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PosicaoDto)
  posicao?: PosicaoDto;

  @ApiPropertyOptional({
    description: 'Tamanho da mesa no mapa (largura x altura)',
    type: TamanhoDto,
    example: { width: 80, height: 80 },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TamanhoDto)
  tamanho?: TamanhoDto;

  @ApiPropertyOptional({
    description: 'Rotação da mesa em graus (0, 90, 180, 270)',
    example: 0,
    minimum: 0,
    maximum: 360,
  })
  @IsOptional()
  @IsInt({ message: 'A rotação deve ser um número inteiro.' })
  @Min(0, { message: 'A rotação deve ser no mínimo 0 graus.' })
  @Max(360, { message: 'A rotação deve ser no máximo 360 graus.' })
  rotacao?: number;
}