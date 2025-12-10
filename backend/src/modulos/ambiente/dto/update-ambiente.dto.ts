// Caminho: backend/src/modulos/ambiente/dto/update-ambiente.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateAmbienteDto } from './create-ambiente.dto';

// PartialType torna todos os campos de CreateAmbienteDto opcionais.
export class UpdateAmbienteDto extends PartialType(CreateAmbienteDto) {}
