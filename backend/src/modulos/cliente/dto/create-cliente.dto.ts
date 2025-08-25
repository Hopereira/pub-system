import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class CreateClienteDto {
  @ApiProperty({
    description: 'O CPF do cliente. Pode ser enviado com ou sem pontuação.',
    example: '12345678901',
    minLength: 11,
    maxLength: 14,
  })
  @IsString()
  @IsNotEmpty()
  @Length(11, 14) // Aceita CPF com ou sem formatação
  cpf: string;

  @ApiProperty({
    description: 'O nome opcional do cliente.',
    example: 'Maria Souza',
    required: false,
  })
  @IsString()
  @IsOptional()
  nome?: string;
}