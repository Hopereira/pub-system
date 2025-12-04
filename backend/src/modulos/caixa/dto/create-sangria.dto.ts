import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateSangriaDto {
  @IsUUID()
  aberturaCaixaId: string;

  @IsNumber()
  @Min(0.01, { message: 'Valor da sangria deve ser maior que zero' })
  valor: number;

  @IsString()
  @MinLength(3, { message: 'Motivo deve ter pelo menos 3 caracteres' })
  motivo: string;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsString()
  autorizadoPor?: string;
}
