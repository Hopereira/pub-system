// backend/src/modulos/pagina-evento/pagina-evento.module.ts

import { Module } from '@nestjs/common';
import { PaginaEventoService } from './pagina-evento.service';
import { PaginaEventoController } from './pagina-evento.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaginaEvento } from './entities/pagina-evento.entity';
import { StorageModule } from 'src/shared/storage/storage.module';
import { PaginaEventoRepository } from './pagina-evento.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaginaEvento]),
    StorageModule,
  ],
  controllers: [PaginaEventoController],
  providers: [PaginaEventoService, PaginaEventoRepository],
  exports: [PaginaEventoService, PaginaEventoRepository],
})
export class PaginaEventoModule {}
