import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Importe o TypeOrmModule
import { Funcionario } from './entities/funcionario.entity'; // Importe a sua entidade
import { FuncionarioService } from './funcionario.service';
import { FuncionarioController } from './funcionario.controller';

@Module({
  // Adicione esta linha para registrar a entidade Funcionario neste módulo
  imports: [TypeOrmModule.forFeature([Funcionario])],
  controllers: [FuncionarioController],
  providers: [FuncionarioService],
  // Adicione esta linha para que o AuthModule possa usar o FuncionarioService
  exports: [FuncionarioService],
})
export class FuncionarioModule {}