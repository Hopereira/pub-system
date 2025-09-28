// Caminho: backend/src/modulos/pagina-evento/dto/create-pagina-evento.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePaginaEventoDto {
  @ApiProperty({
    description: 'O título principal da página do evento.',
    example: 'Festa de Lançamento da Cerveja IPA',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  titulo: string;
}