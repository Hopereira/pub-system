import { PartialType } from '@nestjs/swagger'; // <-- A mudança está aqui
import { CreateEmpresaDto } from './create-empresa.dto';

export class UpdateEmpresaDto extends PartialType(CreateEmpresaDto) {}
