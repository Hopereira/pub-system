import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PedidoService } from './pedido.service';
import { PedidoController } from './pedido.controller';
import { PedidoAnalyticsService } from './pedido-analytics.service';
import { PedidoAnalyticsController } from './pedido-analytics.controller';
import { Pedido } from './entities/pedido.entity';
import { ItemPedido } from './entities/item-pedido.entity';
import { RetiradaItem } from './entities/retirada-item.entity';
import { Comanda } from '../comanda/entities/comanda.entity';
import { Produto } from '../produto/entities/produto.entity';
import { Ambiente } from '../ambiente/entities/ambiente.entity';
import { Funcionario } from '../funcionario/entities/funcionario.entity';
import { TurnoFuncionario } from '../turno/entities/turno-funcionario.entity';
import { PedidosGateway } from './pedidos.gateway';
import { QuaseProntoScheduler } from './quase-pronto.scheduler';
import { PedidoRepository } from './pedido.repository';
import { ProdutoModule } from '../produto/produto.module';
import { AmbienteModule } from '../ambiente/ambiente.module';
import { FuncionarioModule } from '../funcionario/funcionario.module';
import { ComandaModule } from '../comanda/comanda.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pedido,
      ItemPedido,
      RetiradaItem,
      Comanda,
      Produto,
      Ambiente,
      Funcionario,
      TurnoFuncionario,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    ProdutoModule,
    AmbienteModule,
    FuncionarioModule,
    forwardRef(() => ComandaModule),
  ],
  controllers: [PedidoController, PedidoAnalyticsController],
  providers: [
    PedidoService,
    PedidoAnalyticsService,
    PedidosGateway,
    QuaseProntoScheduler,
    PedidoRepository,
  ],
  exports: [PedidoService, PedidoAnalyticsService, PedidosGateway, PedidoRepository],
})
export class PedidoModule {}
