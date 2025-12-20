import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TurnoController } from './turno.controller';
import { TurnoService } from './turno.service';
import { TurnoGateway } from './turno.gateway';
import { TurnoFuncionario } from './entities/turno-funcionario.entity';
import { Funcionario } from '../funcionario/entities/funcionario.entity';
import { TurnoRepository } from './turno.repository';
import { FuncionarioModule } from '../funcionario/funcionario.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TurnoFuncionario, Funcionario]),
    FuncionarioModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TurnoController],
  providers: [TurnoService, TurnoGateway, TurnoRepository],
  exports: [TurnoService, TurnoRepository],
})
export class TurnoModule {}
