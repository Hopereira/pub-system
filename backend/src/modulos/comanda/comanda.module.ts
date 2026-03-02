// Caminho: backend/src/modulos/comanda/comanda.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ComandaService } from './comanda.service';
import { ComandaController } from './comanda.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comanda } from './entities/comanda.entity';
import { Mesa } from '../mesa/entities/mesa.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
import { PedidoModule } from '../pedido/pedido.module';
import { PaginaEvento } from '../pagina-evento/entities/pagina-evento.entity';
import { Evento } from '../evento/entities/evento.entity';
import { Pedido } from '../pedido/entities/pedido.entity';
import { ItemPedido } from '../pedido/entities/item-pedido.entity';
import { PontoEntrega } from '../ponto-entrega/entities/ponto-entrega.entity';
import { ComandaAgregado } from './entities/comanda-agregado.entity';
import { CaixaModule } from '../caixa/caixa.module';

// Repositórios tenant-aware
import { ComandaRepository } from './comanda.repository';
import { ComandaAgregadoRepository } from './comanda-agregado.repository';
import { MesaRepository } from '../mesa/mesa.repository';
import { ClienteRepository } from '../cliente/cliente.repository';
import { PaginaEventoModule } from '../pagina-evento/pagina-evento.module';
import { EventoModule } from '../evento/evento.module';
import { PontoEntregaModule } from '../ponto-entrega/ponto-entrega.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Comanda,
      Mesa,
      Cliente,
      PaginaEvento,
      Evento,
      Pedido,
      ItemPedido,
      PontoEntrega,
      ComandaAgregado,
    ]),
    forwardRef(() => PedidoModule),
    forwardRef(() => EventoModule),
    PaginaEventoModule,
    PontoEntregaModule,
    CaixaModule,
  ],
  controllers: [ComandaController],
  providers: [
    ComandaService,
    ComandaRepository,
    ComandaAgregadoRepository,
    MesaRepository,
    ClienteRepository,
  ],
  exports: [ComandaService, ComandaRepository, ComandaAgregadoRepository],
})
export class ComandaModule {}
