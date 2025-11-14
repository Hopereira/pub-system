import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class MarcarEntregueDto {
  @ApiProperty({
    description: 'ID do garçom que está entregando o item',
    example: 'uuid-do-garcom',
  })
  @IsUUID()
  @IsNotEmpty({ message: 'O ID do garçom é obrigatório' })
  garcomId: string;
}
