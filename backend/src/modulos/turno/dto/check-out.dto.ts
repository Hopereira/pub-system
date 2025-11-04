import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckOutDto {
  @ApiProperty({
    description: 'ID do funcionário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  funcionarioId: string;
}
