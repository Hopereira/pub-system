import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAmbienteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @IsString()
  @IsOptional()
  descricao?: string;
}
