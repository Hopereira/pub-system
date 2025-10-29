import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoService } from './pedido.service';
import { PedidoController } from './pedido.controller';
import { PedidoAnalyticsService } from './pedido-analytics.service';
import { PedidoAnalyticsController } from './pedido-analytics.controller';
import { Pedido } from './entities/pedido.entity';
import { ItemPedido } from './entities/item-pedido.entity';
import { Comanda } from '../comanda/entities/comanda.entity';
import { Produto } from '../produto/entities/produto.entity';
import { Ambiente } from '../ambiente/entities/ambiente.entity';
import { PedidosGateway } from './pedidos.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, ItemPedido, Comanda, Produto, Ambiente])],
  controllers: [PedidoController, PedidoAnalyticsController],
  providers: [PedidoService, PedidoAnalyticsService, PedidosGateway],
  // ==================================================================
  // ## CORREÇÃO: Exportamos o Gateway para que outros módulos o possam usar ##
  // ==================================================================
  exports: [PedidoService, PedidoAnalyticsService, PedidosGateway],
})
export class PedidoModule {}