// Caminho: backend/src/modulos/evento/evento.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoService } from './evento.service';
import { EventoController } from './evento.controller';
import { Evento } from './entities/evento.entity';
import { PaginaEvento } from '../pagina-evento/entities/pagina-evento.entity';
// ✅ 1. Importar o seu módulo a partir do caminho correto
import { StorageModule } from 'src/shared/storage/storage.module';

@Module({
  // ✅ 2. Adicionar o StorageModule às importações
  imports: [TypeOrmModule.forFeature([Evento, PaginaEvento]), StorageModule],
  controllers: [EventoController],
  providers: [EventoService],
})
export class EventoModule {}