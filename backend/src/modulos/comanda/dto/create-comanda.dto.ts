import { IsOptional, IsUUID } from 'class-validator';

export class CreateComandaDto {
  @IsUUID()
  @IsOptional()
  mesaId?: string;

  @IsUUID()
  @IsOptional()
  clienteId?: string;
}
