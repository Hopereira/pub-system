import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Extrai JWT do cookie httpOnly 'access_token' com fallback para Bearer header.
 * Prioridade: Cookie > Bearer (cookie é mais seguro, Bearer mantém compatibilidade).
 */
function extractJwtFromCookieOrBearer(req: Request): string | null {
  // 1. Tentar cookie httpOnly (mais seguro — imune a XSS)
  const cookieToken = req?.cookies?.['access_token'];
  if (cookieToken) {
    return cookieToken;
  }

  // 2. Fallback: Bearer header (para Swagger, mobile, WebSocket handshake, etc.)
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: extractJwtFromCookieOrBearer,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // SUPER_ADMIN não pertence a nenhum tenant (tenantId pode ser null)
    if (!payload.tenantId && payload.cargo !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Token inválido: tenantId ausente');
    }
    return {
      id: payload.sub,
      email: payload.email,
      cargo: payload.cargo,
      nome: payload.nome,
      tenantId: payload.tenantId || null,
      ambienteId: payload.ambienteId,
    };
  }
}
