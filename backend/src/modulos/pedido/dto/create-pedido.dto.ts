import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  ValidateNested,
} from 'class-validator';

export class CreateItemPedidoDto {
  @ApiProperty({ description: 'ID do produto que está a ser pedido.' })
  @IsUUID()
  produtoId: string;

  @ApiProperty({
    description: 'Quantidade do produto a ser pedida.',
    minimum: 1,
    maximum: 100,
  })
  @IsNumber()
  @IsPositive()
  @Max(100, { message: 'Quantidade máxima é 100 unidades por item' })
  quantidade: number;

  @ApiProperty({
    description: 'Observação opcional para o item.',
    required: false,
  })
  @IsString()
  @IsOptional()
  observacao?: string;
}

export class CreatePedidoDto {
  @ApiProperty({ description: 'ID da comanda onde o pedido será lançado.' })
  @IsUUID()
  @IsNotEmpty()
  comandaId: string;

  @ApiProperty({ type: () => [CreateItemPedidoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemPedidoDto)
  itens: CreateItemPedidoDto[];
}
