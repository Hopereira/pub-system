import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    protected readonly options: any,
    protected readonly storageService: any,
    protected readonly reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Admin não tem limite
    if (user?.cargo === 'ADMIN') {
      return true;
    }

    // Usuários autenticados têm limite 2x maior
    if (user) {
      limit = limit * 2;
    }

    // Usar IP + user ID como chave
    const key = this.generateKey(context, request.ip, user?.sub);

    const { totalHits } = await this.storageService.increment(key, ttl);

    if (totalHits > limit) {
      const waitTime = Math.ceil(ttl / 1000);
      throw new ThrottlerException(
        `Muitas requisições. Tente novamente em ${waitTime} segundos.`,
      );
    }

    return true;
  }

  protected generateKey(
    context: ExecutionContext,
    ip: string,
    userId?: string,
  ): string {
    const request = context.switchToHttp().getRequest();
    const route = request.route?.path || request.url;

    return userId
      ? `throttle:user:${userId}:${route}`
      : `throttle:ip:${ip}:${route}`;
  }
}
