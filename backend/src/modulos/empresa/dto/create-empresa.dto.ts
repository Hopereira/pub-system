import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmpresaDto {
  @ApiProperty({
    description: 'O CNPJ da empresa, sem pontuação.',
    example: '12345678000199',
  })
  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @ApiProperty({
    description: 'O nome fantasia do estabelecimento.',
    example: 'Pub do Zé',
  })
  @IsString()
  @IsNotEmpty()
  nomeFantasia: string;

  @ApiProperty({
    description: 'A razão social oficial da empresa.',
    example: 'JOSE DA SILVA RESTAURANTE LTDA',
  })
  @IsString()
  @IsNotEmpty()
  razaoSocial: string;

  @ApiProperty({
    description: 'Telefone de contato opcional do estabelecimento.',
    example: '(24) 2222-3333',
    required: false,
  })
  @IsString()
  @IsOptional()
  telefone?: string;

  @ApiProperty({
    description: 'Endereço físico opcional do estabelecimento.',
    example: 'Rua das Flores, 123 - Centro, Petrópolis - RJ',
    required: false,
  })
  @IsString()
  @IsOptional()
  endereco?: string;
}
