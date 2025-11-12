import { IsString, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';

export class CreateFechamentoCaixaDto {
  @IsUUID()
  aberturaCaixaId: string;

  @IsNumber()
  @Min(0)
  valorInformadoDinheiro: number;

  @IsNumber()
  @Min(0)
  valorInformadoPix: number;

  @IsNumber()
  @Min(0)
  valorInformadoDebito: number;

  @IsNumber()
  @Min(0)
  valorInformadoCredito: number;

  @IsNumber()
  @Min(0)
  valorInformadoValeRefeicao: number;

  @IsNumber()
  @Min(0)
  valorInformadoValeAlimentacao: number;

  @IsOptional()
  @IsString()
  observacao?: string;
}
