import { PartialType } from '@nestjs/swagger'; // <-- A mudança está aqui
import { CreateMesaDto } from './create-mesa.dto';

export class UpdateMesaDto extends PartialType(CreateMesaDto) {}
