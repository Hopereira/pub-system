import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // 1. Precisamos importar isso
import { Empresa } from './entities/empresa.entity'; // 2. E a nossa entidade
import { EmpresaService } from './empresa.service';
import { EmpresaController } from './empresa.controller';

@Module({
  // 3. ESTA LINHA É A MÁGICA QUE FALTAVA
  imports: [TypeOrmModule.forFeature([Empresa])],
  controllers: [EmpresaController],
  providers: [EmpresaService],
})
export class EmpresaModule {}