import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoService } from './pedido.service';
import { PedidoController } from './pedido.controller';
import { Pedido } from './entities/pedido.entity';
import { ItemPedido } from './entities/item-pedido.entity';
import { Comanda } from '../comanda/entities/comanda.entity';
import { Produto } from '../produto/entities/produto.entity';
import { PedidosGateway } from './pedidos.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, ItemPedido, Comanda, Produto])],
  controllers: [PedidoController],
  providers: [PedidoService, PedidosGateway],
  exports: [PedidoService],
})
export class PedidoModule {}