// backend/src/modulos/cliente/dto/create-cliente.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateClienteDto {
  @ApiProperty({ description: 'O nome completo do cliente.', example: 'João da Silva' })
  @IsString()
  @IsNotEmpty({ message: 'O nome não pode ser vazio.' }) // ✅ CORREÇÃO: Nome agora é obrigatório
  nome: string;

  @ApiProperty({ description: 'O CPF do cliente, apenas números.', example: '12345678901' })
  @IsString()
  @Length(11, 11, { message: 'O CPF deve ter 11 dígitos.' })
  cpf: string;

  @ApiProperty({ description: 'O email opcional do cliente.', example: 'joao.silva@email.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'O celular opcional do cliente.', example: '21999998888', required: false })
  @IsString()
  @IsOptional()
  celular?: string;
}