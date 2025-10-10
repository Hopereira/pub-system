// Caminho: backend/src/modulos/comanda/comanda.module.ts
import { Module } from '@nestjs/common';
import { ComandaService } from './comanda.service';
import { ComandaController } from './comanda.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comanda } from './entities/comanda.entity';
import { Mesa } from '../mesa/entities/mesa.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
import { PedidoModule } from '../pedido/pedido.module';

// ✅ 1. IMPORTAR a entidade que faltava
import { PaginaEvento } from '../pagina-evento/entities/pagina-evento.entity';

@Module({
  imports: [
    // ✅ 2. ADICIONAR a PaginaEvento aqui.
    // Isto permite que o ComandaService use o repositório de PaginaEvento.
    TypeOrmModule.forFeature([Comanda, Mesa, Cliente, PaginaEvento]), 
    PedidoModule
  ],
  controllers: [ComandaController],
  providers: [ComandaService],
})
export class ComandaModule {}