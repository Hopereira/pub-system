// Caminho: backend/src/modulos/evento/evento.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoService } from './evento.service';
import { EventoController } from './evento.controller';
import { Evento } from './entities/evento.entity';
import { PaginaEvento } from '../pagina-evento/entities/pagina-evento.entity';
import { EventoRepository } from './evento.repository';
import { PaginaEventoModule } from '../pagina-evento/pagina-evento.module';
import { StorageModule } from 'src/shared/storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Evento, PaginaEvento]),
    PaginaEventoModule,
    StorageModule,
  ],
  controllers: [EventoController],
  providers: [EventoService, EventoRepository],
  exports: [EventoService, EventoRepository],
})
export class EventoModule {}
