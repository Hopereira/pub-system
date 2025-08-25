import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class CreateMesaDto {
  @ApiProperty({
    description: 'O número de identificação da mesa no estabelecimento.',
    example: 15,
  })
  @IsNumber({}, { message: 'O número da mesa deve ser um número.' })
  @IsPositive({ message: 'O número da mesa deve ser um número positivo.' })
  numero: number;
}