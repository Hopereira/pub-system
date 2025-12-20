import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FuncionarioModule } from 'src/modulos/funcionario/funcionario.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CreateSuperAdminController } from './create-super-admin.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenService } from './refresh-token.service';
import { RefreshTokenCleanupService } from './refresh-token-cleanup.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { Funcionario } from '../modulos/funcionario/entities/funcionario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken, Funcionario]),
    FuncionarioModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [AuthService, RefreshTokenService, RefreshTokenCleanupService, JwtStrategy],
  controllers: [AuthController, CreateSuperAdminController],
  exports: [AuthService, RefreshTokenService],
})
export class AuthModule {}
