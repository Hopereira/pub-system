// Caminho: backend/src/modulos/pagina-evento/dto/update-pagina-evento.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreatePaginaEventoDto } from './create-pagina-evento.dto';

// PartialType torna todos os campos de CreatePaginaEventoDto opcionais para a atualização.
export class UpdatePaginaEventoDto extends PartialType(CreatePaginaEventoDto) {}