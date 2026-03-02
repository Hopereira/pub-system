import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'), // Usamos getOrThrow para garantir que a variável exista
    });
  }

  async validate(payload: any) {
    if (!payload.tenantId) {
      throw new UnauthorizedException('Token inválido: tenantId ausente');
    }
    return {
      id: payload.sub,
      email: payload.email,
      cargo: payload.cargo,
      nome: payload.nome,
      tenantId: payload.tenantId,
      ambienteId: payload.ambienteId,
    };
  }
}
