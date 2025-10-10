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
  
  // ✅ NOVO CAMPO ADICIONADO
  @IsUUID()
  @IsOptional()
  @ApiProperty({ description: 'ID da Página de Evento usada para o cadastro (opcional)' })
  paginaEventoId?: string;
}