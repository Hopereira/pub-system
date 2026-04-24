import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * RequestIdMiddleware — Gera ou propaga X-Request-Id em cada requisição.
 *
 * - Aceita X-Request-Id do cliente (para rastreabilidade cross-service)
 * - Gera UUID v4 se não enviado
 * - Retorna X-Request-Id na response
 * - Disponibiliza req.requestId para logs, Sentry e error responses
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId =
      (req.headers['x-request-id'] as string) || randomUUID();

    // Disponibilizar no request para uso downstream
    (req as any).requestId = requestId;

    // Retornar na response
    res.setHeader('X-Request-Id', requestId);

    next();
  }
}
