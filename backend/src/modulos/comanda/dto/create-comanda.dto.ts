// Caminho: backend/src/modulos/comanda/dto/create-comanda.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CreateComandaDto {
  @IsUUID()
  @IsOptional()
  mesaId?: string;

  @IsUUID()
  @IsOptional()
  clienteId?: string;
  
  @IsUUID()
  @IsOptional()
  paginaEventoId?: string;

  // ✅ NOVO CAMPO ADICIONADO
  @IsUUID()
  @IsOptional()
  @ApiProperty({ description: 'ID do Evento (da agenda) para cobrar a entrada (opcional)' })
  eventoId?: string;
}