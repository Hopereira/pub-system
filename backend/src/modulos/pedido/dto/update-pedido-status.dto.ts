import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PedidoStatus } from '../enums/pedido-status.enum';

// DTO para a rota antiga e obsoleta
export class UpdatePedidoStatusDto {
  @ApiProperty({ enum: PedidoStatus })
  @IsEnum(PedidoStatus)
  status: PedidoStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(255)
  motivoCancelamento?: string;
}
