// Caminho: backend/src/modulos/evento/dto/create-evento.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEventoDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @Type(() => Date)
  @IsDate()
  dataEvento: Date;

  @IsNumber()
  @Min(0)
  @IsOptional()
  valor?: number;

  // ✅ CAMPO QUE FALTAVA ADICIONADO AQUI
  @IsUUID()
  @IsOptional()
  @ApiProperty({
    description: 'ID da Página de Evento (tema) a ser associada.',
    required: false,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  paginaEventoId?: string;
}
