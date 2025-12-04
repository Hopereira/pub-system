import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  IsUUID,
} from 'class-validator';

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

  @ApiProperty({
    description: 'ID do ambiente onde o cliente está',
    example: 'uuid-do-ambiente',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do ambiente deve ser um UUID válido' })
  ambienteId?: string;

  @ApiProperty({
    description: 'ID do ponto de entrega preferido',
    example: 'uuid-do-ponto-entrega',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do ponto de entrega deve ser um UUID válido' })
  pontoEntregaId?: string;
}
