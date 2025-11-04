// Caminho: backend/src/modulos/comanda/dto/update-ponto-entrega.dto.ts
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePontoEntregaComandaDto {
  @ApiProperty({
    description: 'ID do novo ponto de entrega',
    example: 'uuid-do-ponto',
  })
  @IsUUID()
  pontoEntregaId: string;
}
