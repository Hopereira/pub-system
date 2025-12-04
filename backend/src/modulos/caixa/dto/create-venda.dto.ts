import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  PIX = 'PIX',
  DEBITO = 'DEBITO',
  CREDITO = 'CREDITO',
  VALE_REFEICAO = 'VALE_REFEICAO',
  VALE_ALIMENTACAO = 'VALE_ALIMENTACAO',
}

export class CreateVendaDto {
  @ApiProperty({
    description: 'ID da abertura do caixa',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsString()
  aberturaCaixaId: string;

  @ApiProperty({
    description: 'Valor da venda em reais',
    example: 125.50,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  valor: number;

  @ApiProperty({
    description: 'Forma de pagamento utilizada',
    enum: FormaPagamento,
    example: FormaPagamento.PIX,
  })
  @IsNotEmpty()
  @IsEnum(FormaPagamento)
  formaPagamento: FormaPagamento;

  @ApiProperty({
    description: 'ID da comanda',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsNotEmpty()
  @IsString()
  comandaId: string;

  @ApiProperty({
    description: 'Número da comanda',
    example: 'CMD-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  comandaNumero?: string;

  @ApiProperty({
    description: 'Descrição adicional da venda',
    example: 'Pagamento da mesa 5',
    required: false,
  })
  @IsOptional()
  @IsString()
  descricao?: string;
}
