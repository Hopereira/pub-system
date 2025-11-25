import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true; // Se for pública, permite o acesso
    }
    return super.canActivate(context); // Senão, continua com a validação JWT
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (err || !user) {
      const endpoint = `${request.method} ${request.url}`;
      const ip = request.ip || request.connection.remoteAddress;

      this.logger.warn(
        `🚫 Acesso negado: ${endpoint} | IP: ${ip} | Motivo: ${info?.message || 'Token inválido'}`,
      );
      throw err || new UnauthorizedException('Token JWT inválido ou expirado');
    }

    return user;
  }
}
