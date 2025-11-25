// Caminho: backend/src/modulos/produto/produto.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProdutoService } from './produto.service';
import { ProdutoController } from './produto.controller';
import { Produto } from './entities/produto.entity';
import { Ambiente } from '../ambiente/entities/ambiente.entity';

// --- IMPORTAÇÃO ADICIONADA ---
import { StorageModule } from 'src/shared/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Produto, Ambiente]),
    StorageModule, // <-- ADICIONE ESTA LINHA
  ],
  controllers: [ProdutoController],
  providers: [ProdutoService],
})
export class ProdutoModule {}
