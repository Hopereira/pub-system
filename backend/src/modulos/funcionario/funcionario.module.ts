import { Module } from '@nestjs/common';
import { FuncionarioService } from './funcionario.service';
import { FuncionarioController } from './funcionario.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Funcionario } from './entities/funcionario.entity';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from 'src/shared/storage/storage.module';
import { FuncionarioRepository } from './funcionario.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Funcionario]), ConfigModule, StorageModule],
  controllers: [FuncionarioController],
  providers: [FuncionarioService, FuncionarioRepository],
  exports: [FuncionarioService, FuncionarioRepository],
})
export class FuncionarioModule {}
