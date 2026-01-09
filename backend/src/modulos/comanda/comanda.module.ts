// Caminho: backend/src/modulos/comanda/comanda.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { ComandaService } from './comanda.service';
import { ComandaController } from './comanda.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comanda } from './entities/comanda.entity';
import { ComandaAgregado } from './entities/comanda-agregado.entity';

// Módulos com repositórios tenant-aware
import { PedidoModule } from '../pedido/pedido.module';
import { CaixaModule } from '../caixa/caixa.module';
import { MesaModule } from '../mesa/mesa.module';
import { ClienteModule } from '../cliente/cliente.module';
import { EventoModule } from '../evento/evento.module';
import { PaginaEventoModule } from '../pagina-evento/pagina-evento.module';
import { PontoEntregaModule } from '../ponto-entrega/ponto-entrega.module';

// Repositórios locais
import { ComandaRepository } from './comanda.repository';
import { ComandaAgregadoRepository } from './comanda-agregado.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comanda, ComandaAgregado]),
    forwardRef(() => PedidoModule),
    forwardRef(() => MesaModule),
    forwardRef(() => ClienteModule),
    forwardRef(() => EventoModule),
    forwardRef(() => PaginaEventoModule),
    forwardRef(() => PontoEntregaModule),
    CaixaModule,
  ],
  controllers: [ComandaController],
  providers: [ComandaService, ComandaRepository, ComandaAgregadoRepository],
  exports: [ComandaService, ComandaRepository, ComandaAgregadoRepository],
})
export class ComandaModule {}
