// Caminho: backend/src/modulos/ambiente/dto/create-ambiente.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TipoAmbiente } from '../entities/ambiente.entity';

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

  // --- ADICIONADO ---
  @ApiProperty({
    description: 'Define o tipo do ambiente.',
    enum: TipoAmbiente,
    example: TipoAmbiente.PREPARO,
    default: TipoAmbiente.ATENDIMENTO,
    required: false,
  })
  @IsEnum(TipoAmbiente)
  @IsOptional()
  tipo?: TipoAmbiente;

  // --- ADICIONADO ---
  @ApiProperty({
    description:
      'Indica se um ambiente de ATENDIMENTO pode ser usado como ponto de retirada de pedidos.',
    example: true,
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isPontoDeRetirada?: boolean;
}