// backend/src/modulos/mesa/mesa.module.ts
import { Module } from '@nestjs/common';
import { MesaService } from './mesa.service';
import { MesaController } from './mesa.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mesa } from './entities/mesa.entity';
import { AmbienteModule } from '../ambiente/ambiente.module';
import { MesaRepository } from './mesa.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Mesa]), AmbienteModule],
  controllers: [MesaController],
  providers: [MesaService, MesaRepository],
  exports: [MesaService, MesaRepository],
})
export class MesaModule {}
