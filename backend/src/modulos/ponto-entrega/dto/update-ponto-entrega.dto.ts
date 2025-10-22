// Caminho: backend/src/modulos/ponto-entrega/dto/update-ponto-entrega.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreatePontoEntregaDto } from './create-ponto-entrega.dto';

export class UpdatePontoEntregaDto extends PartialType(CreatePontoEntregaDto) {}
