// backend/src/modulos/produto/produto.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produto } from './entities/produto.entity';
import { AmbienteModule } from '../ambiente/ambiente.module'; // Importamos o MÓDULO
import { ProdutoController } from './produto.controller';
import { ProdutoService } from './produto.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produto]), // Este módulo registra apenas a entidade Produto
    AmbienteModule, // Importamos o módulo inteiro para usar seus serviços
  ],
  controllers: [ProdutoController],
  providers: [ProdutoService],
})
export class ProdutoModule {}