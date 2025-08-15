import { PartialType } from '@nestjs/mapped-types';
import { CreateComandaDto } from './create-comanda.dto';

export class UpdateComandaDto extends PartialType(CreateComandaDto) {}
