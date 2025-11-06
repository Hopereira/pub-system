import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAvaliacaoDto {
  @ApiProperty({
    description: 'ID da comanda avaliada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  comandaId: string;

  @ApiProperty({
    description: 'Nota de 1 a 5 estrelas',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  nota: number;

  @ApiPropertyOptional({
    description: 'Comentário opcional sobre a experiência',
    example: 'Excelente atendimento! Comida deliciosa.',
  })
  @IsOptional()
  @IsString()
  comentario?: string;
}
