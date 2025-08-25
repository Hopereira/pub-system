import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Importando os módulos de funcionalidades
import { EmpresaModule } from './modulos/empresa/empresa.module';
import { AmbienteModule } from './modulos/ambiente/ambiente.module';
import { FuncionarioModule } from './modulos/funcionario/funcionario.module';
import { AuthModule } from './auth/auth.module';
import { MesaModule } from './modulos/mesa/mesa.module';
import { ComandaModule } from './modulos/comanda/comanda.module';
import { ClienteModule } from './modulos/cliente/cliente.module';
import { PedidoModule } from './modulos/pedido/pedido.module';
import { ProdutoModule } from './modulos/produto/produto.module'; // <-- 1. ADICIONE A IMPORTAÇÃO AQUI

@Module({
  imports: [
    // 1. Módulo de Configuração: Lê as variáveis do arquivo .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. Conexão com o Banco de Dados: Usa as variáveis para conectar ao PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true, // Ótimo para desenvolvimento, cria tabelas automaticamente.
      }),
    }),

    // 3. Módulos de Funcionalidades (Features): Registra todos os nossos módulos
    EmpresaModule,
    AmbienteModule,
    FuncionarioModule,
    AuthModule,
    MesaModule,
    ComandaModule,
    ClienteModule,
    PedidoModule,
    ProdutoModule, // <-- 2. ADICIONE O MÓDULO NA LISTA AQUI
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}