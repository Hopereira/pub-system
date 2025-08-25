import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAmbienteDto {
  @ApiProperty({
    description: 'Nome do ambiente operacional (ex: Cozinha, Bar Principal).',
    example: 'Cozinha',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome: string;

  @ApiProperty({
    description: 'Descrição opcional do ambiente, detalhando sua função.',
    example: 'Responsável pelo preparo de todos os pratos quentes.',
    required: false,
  })
  @IsString()
  @IsOptional()
  descricao?: string;
}