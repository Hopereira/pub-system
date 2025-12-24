import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvaliacaoService } from './avaliacao.service';
import { AvaliacaoController } from './avaliacao.controller';
import { Avaliacao } from './entities/avaliacao.entity';
import { Comanda } from '../comanda/entities/comanda.entity';
import { AvaliacaoRepository } from './avaliacao.repository';
import { ComandaModule } from '../comanda/comanda.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Avaliacao, Comanda]),
    ComandaModule,
  ],
  controllers: [AvaliacaoController],
  providers: [AvaliacaoService, AvaliacaoRepository],
  exports: [AvaliacaoService, AvaliacaoRepository],
})
export class AvaliacaoModule {}
