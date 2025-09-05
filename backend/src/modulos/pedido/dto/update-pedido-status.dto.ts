// Caminho: backend/src/modulos/pedido/dto/update-pedido-status.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
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
}