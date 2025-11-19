// Caminho: backend/src/modulos/comanda/comanda.module.ts
import { Module } from '@nestjs/common';
import { ComandaService } from './comanda.service';
import { ComandaController } from './comanda.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comanda } from './entities/comanda.entity';
import { Mesa } from '../mesa/entities/mesa.entity';
import { Cliente } from '../cliente/entities/cliente.entity';
import { PedidoModule } from '../pedido/pedido.module';
import { PaginaEvento } from '../pagina-evento/entities/pagina-evento.entity';

// ✅ 1. Importar as entidades necessárias para a nova lógica de entrada do evento
import { Evento } from '../evento/entities/evento.entity';
import { Pedido } from '../pedido/entities/pedido.entity';
import { ItemPedido } from '../pedido/entities/item-pedido.entity';
import { PontoEntrega } from '../ponto-entrega/entities/ponto-entrega.entity';
import { ComandaAgregado } from './entities/comanda-agregado.entity';

// ✅ 2. Importar CaixaModule para integração com sistema de pagamentos
import { CaixaModule } from '../caixa/caixa.module';

@Module({
  imports: [
    // ✅ 3. Adicionar TODAS as entidades que o ComandaService agora utiliza
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
    PedidoModule, // Mantemos a importação do PedidoModule para acesso ao Gateway
    CaixaModule, // ✅ Módulo de caixa para registrar vendas
  ],
  controllers: [ComandaController],
  providers: [ComandaService],
})
export class ComandaModule {}