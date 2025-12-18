import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const user = req.user;
    
    // Admin não tem limite - retorna chave única que nunca será bloqueada
    if (user?.cargo === 'ADMIN') {
      return `admin:${user.sub}:${Date.now()}`;
    }

    // Usuários autenticados usam user ID
    if (user?.sub) {
      return `user:${user.sub}`;
    }

    // Não autenticados usam IP
    return req.ip;
  }

  protected async getThrottlerLimit(context: ExecutionContext): Promise<number> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    const limit = await super.getThrottlerLimit(context);
    
    // Usuários autenticados têm limite 2x maior
    if (user && user.cargo !== 'ADMIN') {
      return limit * 2;
    }
    
    return limit;
  }
}
