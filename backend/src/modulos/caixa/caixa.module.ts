import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaixaController } from './caixa.controller';
import { CaixaService } from './caixa.service';
import { AberturaCaixa } from './entities/abertura-caixa.entity';
import { FechamentoCaixa } from './entities/fechamento-caixa.entity';
import { Sangria } from './entities/sangria.entity';
import { MovimentacaoCaixa } from './entities/movimentacao-caixa.entity';
import { TurnoFuncionario } from '../turno/entities/turno-funcionario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AberturaCaixa,
      FechamentoCaixa,
      Sangria,
      MovimentacaoCaixa,
      TurnoFuncionario,
    ]),
  ],
  controllers: [CaixaController],
  providers: [CaixaService],
  exports: [CaixaService],
})
export class CaixaModule {}
