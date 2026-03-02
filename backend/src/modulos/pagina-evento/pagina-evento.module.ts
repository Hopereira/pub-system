// backend/src/modulos/pagina-evento/pagina-evento.module.ts

import { Module } from '@nestjs/common';
import { PaginaEventoService } from './pagina-evento.service';
import { PaginaEventoController } from './pagina-evento.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaginaEvento } from './entities/pagina-evento.entity';
import { PaginaEventoRepository } from './pagina-evento.repository';
import { StorageModule } from 'src/shared/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaginaEvento]),
    StorageModule,
  ],
  controllers: [PaginaEventoController],
  providers: [PaginaEventoService, PaginaEventoRepository],
  exports: [PaginaEventoRepository],
})
export class PaginaEventoModule {}
