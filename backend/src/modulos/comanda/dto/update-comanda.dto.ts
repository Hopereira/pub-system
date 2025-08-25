import { PartialType } from '@nestjs/swagger'; // <-- A mudança está aqui
import { CreateComandaDto } from './create-comanda.dto';

export class UpdateComandaDto extends PartialType(CreateComandaDto) {}