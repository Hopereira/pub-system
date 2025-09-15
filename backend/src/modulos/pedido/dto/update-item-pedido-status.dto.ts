import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PedidoStatus } from '../enums/pedido-status.enum';

export class UpdateItemPedidoStatusDto {
  @ApiProperty({
    description: 'O novo status do item do pedido',
    enum: PedidoStatus,
    example: PedidoStatus.EM_PREPARO,
  })
  @IsEnum(PedidoStatus)
  status: PedidoStatus;
}