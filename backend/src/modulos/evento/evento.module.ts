// Caminho: backend/src/modulos/evento/evento.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoService } from './evento.service';
import { EventoController } from './evento.controller';
import { Evento } from './entities/evento.entity';
import { EventoRepository } from './evento.repository';
import { StorageModule } from 'src/shared/storage/storage.module';
import { PaginaEventoModule } from '../pagina-evento/pagina-evento.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Evento]),
    StorageModule,
    PaginaEventoModule, // Importa PaginaEventoRepository
  ],
  controllers: [EventoController],
  providers: [EventoService, EventoRepository],
  exports: [EventoService, EventoRepository],
})
export class EventoModule {}
