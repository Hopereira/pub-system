// backend/src/modulos/comanda/comanda.module.ts
import { Module } from '@nestjs/common';
import { ComandaService } from './comanda.service';
import { ComandaController } from './comanda.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comanda } from './entities/comanda.entity';
import { Mesa } from '../mesa/entities/mesa.entity';
import { Cliente } from '../cliente/entities/cliente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comanda, Mesa, Cliente])],
  controllers: [ComandaController],
  providers: [ComandaService],
})
export class ComandaModule {}