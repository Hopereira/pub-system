import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @IsNotEmpty()
  @Length(11, 14) // Aceita CPF com ou sem formatação
  cpf: string;

  @IsString()
  @IsOptional()
  nome?: string;
}
