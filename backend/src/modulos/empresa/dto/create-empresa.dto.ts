// importamos as ferramentas de validação
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmpresaDto {
  // @IsString() -> garante que o valor seja um texto
  // @IsNotEmpty() -> garante que o valor não seja vazio
  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @IsString()
  @IsNotEmpty()
  nomeFantasia: string;

  @IsString()
  @IsNotEmpty()
  razaoSocial: string;

  // @IsOptional() -> diz que este campo não é obrigatório
  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @IsOptional()
  endereco?: string;
}
