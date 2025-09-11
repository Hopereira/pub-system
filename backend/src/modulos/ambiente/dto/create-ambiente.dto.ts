import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TipoAmbiente } from '../entities/ambiente.entity'; // 1. IMPORTAMOS O ENUM

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
  @MaxLength(500)
  descricao?: string;

  // --- 2. ADIÇÃO DOS NOVOS CAMPOS E VALIDADORES ---
  @ApiProperty({
    description: 'Define o tipo do ambiente.',
    enum: TipoAmbiente,
    example: TipoAmbiente.PREPARO,
    default: TipoAmbiente.ATENDIMENTO,
    required: false,
  })
  @IsEnum(TipoAmbiente) // Garante que o valor seja um dos definidos no enum
  @IsOptional() // O campo é opcional na requisição, pois a entidade tem um valor padrão
  tipo?: TipoAmbiente;

  @ApiProperty({
    description:
      'Indica se um ambiente de ATENDIMENTO pode ser usado como ponto de retirada de pedidos.',
    example: true,
    default: false,
    required: false,
  })
  @IsBoolean() // Garante que o valor seja um booleano (true/false)
  @IsOptional()
  isPontoDeRetirada?: boolean;
  // --- FIM DA ADIÇÃO ---
}