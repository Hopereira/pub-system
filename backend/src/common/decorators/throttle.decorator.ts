import { SetMetadata } from '@nestjs/common';
import { Throttle as NestThrottle } from '@nestjs/throttler';

// Atalhos para casos comuns de rate limiting

/**
 * Rate limit para endpoints de login
 * 5 tentativas a cada 15 minutos
 */
export const ThrottleLogin = () =>
  NestThrottle({ default: { limit: 5, ttl: 900000 } });

/**
 * Rate limit para endpoints públicos
 * 20 requisições por minuto
 */
export const ThrottlePublic = () =>
  NestThrottle({ default: { limit: 20, ttl: 60000 } });

/**
 * Rate limit estrito para operações sensíveis
 * 3 requisições por hora
 */
export const ThrottleStrict = () =>
  NestThrottle({ default: { limit: 3, ttl: 3600000 } });

/**
 * Rate limit para APIs
 * 100 requisições por minuto
 */
export const ThrottleAPI = () =>
  NestThrottle({ default: { limit: 100, ttl: 60000 } });

/**
 * Rate limit para operações de escrita
 * 30 requisições por minuto
 */
export const ThrottleWrite = () =>
  NestThrottle({ default: { limit: 30, ttl: 60000 } });

/**
 * Sem rate limit (bypass)
 * Use com cuidado!
 */
export const NoThrottle = () => SetMetadata('skipThrottle', true);
