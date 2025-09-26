import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
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
    description: 'A URL para a imagem de divulgação do evento.',
    example: 'https://example.com/imagem_do_show.jpg',
    required: false,
  })
  @IsUrl({}, { message: 'A URL da imagem deve ser uma URL válida.' })
  @IsOptional()
  urlImagem?: string;
}
