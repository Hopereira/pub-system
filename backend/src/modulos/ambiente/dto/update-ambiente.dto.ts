import { PartialType } from '@nestjs/swagger'; // <-- A mudança está aqui
import { CreateAmbienteDto } from './create-ambiente.dto';

export class UpdateAmbienteDto extends PartialType(CreateAmbienteDto) {}