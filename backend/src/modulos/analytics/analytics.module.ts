import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { PedidoModule } from '../pedido/pedido.module';
import { ComandaModule } from '../comanda/comanda.module';

@Module({
  imports: [
    PedidoModule, // Fornece PedidoRepository e ItemPedidoRepository
    ComandaModule, // Fornece ComandaRepository
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
