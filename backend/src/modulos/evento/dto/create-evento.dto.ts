import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateEventoDto {
  @ApiProperty({ description: 'O título do evento.', example: 'Sexta do Rock' })
  @IsString()
  @IsNotEmpty({ message: 'O título não pode ser vazio.' })
  titulo: string;

  @ApiProperty({
    description: 'A descrição detalhada do evento.',
    example: 'Show com a banda Local Heros a partir das 21h.',
    required: false,
  })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({
    description: 'A data e hora do evento no formato ISO 8601.',
    example: '2025-10-31T21:00:00.000Z',
  })
  @IsDateString({}, { message: 'A data do evento deve estar no formato de data válido.' })
  @IsNotEmpty({ message: 'A data do evento é obrigatória.' })
  dataEvento: Date;

  @ApiProperty({
    description: 'O valor do ingresso ou entrada. 0 para gratuito.',
    example: 25.50,
    required: false,
    default: 0,
  })
  @Type(() => Number) // Garante a conversão para número
  @IsNumber({}, { message: 'O valor deve ser um número.' })
  @Min(0, { message: 'O valor não pode ser negativo.' })
  @IsOptional()
  valor?: number;

  @ApiProperty({
    description: 'A URL para a imagem de divulgação do evento.',
    example: 'https://example.com/imagem_do_show.jpg',
    required: false,
  })
  @IsUrl({}, { message: 'A URL da imagem deve ser uma URL válida.' })
  @IsOptional()
  urlImagem?: string;
}