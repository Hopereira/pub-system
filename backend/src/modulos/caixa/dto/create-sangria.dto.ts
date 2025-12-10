import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSangriaDto {
  @ApiProperty({
    description: 'ID da abertura do caixa',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  aberturaCaixaId: string;

  @ApiProperty({
    description: 'Valor da sangria em reais',
    example: 500.00,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01, { message: 'Valor da sangria deve ser maior que zero' })
  valor: number;

  @ApiProperty({
    description: 'Motivo da sangria',
    example: 'Pagamento de fornecedor',
    minLength: 3,
  })
  @IsString()
  @MinLength(3, { message: 'Motivo deve ter pelo menos 3 caracteres' })
  motivo: string;

  @ApiProperty({
    description: 'Observações adicionais',
    example: 'Nota fiscal 12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  observacao?: string;

  @ApiProperty({
    description: 'Nome e cargo de quem autorizou a sangria',
    example: 'João Silva - Gerente',
    required: false,
  })
  @IsOptional()
  @IsString()
  autorizadoPor?: string;
}
