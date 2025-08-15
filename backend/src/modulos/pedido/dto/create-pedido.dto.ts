import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsUUID,
  ValidateNested,
} from 'class-validator';

// 1. DTO para cada item individual do pedido
export class CreateItemPedidoDto {
  @IsUUID()
  produtoId: string;

  @IsNumber()
  @IsPositive()
  quantidade: number;
}

// 2. DTO principal do pedido
export class CreatePedidoDto {
  @IsUUID()
  @IsNotEmpty()
  comandaId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemPedidoDto)
  itens: CreateItemPedidoDto[];
}