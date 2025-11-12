import { IsString, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';

export class CreateAberturaCaixaDto {
  @IsUUID()
  turnoFuncionarioId: string;

  @IsNumber()
  @Min(0, { message: 'Valor inicial deve ser maior ou igual a zero' })
  valorInicial: number;

  @IsOptional()
  @IsString()
  observacao?: string;
}
