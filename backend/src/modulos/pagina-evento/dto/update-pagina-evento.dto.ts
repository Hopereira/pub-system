// Caminho: backend/src/modulos/pagina-evento/dto/update-pagina-evento.dto.ts

import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreatePaginaEventoDto } from './create-pagina-evento.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePaginaEventoDto extends PartialType(CreatePaginaEventoDto) {
  // --- LINHAS ADICIONADAS ---
  @ApiProperty({
    description: 'Define se a página de evento está ativa ou não.',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  ativa?: boolean;
  // --- FIM DA ADIÇÃO ---
}