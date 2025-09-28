// backend/src/modulos/pagina-evento/pagina-evento.module.ts

import { Module } from '@nestjs/common';
import { PaginaEventoService } from './pagina-evento.service';
import { PaginaEventoController } from './pagina-evento.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaginaEvento } from './entities/pagina-evento.entity';
import { StorageModule } from 'src/shared/storage/storage.module'; // <-- 1. IMPORTE O MÓDULO

@Module({
  imports: [
    TypeOrmModule.forFeature([PaginaEvento]),
    StorageModule, // <-- 2. ADICIONE-O À LISTA DE IMPORTS
  ],
  controllers: [PaginaEventoController],
  providers: [PaginaEventoService],
})
export class PaginaEventoModule {}