// Caminho: backend/src/modulos/ponto-entrega/dto/create-ponto-entrega.dto.ts
import { IsString, IsUUID, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePontoEntregaDto {
  @ApiProperty({
    description: 'Nome do ponto de entrega',
    example: 'Piscina infantil - lado direito',
  })
  @IsString()
  @MaxLength(100)
  nome: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do ponto',
    example: 'Próximo ao escorregador amarelo',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({
    description: 'ID da mesa próxima (referência de localização)',
    example: 'uuid-da-mesa',
  })
  @IsOptional()
  @IsUUID()
  mesaProximaId?: string;

  @ApiProperty({
    description: 'ID do ambiente de preparo (onde deixar se cliente não for encontrado)',
    example: 'uuid-do-ambiente',
  })
  @IsUUID()
  ambientePreparoId: string;

  @ApiPropertyOptional({
    description: 'Se o ponto está ativo',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
