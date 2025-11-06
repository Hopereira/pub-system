import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateClienteRapidoDto {
  @ApiProperty({
    description: 'Nome do cliente',
    example: 'João Silva',
  })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @IsString()
  nome: string;

  @ApiProperty({
    description: 'CPF do cliente (apenas números)',
    example: '12345678900',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(11, 11, { message: 'CPF deve ter 11 dígitos' })
  cpf?: string;

  @ApiProperty({
    description: 'Telefone do cliente',
    example: '11987654321',
    required: false,
  })
  @IsOptional()
  @IsString()
  telefone?: string;
}
