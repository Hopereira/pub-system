import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'O email informado não é válido.' })
  @IsNotEmpty({ message: 'O campo email não pode estar vazio.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'O campo senha não pode estar vazio.' })
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres.' })
  senha: string;
}
