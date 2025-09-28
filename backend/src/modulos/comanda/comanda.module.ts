// backend/src/modulos/comanda/comanda.module.ts
import { Module } from '@nestjs/common';
import { ComandaService } from './comanda.service';
import { ComandaController } from './comanda.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comanda } from './entities/comanda.entity';
import { Mesa } from '../mesa/entities/mesa.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
// ==================================================================
// ## CORREÇÃO (1/2): Importamos o módulo vizinho ##
// ==================================================================
import { PedidoModule } from '../pedido/pedido.module';

@Module({
  // ==================================================================
  // ## CORREÇÃO (2/2): Damos acesso ao nosso módulo para usar as ferramentas do PedidoModule ##
  // ==================================================================
  imports: [TypeOrmModule.forFeature([Comanda, Mesa, Cliente]), PedidoModule],
  controllers: [ComandaController],
  providers: [ComandaService],
})
export class ComandaModule {}