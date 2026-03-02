# Plano de Deploy: Isolamento Multi-Tenant Enterprise

## Resumo da Refatoracao

Transformacao do sistema de isolamento multi-tenant **fraco** (nullable tenant_id, fallbacks globais) para isolamento **forte** (NOT NULL, FK, zero fallbacks).

---

## Arquivos Modificados

### Infraestrutura / Migration
| Arquivo | Mudanca |
|---------|---------|
| `backend/src/migrations/1709380000000-EnforceMultiTenantIsolation.ts` | **NOVO** - Migration: NOT NULL, FK, indices compostos |

### Autenticacao (Login + JWT)
| Arquivo | Mudanca |
|---------|---------|
| `backend/src/auth/auth.service.ts` | Reescrito: tenant resolvido via subdomain ANTES do login, busca por email+tenantId, JWT sem empresaId |
| `backend/src/auth/auth.controller.ts` | Login resolve tenant via host/header antes de autenticar |
| `backend/src/modulos/funcionario/funcionario.repository.ts` | `findByEmailForAuth` -> `findByEmailAndTenantForAuth` (email + tenant_id) |
| `backend/src/modulos/funcionario/funcionario.service.ts` | `findByEmail` -> `findByEmailAndTenant`, seeder exige DEFAULT_TENANT_ID |

### Guards e Interceptors
| Arquivo | Mudanca |
|---------|---------|
| `backend/src/common/tenant/guards/tenant.guard.ts` | Bloqueia user sem tenantId (403), remove fallback empresaId |
| `backend/src/common/tenant/tenant.interceptor.ts` | Remove fallback empresaId em todas as fontes de resolucao |

### Novos Repositories (Tenant-Aware)
| Arquivo | Mudanca |
|---------|---------|
| `backend/src/modulos/pagina-evento/pagina-evento.repository.ts` | **NOVO** |
| `backend/src/modulos/medalha/medalha.repository.ts` | **NOVO** |
| `backend/src/modulos/medalha/medalha-garcom.repository.ts` | **NOVO** |
| `backend/src/modulos/audit/audit.repository.ts` | **NOVO** |
| `backend/src/modulos/empresa/empresa.repository.ts` | **NOVO** |
| `backend/src/modulos/comanda/comanda-agregado.repository.ts` | **NOVO** |

### Services Refatorados (10 vulneraveis -> 0)
| Arquivo | Mudanca |
|---------|---------|
| `backend/src/modulos/evento/evento.service.ts` | `@InjectRepository` -> `EventoRepository` + `PaginaEventoRepository` |
| `backend/src/modulos/pagina-evento/pagina-evento.service.ts` | `@InjectRepository` -> `PaginaEventoRepository` |
| `backend/src/modulos/medalha/medalha.service.ts` | `@InjectRepository` -> `MedalhaRepository` + `MedalhaGarcomRepository` + `ItemPedidoRepository` |
| `backend/src/modulos/audit/audit.service.ts` | `@InjectRepository` -> `AuditLogRepository` |
| `backend/src/modulos/avaliacao/avaliacao.service.ts` | `@InjectRepository` -> `AvaliacaoRepository` |
| `backend/src/modulos/empresa/empresa.service.ts` | `@InjectRepository` -> `EmpresaRepository`, remove whereClause fallback |
| `backend/src/modulos/pedido/pedido-analytics.service.ts` | `@InjectRepository` -> `PedidoRepository` + `ItemPedidoRepository` |
| `backend/src/modulos/analytics/analytics.service.ts` | `@InjectRepository` -> `ItemPedidoRepository` |
| `backend/src/modulos/comanda/comanda.service.ts` | 5x `@InjectRepository` -> repos tenant-aware |
| `backend/src/modulos/mesa/mesa.service.ts` | `manager.find(PontoEntrega)` -> `PontoEntregaRepository` |

### Cache (5 services corrigidos)
| Arquivo | Mudanca |
|---------|---------|
| `backend/src/cache/cache-invalidation.service.ts` | `generateCacheKey` retorna null sem tenant, invalidacao sem fallback global |
| `backend/src/modulos/produto/produto.service.ts` | `getCacheKey` retorna null sem tenant, remove `findWithoutTenant`, fix invalidacao |
| `backend/src/modulos/pedido/pedido.service.ts` | `getCacheKey` retorna null sem tenant |
| `backend/src/modulos/comanda/comanda.service.ts` | `getCacheKey` retorna null sem tenant |
| `backend/src/modulos/ambiente/ambiente.service.ts` | `getCacheKey` retorna null sem tenant |
| `backend/src/modulos/mesa/mesa.service.ts` | `getCacheKey` retorna null sem tenant |

### Rate-Limit
| Arquivo | Mudanca |
|---------|---------|
| `backend/src/common/guards/custom-throttler.guard.ts` | Tracker inclui tenantId, remove isencao de ADMIN |

### Testes
| Arquivo | Mudanca |
|---------|---------|
| `backend/src/common/tenant/tests/tenant-isolation.e2e-spec.ts` | 15 testes reais cobrindo todas as camadas |

---

## Plano de Deploy Seguro

### Pre-Deploy (OBRIGATORIO)

```bash
# 1. Backup COMPLETO do banco de dados
pg_dump -h pub-postgres -U pubuser pubsystem > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# 2. Verificar registros orfaos (sem tenant_id)
psql -h pub-postgres -U pubuser pubsystem -c "
  SELECT 'funcionarios' as tabela, COUNT(*) as orfaos FROM funcionarios WHERE tenant_id IS NULL
  UNION ALL
  SELECT 'pedidos', COUNT(*) FROM pedidos WHERE tenant_id IS NULL
  UNION ALL
  SELECT 'comandas', COUNT(*) FROM comandas WHERE tenant_id IS NULL
  UNION ALL
  SELECT 'produtos', COUNT(*) FROM produtos WHERE tenant_id IS NULL
  UNION ALL
  SELECT 'mesas', COUNT(*) FROM mesas WHERE tenant_id IS NULL
  UNION ALL
  SELECT 'ambientes', COUNT(*) FROM ambientes WHERE tenant_id IS NULL;
"

# 3. Se houver orfaos, popular tenant_id ANTES de rodar a migration
# A migration deleta registros sem tenant_id!

# 4. Definir DEFAULT_TENANT_ID no .env
echo "DEFAULT_TENANT_ID=<uuid-do-tenant-principal>" >> .env

# 5. Rodar testes de isolamento
cd backend && npx jest --testPathPattern=tenant-isolation --verbose
```

### Deploy

```bash
# 1. Parar o backend (manutencao programada)
docker stop pub-backend

# 2. Build da nova imagem
docker build -t pub-backend:latest ./backend

# 3. Rodar migration
docker run --rm --network pub-system_default \
  --env-file .env \
  pub-backend:latest \
  npx typeorm migration:run -d src/data-source.ts

# 4. Iniciar backend
docker start pub-backend

# 5. Verificar health
curl -s https://api.pubsystem.com.br/health | jq .
```

### Post-Deploy (VALIDACAO)

```bash
# 1. Verificar constraints no banco
psql -h pub-postgres -U pubuser pubsystem -c "
  SELECT table_name, column_name, is_nullable
  FROM information_schema.columns
  WHERE column_name = 'tenant_id'
  ORDER BY table_name;
"
# Todas devem mostrar is_nullable = 'NO'

# 2. Verificar FKs
psql -h pub-postgres -U pubuser pubsystem -c "
  SELECT constraint_name, table_name
  FROM information_schema.table_constraints
  WHERE constraint_name LIKE 'fk_%_tenant'
  ORDER BY table_name;
"

# 3. Testar login (deve exigir subdomain)
curl -X POST https://api.pubsystem.com.br/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@bar.com","senha":"123456"}'
# Deve retornar 401: "Nao foi possivel identificar o estabelecimento"

# 4. Testar login COM subdomain
curl -X POST https://api.pubsystem.com.br/auth/login \
  -H 'Content-Type: application/json' \
  -H 'Host: bar-do-ze.pubsystem.com.br' \
  -d '{"email":"admin@bar.com","senha":"123456"}'
# Deve retornar 200 com tenant_id no response

# 5. Testar cross-tenant (deve falhar com 403)
TOKEN_A=$(curl -s -X POST ... | jq -r .access_token)
curl -X GET https://api.pubsystem.com.br/produtos \
  -H "Authorization: Bearer $TOKEN_A" \
  -H 'Host: outro-bar.pubsystem.com.br'
# Deve retornar 403 Forbidden
```

---

## Checklist de Validacao Pos-Migracao

### Banco de Dados
- [ ] tenant_id NOT NULL em todas as 25 tabelas operacionais
- [ ] FK fk_{table}_tenant para todas as tabelas
- [ ] Indices compostos (tenant_id, id) criados
- [ ] Indices de negocio (tenant_id, status) etc criados
- [ ] Zero registros com tenant_id NULL

### Autenticacao
- [ ] Login SEM subdomain/header retorna 401
- [ ] Login COM subdomain correto funciona
- [ ] JWT contem tenantId (sem empresaId)
- [ ] Refresh token vinculado ao tenant

### Guards
- [ ] User sem tenantId no JWT -> 403
- [ ] User com tenantId diferente do contexto -> 403
- [ ] User com tenantId igual ao contexto -> 200

### Queries
- [ ] ZERO services usando @InjectRepository direto
- [ ] ZERO queries sem filtro tenant_id
- [ ] ZERO uso de findWithoutTenant
- [ ] ZERO uso de manager.find()
- [ ] createQueryBuilder inclui .andWhere tenant_id (via BaseTenantRepository)

### Cache
- [ ] ZERO chaves com namespace :global:
- [ ] Sem tenant = nao cachear (retorna null)
- [ ] Invalidacao usa CacheInvalidationService (nao chaves hardcoded)
- [ ] Cache keys formato: {entidade}:{tenantId}:{params}

### Rate-Limit
- [ ] CustomThrottlerGuard keys incluem tenantId
- [ ] TenantRateLimitGuard keys incluem tenantId
- [ ] Admin NAO tem isencao total
- [ ] Keys formato: tenant:{tenantId}:user:{userId} ou tenant:{tenantId}:ip:{ip}

### Seeder
- [ ] Admin so criado se DEFAULT_TENANT_ID definido
- [ ] Admin criado com tenantId preenchido

### Testes
- [ ] 15 testes de isolamento passando
- [ ] Cross-tenant bloqueado em TODOS os cenarios
- [ ] empresaId NAO funciona como fallback

---

## Riscos e Mitigacao

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Registros orfaos deletados pela migration | Perda de dados | Backup pre-deploy + script de populacao manual |
| Frontend envia empresaId no lugar de tenantId | Login falha | Atualizar frontend para usar tenantId |
| JWTs antigos (com empresaId, sem tenantId) | 403 para usuarios logados | Revogar todos os tokens e forcar re-login |
| Rotas publicas sem tenant nao cacheiam | Performance reduzida | Aceitavel - seguranca > performance |
| DEFAULT_TENANT_ID nao definido | Admin nao criado | Documentar no .env.example |

## Rollback

```bash
# Se algo der errado:
docker stop pub-backend

# Reverter migration
docker run --rm --network pub-system_default \
  --env-file .env \
  pub-backend:latest \
  npx typeorm migration:revert -d src/data-source.ts

# Restaurar backup
psql -h pub-postgres -U pubuser pubsystem < backup_pre_migration_YYYYMMDD_HHMMSS.sql

# Voltar para imagem anterior
docker run -d --name pub-backend --network pub-system_default \
  --env-file .env \
  pub-backend:previous
```
