import { IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckInDto {
  @ApiProperty({
    description: 'ID do funcionário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  funcionarioId: string;

  @ApiPropertyOptional({
    description: 'ID do evento (opcional)',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  eventoId?: string;
}
