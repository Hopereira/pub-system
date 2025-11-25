// Caminho: backend/src/modulos/comanda/dto/create-comanda.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAgregadoDto } from './create-agregado.dto';

export class CreateComandaDto {
  @ApiPropertyOptional({
    description: 'ID da mesa (exclusivo com pontoEntregaId)',
  })
  @IsUUID()
  @IsOptional()
  mesaId?: string;

  @ApiPropertyOptional({
    description: 'ID do ponto de entrega (exclusivo com mesaId)',
  })
  @IsUUID()
  @IsOptional()
  pontoEntregaId?: string;

  @ApiPropertyOptional({ description: 'ID do cliente principal' })
  @IsUUID()
  @IsOptional()
  clienteId?: string;

  @ApiPropertyOptional({ description: 'ID da página de evento (opcional)' })
  @IsUUID()
  @IsOptional()
  paginaEventoId?: string;

  @ApiPropertyOptional({
    description: 'ID do Evento (da agenda) para cobrar a entrada (opcional)',
  })
  @IsUUID()
  @IsOptional()
  eventoId?: string;

  @ApiPropertyOptional({
    description: 'Lista de agregados (familiares/amigos) na mesma comanda',
    type: [CreateAgregadoDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAgregadoDto)
  agregados?: CreateAgregadoDto[];
}
