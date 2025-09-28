import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateProdutoDto {
  @ApiProperty({ description: 'O nome do produto.' })
  @IsString()
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ description: 'Uma descrição opcional.', required: false })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({ description: 'O preço de venda do produto.' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  preco: number;

  @ApiProperty({ description: 'A categoria à qual o produto pertence.' })
  @IsString()
  @IsNotEmpty()
  categoria: string;

  @ApiProperty({ description: 'O ID do ambiente onde o produto é preparado.' })
  @IsUUID()
  @IsNotEmpty()
  ambienteId: string;

  @ApiProperty({ description: 'A URL da imagem do produto.', required: false })
  @IsString()
  @IsOptional()
  urlImagem?: string;
}