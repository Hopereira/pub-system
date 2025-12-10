import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnoController } from './turno.controller';
import { TurnoService } from './turno.service';
import { TurnoGateway } from './turno.gateway';
import { TurnoFuncionario } from './entities/turno-funcionario.entity';
import { Funcionario } from '../funcionario/entities/funcionario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TurnoFuncionario, Funcionario])],
  controllers: [TurnoController],
  providers: [TurnoService, TurnoGateway],
  exports: [TurnoService],
})
export class TurnoModule {}
