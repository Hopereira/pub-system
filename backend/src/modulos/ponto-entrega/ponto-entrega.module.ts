// Caminho: backend/src/modulos/ponto-entrega/ponto-entrega.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PontoEntregaService } from './ponto-entrega.service';
import { PontoEntregaController } from './ponto-entrega.controller';
import { PontoEntrega } from './entities/ponto-entrega.entity';
import { PontoEntregaRepository } from './ponto-entrega.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PontoEntrega])],
  controllers: [PontoEntregaController],
  providers: [PontoEntregaService, PontoEntregaRepository],
  exports: [PontoEntregaService, PontoEntregaRepository],
})
export class PontoEntregaModule {}
