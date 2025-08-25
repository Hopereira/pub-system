// backend/src/modulos/pedido/pedido.module.ts
import { Module } from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { PedidoController } from './pedido.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './entities/pedido.entity';
import { ItemPedido } from './entities/item-pedido.entity';
import { Comanda } from '../comanda/entities/comanda.entity';
import { Produto } from '../produto/entities/produto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, ItemPedido, Comanda, Produto])],
  controllers: [PedidoController],
  providers: [PedidoService],
})
export class PedidoModule {}