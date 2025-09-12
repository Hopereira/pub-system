// backend/src/modulos/produto/dto/update-produto.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateProdutoDto } from './create-produto.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateProdutoDto extends PartialType(CreateProdutoDto) {
  @ApiProperty({
    description: 'A nova URL da imagem do produto.',
    example: 'http://localhost:3000/imagens/chopp-novo.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  urlImagem?: string;
}