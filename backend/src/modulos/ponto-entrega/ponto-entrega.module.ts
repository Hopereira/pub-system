// Caminho: backend/src/modulos/ponto-entrega/ponto-entrega.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PontoEntregaService } from './ponto-entrega.service';
import { PontoEntregaController } from './ponto-entrega.controller';
import { PontoEntrega } from './entities/ponto-entrega.entity';
import { Empresa } from '../empresa/entities/empresa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PontoEntrega, Empresa])],
  controllers: [PontoEntregaController],
  providers: [PontoEntregaService],
  exports: [PontoEntregaService],
})
export class PontoEntregaModule {}
