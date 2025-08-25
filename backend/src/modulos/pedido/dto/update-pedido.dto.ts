import { PartialType } from '@nestjs/swagger'; // <-- A mudança está aqui
import { CreatePedidoDto } from './create-pedido.dto';

export class UpdatePedidoDto extends PartialType(CreatePedidoDto) {}