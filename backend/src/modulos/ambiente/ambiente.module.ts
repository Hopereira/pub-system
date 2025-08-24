import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // 1. Importar o TypeOrmModule
import { Ambiente } from './entities/ambiente.entity'; // 2. Importar a Entidade
import { AmbienteService } from './ambiente.service';
import { AmbienteController } from './ambiente.controller';

@Module({
  // 3. Adicionar esta linha para registrar a entidade e seu repositório
  imports: [TypeOrmModule.forFeature([Ambiente])],
  controllers: [AmbienteController],
  providers: [AmbienteService],
  exports: [TypeOrmModule],
})
export class AmbienteModule {}