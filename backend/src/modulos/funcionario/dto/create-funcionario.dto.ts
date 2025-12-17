import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
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

  @ApiPropertyOptional({
    description: 'Telefone do funcionário.',
    example: '(11) 99999-9999',
  })
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({
    description: 'Endereço do funcionário.',
    example: 'Rua das Flores, 123 - Centro',
  })
  @IsOptional()
  @IsString()
  endereco?: string;

  @ApiPropertyOptional({
    description: 'URL da foto do funcionário.',
    example: 'https://example.com/foto.jpg',
  })
  @IsOptional()
  @IsString()
  fotoUrl?: string;
}
