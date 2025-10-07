import { Module } from '@nestjs/common';
import { EventoService } from './evento.service';
import { EventoController } from './evento.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Evento } from './entities/evento.entity';

// ✅ NOVO: Importamos o nosso módulo de Storage que criámos
import { StorageModule } from '../../shared/storage/storage.module';

@Module({
  // ✅ ALTERAÇÃO: Adicionamos o StorageModule à lista de imports
  imports: [
    TypeOrmModule.forFeature([Evento]),
    StorageModule, 
  ],
  controllers: [EventoController],
  providers: [EventoService],
})
export class EventoModule {}