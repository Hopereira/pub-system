import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PedidoStatus } from '../enums/pedido-status.enum';

export class UpdateItemPedidoStatusDto {
  @IsEnum(PedidoStatus)
  status: PedidoStatus;

  // --- PROPRIEDADE ADICIONADA ---
  @IsOptional()
  @IsString()
  motivoCancelamento?: string;
}