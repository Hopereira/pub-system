// Caminho: backend/src/modulos/pagina-evento/dto/create-pagina-evento.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreatePaginaEventoDto {
  @ApiProperty({
    description: 'O título principal da página do evento.',
    example: 'Festa de Lançamento da Cerveja IPA',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  titulo: string;

  @ApiProperty({
    description: 'A URL completa da imagem de banner da página.',
    example: 'https://exemplo.com/banner.jpg',
  })
  @IsUrl({}, { message: 'Por favor, insira uma URL válida.' })
  @IsNotEmpty()
  urlImagem: string;

  @ApiProperty({
    description: 'Define se a página está ativa e pode ser acedida.',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  ativa?: boolean;
}