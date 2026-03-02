import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const user = req.user;
    const tenantId = user?.tenantId || req.headers?.['x-tenant-id'] || 'no-tenant';

    // Usuários autenticados: tenant + userId (isolamento por tenant)
    if (user?.sub) {
      return `tenant:${tenantId}:user:${user.sub}`;
    }

    // Não autenticados: tenant + IP (isolamento por tenant)
    return `tenant:${tenantId}:ip:${req.ip}`;
  }
}
