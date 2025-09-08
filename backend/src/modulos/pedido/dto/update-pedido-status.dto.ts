// Caminho: backend/src/modulos/pedido/dto/update-pedido-status.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PedidoStatus } from '../entities/pedido.entity';

export class UpdatePedidoStatusDto {
  @ApiProperty({
    description: 'O novo status do pedido',
    enum: PedidoStatus,
    example: PedidoStatus.EM_PREPARO,
  })
  @IsEnum(PedidoStatus, {
    message: `O status deve ser um dos seguintes valores: ${Object.values(
      PedidoStatus,
    ).join(', ')}`,
  })
  status: PedidoStatus;

  // --- ALTERAÇÃO INSERIDA ---
  @ApiPropertyOptional({
    description: 'O motivo pelo qual o pedido está a ser cancelado. Obrigatório se o status for "CANCELADO"',
    example: 'Item em falta no estoque.',
  })
  @IsOptional()
  @IsString({ message: 'O motivo do cancelamento deve ser um texto.'})
  @MinLength(5, { message: 'O motivo do cancelamento deve ter no mínimo 5 caracteres.'})
  @MaxLength(255, { message: 'O motivo do cancelamento deve ter no máximo 255 caracteres.'})
  motivoCancelamento?: string;
  // --- FIM DA ALTERAÇÃO ---
}