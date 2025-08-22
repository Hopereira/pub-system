// backend/src/modulos/produto/produto.module.ts
import { Module } from '@nestjs/common';
import { ProdutoService } from './produto.service';
import { ProdutoController } from './produto.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produto } from './entities/produto.entity';
import { Ambiente } from '../ambiente/entities/ambiente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Produto, Ambiente])],
  controllers: [ProdutoController],
  providers: [ProdutoService],
})
export class ProdutoModule {}