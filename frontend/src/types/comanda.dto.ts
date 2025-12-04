// frontend/src/types/comanda.dto.ts
import { CreateAgregadoDto } from './ponto-entrega.dto';

export interface CreateComandaDto {
  clienteId?: string;
  mesaId?: string;
  paginaEventoId?: string;
  pontoEntregaId?: string;
  eventoId?: string;
  agregados?: CreateAgregadoDto[];
}