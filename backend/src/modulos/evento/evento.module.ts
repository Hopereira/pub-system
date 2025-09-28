import { Module } from '@nestjs/common';
import { EventoService } from './evento.service';
import { EventoController } from './evento.controller';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- 1. IMPORTAR O TYPEORMMODULE
import { Evento } from './entities/evento.entity'; // <-- 2. IMPORTAR A NOSSA ENTIDADE

@Module({
  imports: [TypeOrmModule.forFeature([Evento])], // <-- 3. ADICIONAR O MÓDULO À LISTA DE IMPORTS
  controllers: [EventoController],
  providers: [EventoService],
})
export class EventoModule {}