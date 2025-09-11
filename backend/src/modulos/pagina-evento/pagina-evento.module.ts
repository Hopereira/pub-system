// Caminho: backend/src/modulos/pagina-evento/pagina-evento.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaginaEvento } from './entities/pagina-evento.entity';
import { PaginaEventoService } from './pagina-evento.service';
import { PaginaEventoController } from './pagina-evento.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PaginaEvento])], // Importa a entidade para o módulo
  controllers: [PaginaEventoController], // Declara o controller
  providers: [PaginaEventoService], // Declara o serviço
})
export class PaginaEventoModule {}