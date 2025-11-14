// Caminho: backend/src/database/seeder.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeederService } from './seeder.service';
import { Ambiente } from '../modulos/ambiente/entities/ambiente.entity';
import { Mesa } from '../modulos/mesa/entities/mesa.entity';
import { Produto } from '../modulos/produto/entities/produto.entity';
import { Cliente } from '../modulos/cliente/entities/cliente.entity';
import { Comanda } from '../modulos/comanda/entities/comanda.entity';
import { Empresa } from '../modulos/empresa/entities/empresa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ambiente, Mesa, Produto, Cliente, Comanda, Empresa])],
  providers: [SeederService],
  exports: [SeederService],
})
export class SeederModule {}