import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PedidoStatus } from '../enums/pedido-status.enum';

export class UpdateItemPedidoStatusDto {
  @ApiProperty({
    description: 'Novo status do item',
    enum: PedidoStatus,
    example: PedidoStatus.PRONTO,
  })
  @IsEnum(PedidoStatus)
  status: PedidoStatus;

  @ApiPropertyOptional({
    description: 'Motivo do cancelamento (obrigatório se status = CANCELADO)',
    example: 'Cliente desistiu do item',
  })
  @IsOptional()
  @IsString()
  motivoCancelamento?: string;
}
