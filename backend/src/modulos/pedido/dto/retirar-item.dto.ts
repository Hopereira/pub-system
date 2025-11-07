import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RetirarItemDto {
  @ApiProperty({
    description: 'ID do garçom que está retirando o item',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  garcomId: string;
}
