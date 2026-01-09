import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedalhaService } from './medalha.service';
import { MedalhaController } from './medalha.controller';
import { MedalhaScheduler } from './medalha.scheduler';
import { Medalha } from './entities/medalha.entity';
import { MedalhaGarcom } from './entities/medalha-garcom.entity';
import { ItemPedido } from '../pedido/entities/item-pedido.entity';
import { Funcionario } from '../funcionario/entities/funcionario.entity';
import { MedalhaRepository } from './medalha.repository';
import { MedalhaGarcomRepository } from './medalha-garcom.repository';
import { PedidoModule } from '../pedido/pedido.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Medalha, MedalhaGarcom, ItemPedido, Funcionario]),
    PedidoModule, // Importa ItemPedidoRepository
  ],
  controllers: [MedalhaController],
  providers: [MedalhaService, MedalhaScheduler, MedalhaRepository, MedalhaGarcomRepository],
  exports: [MedalhaService, MedalhaRepository, MedalhaGarcomRepository],
})
export class MedalhaModule {}
