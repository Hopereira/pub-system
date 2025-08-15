import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Cargo } from '../enums/cargo.enum';

export class CreateFuncionarioDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  senha: string;

  @IsEnum(Cargo)
  @IsNotEmpty()
  cargo: Cargo;
}
