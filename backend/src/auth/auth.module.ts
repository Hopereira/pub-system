import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FuncionarioModule } from 'src/modulos/funcionario/funcionario.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller'; // CORRIGIDO
import { JwtStrategy } from './strategies/jwt.strategy'; // CORRIGIDO

@Module({
  imports: [
    FuncionarioModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '4h' }, // Token expira em 4 horas
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
