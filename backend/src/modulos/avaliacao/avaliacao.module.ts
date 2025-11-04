import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvaliacaoService } from './avaliacao.service';
import { AvaliacaoController } from './avaliacao.controller';
import { Avaliacao } from './entities/avaliacao.entity';
import { Comanda } from '../comanda/entities/comanda.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Avaliacao, Comanda])],
  controllers: [AvaliacaoController],
  providers: [AvaliacaoService],
  exports: [AvaliacaoService],
})
export class AvaliacaoModule {}
