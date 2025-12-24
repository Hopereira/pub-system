// backend/src/modulos/cliente/cliente.module.ts
import { Module } from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { ClienteController } from './cliente.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { ClienteRepository } from './cliente.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente])],
  controllers: [ClienteController],
  providers: [ClienteService, ClienteRepository],
  exports: [ClienteService, ClienteRepository],
})
export class ClienteModule {}
