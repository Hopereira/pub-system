// backend/src/modulos/produto/dto/create-produto.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateProdutoDto {
  @ApiProperty({
    description: 'O nome do produto, como aparecerá no cardápio.',
    example: 'Chopp Brahma 300ml',
  })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({
    description: 'Uma descrição opcional do produto, com mais detalhes.',
    example: 'Cremoso e refrescante, servido na caneca congelada.',
    required: false,
  })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({
    description: 'O preço de venda do produto.',
    example: 9.9,
  })
  @IsNumber()
  @IsPositive()
  preco: number;

  @ApiProperty({
    description: 'A categoria à qual o produto pertence (ex: Bebidas, Porções).',
    example: 'Bebidas',
  })
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @ApiProperty({
    description: 'O ID do ambiente onde o produto é preparado (ex: Cozinha, Bar).',
    example: 'f9b4d4a0-f3b1-4b3f-8e4a-1e2b8c9d0f1e',
  })
  @IsUUID()
  @IsNotEmpty()
  ambienteId: string;

  @ApiProperty({
    description: 'A URL da imagem do produto.',
    example: 'http://localhost:3000/imagens/chopp.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  urlImagem?: string;
}