# Rate Limiting

## Configuracao Global

O rate limiting e aplicado globalmente via `ThrottlerModule` do NestJS, configurado em `app.module.ts`.

### Camadas

| Camada | Janela | Limite | Finalidade |
|--------|--------|--------|------------|
| short | 1 segundo | 3 req | Protecao contra burst |
| medium | 10 segundos | 20 req | Protecao contra abuso moderado |
| long | 1 minuto | 100 req | Limite geral por minuto |

### Guard

O `CustomThrottlerGuard` (`common/guards/custom-throttler.guard.ts`) e registrado como `APP_GUARD` global. Todas as requisicoes passam por ele.

### Monitoramento

O `RateLimitMonitorService` (`common/monitoring/rate-limit-monitor.service.ts`) registra eventos de rate limit para analise.

## Rate Limit por Tenant

O `CustomThrottlerGuard` inclui `tenantId` em todas as chaves de tracking:

- Autenticados: `tenant:{tenantId}:user:{userId}`
- Nao autenticados: `tenant:{tenantId}:ip:{ip}`

Admins **NAO** tem isencao de rate-limit. Todos os cargos sao limitados igualmente.

O `TenantRateLimitGuard` aplica limites adicionais baseados no plano do tenant (basic, pro, enterprise).

## Endpoints Sensiveis

Endpoints de autenticacao (`/auth/login`, `/auth/register`) possuem limites mais restritivos configurados via decorators `@Throttle()` especificos.

## Headers de Resposta

Cada resposta inclui headers indicando o estado do rate limit:

- `X-RateLimit-Limit`: limite total
- `X-RateLimit-Remaining`: requisicoes restantes
- `Retry-After`: segundos ate liberar (quando bloqueado)
