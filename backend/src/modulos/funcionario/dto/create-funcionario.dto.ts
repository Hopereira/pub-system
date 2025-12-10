import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { Cargo } from '../enums/cargo.enum'; // <-- LINHA CORRIGIDA

export class CreateFuncionarioDto {
  @ApiProperty({
    description: 'O nome completo do funcionário.',
    example: 'João da Silva',
  })
  @IsNotEmpty({ message: 'O nome não pode ser vazio.' })
  nome: string;

  @ApiProperty({
    description: 'O e-mail único do funcionário, usado para login.',
    example: 'joao.silva@pub.com',
  })
  @IsEmail({}, { message: 'O e-mail fornecido é inválido.' })
  email: string;

  @ApiProperty({
    description: 'A senha do funcionário. Mínimo de 6 caracteres.',
    example: 'senhaForte123',
  })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  senha: string;

  @ApiProperty({
    description: 'O cargo do funcionário no sistema.',
    enum: Cargo, // <-- USO CORRIGIDO
    example: Cargo.GARCOM, // <-- USO CORRIGIDO
  })
  @IsEnum(Cargo, { message: 'O cargo fornecido é inválido.' }) // <-- USO CORRIGIDO
  cargo: Cargo; // <-- USO CORRIGIDO
}
