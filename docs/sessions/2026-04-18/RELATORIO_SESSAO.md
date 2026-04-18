# Relatório de Sessão — 2026-04-18

## Objetivo / Situação Inicial

Três bugs reportados em produção:
1. `POST /avaliacoes` retornando 403 para clientes sem JWT (rota pública)
2. `POST /registro` retornando 400 ao criar novo tenant
3. `PATCH /funcionarios/upload-foto` retornando 500 ao tentar fazer upload de foto

---

## Bug 1 — POST /avaliacoes retorna 403 na rota pública

### Diagnóstico

`AvaliacaoService.create()` chamava métodos do `BaseTenantRepository` (`findOne`, `create`, `save`) que internamente chamam `getTenantId()`. Como a rota é pública (`@Public()`), não há JWT e portanto nenhum `tenantId` no contexto — causando `ForbiddenException` (403).

### Arquivos Modificados

| Arquivo | Mudança | Justificativa |
|---------|---------|---------------|
| `backend/src/modulos/avaliacao/avaliacao.service.ts` | `create()` passou a usar `rawRepository.findOne` + `findByComandaIdPublic` + `createPublic` | Bypassa o filtro de tenant para rotas públicas |

### Commits

- `fix(avaliacao): POST /avaliacoes retorna 403 na rota publica do cliente` (PR #299, mergeado)

---

## Bug 2 — POST /registro retorna 400 Bad Request

### Diagnóstico

O frontend enviava o campo `plano: "FREE"` no body do `POST /registro`, mas o `PublicRegistrationDto` não declarava esse campo. Com `forbidNonWhitelisted: true` no `ValidationPipe` global (`main.ts`), qualquer campo não declarado no DTO causa rejeição imediata com 400 — sem nem chegar ao service.

Adicionalmente, após registro bem-sucedido o frontend redirecionava para `/login` genérico em vez do subdomínio do tenant (`hopbar.pubsystem.com.br`). O backend também retornava `urlLogin: https://www.pubsystem.com.br/t/{slug}` (rota interna) em vez do subdomínio.

### Arquivos Modificados

| Arquivo | Mudança | Justificativa |
|---------|---------|---------------|
| `backend/src/common/tenant/controllers/public-registration.controller.ts` | Adicionado `plano?: TenantPlano` com `@IsEnum @IsOptional` ao DTO | Campo enviado pelo frontend não estava declarado no DTO |
| `backend/src/common/tenant/controllers/public-registration.controller.ts` | `urlLogin` e `urlAcesso` agora retornam `https://{slug}.pubsystem.com.br` | Redirecionar para o subdomínio correto do tenant |
| `frontend/src/app/(public)/primeiro-acesso/page.tsx` | Após registro, usa `window.location.href = urlLogin` em vez de `router.push('/login')` | Força navegação para o subdomínio do tenant recém-criado |

### Commits

- `fix(registro): campo plano causava 400 por forbidNonWhitelisted`
- `fix(registro): redirecionar para subdominio do tenant apos registro`

---

## Bug 3 — PATCH /funcionarios/upload-foto retorna 500

### Diagnóstico

O `GcsStorageService` falhou com:
```
ErrorWithCode: private_key and client_email are required.
```

O arquivo `/home/ubuntu/pub-system/gcs-credentials.json` no servidor continha apenas `{}` — as credenciais do Google Cloud Storage nunca tinham sido configuradas em produção. O arquivo é montado como volume read-only no container: `-v ~/pub-system/gcs-credentials.json:/app/gcs-credentials.json:ro`.

### Resolução

- Copiado o arquivo `backend/gcs-credentials.json` (local, no `.gitignore`) para o servidor via SCP
- Arquivo depositado em `~/pub-system/gcs-credentials.json` (lido pelo container via volume)
- Container reiniciado para recarregar o volume

**Não há mudança de código** — era problema de configuração de infraestrutura.

### Verificação

```
docker exec pub-backend sh -c 'wc -c /app/gcs-credentials.json'
# Resultado: 2388 /app/gcs-credentials.json  ✅
```

---

## Bug Adicional — CI/CD falhando com Broken pipe e heredoc

### Diagnóstico

O workflow de deploy `.github/workflows/ci.yml` tinha dois problemas:

1. **Broken pipe** na transferência da imagem Docker: usava `cat arquivo | ssh ... "docker load"` — pipe SSH caía durante transferências longas.
2. **Heredoc incompatível**: o step de rollback usava `ssh ... << 'ENDSSH'` que não funciona sem pseudoterminal (`-t`) em CI runners.
3. **Health check insuficiente**: `sleep 15` antes de um único `curl` — insuficiente para o NestJS subir.

### Arquivos Modificados

| Arquivo | Mudança | Justificativa |
|---------|---------|---------------|
| `.github/workflows/ci.yml` | Trocar pipe SSH por `scp` + `ssh docker load` separado | Mais robusto para arquivos grandes |
| `.github/workflows/ci.yml` | Rollback: heredoc → comando em linha única | Compatível com CI runners sem pseudoterminal |
| `.github/workflows/ci.yml` | Health check: `sleep 15` → loop de 9 tentativas × 10s (90s total) | Tempo suficiente para NestJS inicializar |

### Commits

- `fix(ci): corrigir Broken pipe no deploy e rollback com heredoc`
- `fix(ci): health check com retry de 90s em vez de sleep 15s fixo`

---

## Estado Final

| Item | Status |
|------|--------|
| POST /avaliacoes (rota pública) | ✅ Corrigido |
| POST /registro (Bad Request 400) | ✅ Corrigido |
| Redirect pós-registro para subdomínio | ✅ Corrigido (aguarda deploy frontend) |
| PATCH /funcionarios/upload-foto (500) | ✅ Corrigido (credenciais GCS configuradas) |
| CI/CD Broken pipe + heredoc | ✅ Corrigido |
| Disco do servidor Oracle | ✅ Expandido de 47 GB para 150 GB |

## Risco Residual / Próximas Ações

1. **gcs-credentials.json**: arquivo existe apenas no servidor — se o container for recriado do zero (novo `docker run`), é necessário garantir que o arquivo esteja em `~/pub-system/gcs-credentials.json` no host. O CI/CD usa `--env-file ~/pub-system/.env` e o volume já está declarado no comando `docker run` do workflow.
2. **Redirect pós-registro**: mudança no frontend só entra em produção após o próximo deploy bem-sucedido do CI/CD.
3. **403 em GET /analytics**: novo tenant `hopbar` recebe 403 em `/analytics/pedidos/relatorio-geral`. Pode ser `FeatureGuard` bloqueando por plano. A investigar na próxima sessão se persistir.
