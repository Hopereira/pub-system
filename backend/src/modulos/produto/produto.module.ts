// Caminho: backend/src/modulos/produto/produto.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProdutoService } from './produto.service';
import { ProdutoController } from './produto.controller';
import { Produto } from './entities/produto.entity';
import { Ambiente } from '../ambiente/entities/ambiente.entity';
// ALTERAÇÃO: Importar o nosso StorageModule
import { StorageModule } from '../../shared/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produto, Ambiente]),
    // ALTERAÇÃO: Adicionar o StorageModule aqui
    StorageModule, 
  ],
  controllers: [ProdutoController],
  providers: [ProdutoService],
})
export class ProdutoModule {}