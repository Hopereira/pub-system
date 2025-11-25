// Caminho: backend/src/modulos/evento/dto/update-evento.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateEventoDto } from './create-evento.dto';

// Ao estender o CreateEventoDto, ele automaticamente herda o novo campo 'paginaEventoId' como opcional.
// Este arquivo já está correto na sua estrutura, mas o forneço completo para garantir.
export class UpdateEventoDto extends PartialType(CreateEventoDto) {}
