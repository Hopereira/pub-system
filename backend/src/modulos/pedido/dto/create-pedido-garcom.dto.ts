import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ItemPedidoGarcomDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsUUID()
  produtoId: string;

  @ApiProperty({ description: 'Quantidade', example: 2 })
  @IsNotEmpty()
  quantidade: number;

  @ApiProperty({ description: 'Observação do item', required: false })
  @IsOptional()
  @IsString()
  observacao?: string;
}

export class CreatePedidoGarcomDto {
  @ApiProperty({ description: 'ID do cliente' })
  @IsUUID()
  @IsNotEmpty()
  clienteId: string;

  @ApiProperty({ description: 'ID do garçom que está fazendo o pedido' })
  @IsUUID()
  @IsNotEmpty()
  garcomId: string;

  @ApiProperty({ description: 'ID da mesa (opcional)', required: false })
  @IsOptional()
  @IsUUID()
  mesaId?: string;

  @ApiProperty({ description: 'Observação geral do pedido', required: false })
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiProperty({ description: 'Itens do pedido', type: [ItemPedidoGarcomDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoGarcomDto)
  itens: ItemPedidoGarcomDto[];
}
