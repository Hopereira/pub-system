import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedalhaService } from './medalha.service';
import { MedalhaController } from './medalha.controller';
import { MedalhaScheduler } from './medalha.scheduler';
import { Medalha } from './entities/medalha.entity';
import { MedalhaGarcom } from './entities/medalha-garcom.entity';
import { ItemPedido } from '../pedido/entities/item-pedido.entity';
import { Funcionario } from '../funcionario/entities/funcionario.entity';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Medalha,
      MedalhaGarcom,
      ItemPedido,
      Funcionario,
    ]),
    EventsModule,
  ],
  controllers: [MedalhaController],
  providers: [MedalhaService, MedalhaScheduler],
  exports: [MedalhaService],
})
export class MedalhaModule {}
