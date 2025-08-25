import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CreateComandaDto {
  @ApiProperty({
    description: 'ID da mesa à qual a comanda será associada. Use este campo ou o clienteId.',
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  mesaId?: string;

  @ApiProperty({
    description: 'ID do cliente ao qual a comanda será associada. Use este campo ou o mesaId.',
    example: 'f9e8d7c6-b5a4-3210-fedc-ba9876543210',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  clienteId?: string;
}