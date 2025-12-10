import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FormaPagamento } from '../../caixa/dto/create-venda.dto';

export class FecharComandaDto {
  @ApiProperty({
    description: 'Forma de pagamento utilizada',
    enum: FormaPagamento,
    example: FormaPagamento.DINHEIRO,
  })
  @IsEnum(FormaPagamento, {
    message:
      'Forma de pagamento inválida. Valores aceitos: DINHEIRO, PIX, DEBITO, CREDITO, VALE_REFEICAO, VALE_ALIMENTACAO',
  })
  @IsNotEmpty({ message: 'Forma de pagamento é obrigatória' })
  formaPagamento: FormaPagamento;

  @ApiProperty({
    description:
      'Valor pago pelo cliente (obrigatório apenas para DINHEIRO para calcular troco)',
    example: 100.0,
    required: false,
  })
  @IsNumber({}, { message: 'Valor pago deve ser um número' })
  @IsPositive({ message: 'Valor pago deve ser positivo' })
  @IsOptional()
  valorPago?: number;

  @ApiProperty({
    description: 'Observações sobre o pagamento',
    example: 'Cliente solicitou nota fiscal',
    required: false,
  })
  @IsString()
  @IsOptional()
  observacao?: string;
}
