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
  ValidateNested,
} from 'class-validator';

// 1. DTO para cada item individual do pedido
export class CreateItemPedidoDto {
  @ApiProperty({
    description: 'ID do produto que está a ser pedido.',
    example: 'f9b4d4a0-f3b1-4b3f-8e4a-1e2b8c9d0f1e',
  })
  @IsUUID()
  produtoId: string;

  @ApiProperty({
    description: 'Quantidade do produto a ser pedida.',
    example: 2,
  })
  @IsNumber()
  @IsPositive()
  quantidade: number;

  @ApiProperty({
    description: 'Observação opcional para o item (ex: "sem cebola").',
    example: 'Ao ponto',
    required: false,
  })
  @IsString()
  @IsOptional()
  observacao?: string;
}

// 2. DTO principal do pedido
export class CreatePedidoDto {
  @ApiProperty({
    description: 'ID da comanda onde o pedido será lançado.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  comandaId: string;

  @ApiProperty({
    description: 'A lista de itens que compõem o pedido.',
    type: () => [CreateItemPedidoDto], // Informa ao Swagger a estrutura do array
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemPedidoDto)
  itens: CreateItemPedidoDto[];
}