import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateEventoDto } from './create-evento.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateEventoDto extends PartialType(CreateEventoDto) {
  @ApiProperty({
    description: 'Define se o evento está ativo (visível para o público) ou inativo.',
    example: false,
    required: false,
  })
  @IsBoolean({ message: 'O status de ativo deve ser um booleano (true/false).' })
  @IsOptional()
  ativo?: boolean;
}