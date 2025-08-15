import { IsNumber, IsPositive } from 'class-validator';

export class CreateMesaDto {
  @IsNumber({}, { message: 'O número da mesa deve ser um número.' })
  @IsPositive({ message: 'O número da mesa deve ser um número positivo.' })
  numero: number;
}
