// Caminho: backend/src/modulos/pedido/pedido.module.ts
import { Module } from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { PedidoController } from './pedido.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './entities/pedido.entity';
import { ItemPedido } from './entities/item-pedido.entity';
import { Comanda } from '../comanda/entities/comanda.entity';
import { Produto } from '../produto/entities/produto.entity';
// --- ADIÇÃO ---
import { PedidosGateway } from './pedidos.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, ItemPedido, Comanda, Produto])],
  controllers: [PedidoController],
  // --- ALTERAÇÃO: Adicionamos o gateway à lista de providers ---
  providers: [PedidoService, PedidosGateway],
})
export class PedidoModule {}