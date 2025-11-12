import { IsNotEmpty, IsNumber, IsString, IsEnum, IsOptional, Min } from 'class-validator';

export enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  PIX = 'PIX',
  DEBITO = 'DEBITO',
  CREDITO = 'CREDITO',
  VALE_REFEICAO = 'VALE_REFEICAO',
  VALE_ALIMENTACAO = 'VALE_ALIMENTACAO',
}

export class CreateVendaDto {
  @IsNotEmpty()
  @IsString()
  aberturaCaixaId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  valor: number;

  @IsNotEmpty()
  @IsEnum(FormaPagamento)
  formaPagamento: FormaPagamento;

  @IsNotEmpty()
  @IsString()
  comandaId: string;

  @IsOptional()
  @IsString()
  comandaNumero?: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}
