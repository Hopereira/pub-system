# Security Hardening — Sprint 1

**Branch:** `sprint-1-security-hardening`
**Data:** 2026-04-24
**Risco geral:** CRÍTICO → MITIGADO

---

## Resumo das Mudanças

### 1. JWT Signature Validation (CRÍTICO)

**Problema:** `TenantInterceptor` usava `jwtService.decode()` que NÃO verifica a assinatura do token. Um atacante poderia forjar um JWT com qualquer `tenantId` e obter dados de outro tenant.

**Correção:** Substituído por `jwtService.verify()` que valida assinatura + expiração.

**Arquivo:** `backend/src/common/tenant/tenant.interceptor.ts`

### 2. Access Token em httpOnly Cookie (CRÍTICO)

**Problema:** O `access_token` JWT era armazenado em `sessionStorage` no frontend, vulnerável a XSS.

**Correção:**
- Backend agora seta `access_token` como cookie `httpOnly`, `secure`, `sameSite=strict`, `path=/`
- `JwtStrategy` (Passport) extrai JWT do cookie com fallback para Bearer header
- `TenantInterceptor` também lê do cookie para resolução de tenant

**Arquivos:**
- `backend/src/auth/auth.controller.ts` — seta/limpa cookie
- `backend/src/auth/strategies/jwt.strategy.ts` — extração cookie + Bearer
- `backend/src/common/tenant/tenant.interceptor.ts` — lê cookie como fallback

### 3. Frontend: Remoção do `sessionStorage` (CRÍTICO)

**Problema:** Token JWT acessível via JavaScript (`sessionStorage`), exposto a XSS.

**Correção:**
- `AuthContext` mantém token apenas em memória React (`useRef`) para WebSocket handshake e decode de user info
- `api.ts` usa `withCredentials: true` — cookie enviado automaticamente
- `SocketContext` lê token do `AuthContext.tokenRef` (não mais `sessionStorage`)
- Migration fallback: se detectar token legado no `sessionStorage`, usa-o uma vez e remove

**Arquivos:**
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/context/SocketContext.tsx`
- `frontend/src/services/authService.ts`
- `frontend/src/app/(auth)/login/page.tsx`
- `frontend/src/app/(protected)/garcom/page.tsx`

### 4. Frontend Middleware: Validação JWT Real (ALTO)

**Problema:** Middleware Next.js verificava apenas a presença do cookie `authSession=1` (sem valor real). Qualquer pessoa poderia setar esse cookie manualmente e acessar `/dashboard`.

**Correção:**
- Middleware agora usa `jose.jwtVerify()` para validar o `access_token` cookie no Edge Runtime
- Verifica assinatura + expiração antes de permitir acesso
- Migration fallback: aceita `authSession` legado temporariamente

**Arquivo:** `frontend/src/middleware.ts`

**Requisito:** `JWT_SECRET` disponível como env var no frontend (server-side only, NÃO `NEXT_PUBLIC_`)

### 5. `/health/metrics` Protegido (MÉDIO)

**Problema:** Endpoint expunha informações do sistema (memória, CPU, Node.js version, etc.) sem autenticação.

**Correção:** Adicionado `@UseGuards(JwtAuthGuard)`. Endpoints `/health`, `/health/live`, `/health/ready` permanecem públicos para load balancers.

**Arquivo:** `backend/src/health/health.controller.ts`

### 6. Build Errors Bloqueiam Deploy (MÉDIO)

**Problema:** `next.config.ts` tinha `ignoreBuildErrors: true` e `ignoreDuringBuilds: true`, permitindo deploy com erros de TypeScript/ESLint.

**Correção:** Flags setadas para `false`.

**Arquivo:** `frontend/next.config.ts`

---

## Backward Compatibility

| Recurso | Antes | Depois | Compat |
|---------|-------|--------|--------|
| Bearer header | Primário | Fallback | ✅ |
| Cookie access_token | N/A | Primário | ✅ |
| sessionStorage | Primário | Removido (fallback migra) | ✅ |
| authSession=1 cookie | Middleware | Legado aceito temporariamente | ✅ |
| WebSocket token | sessionStorage | AuthContext.tokenRef | ✅ |
| /health/metrics | Público | Autenticado | ⚠️ Monitoring scripts precisam de token |

---

## Rollback

1. **Revert branch:** `git checkout main` — voltando ao branch principal restaura comportamento anterior
2. **Sem migration de banco:** Nenhuma alteração em schema/dados
3. **Sem breaking API:** Body de resposta permanece igual; cookie é adicional
4. **Frontend fallback:** AuthContext detecta token legado no sessionStorage e o utiliza

---

## Deploy Checklist

- [ ] Adicionar `JWT_SECRET` como env var no serviço frontend (Vercel, Docker, etc.)
- [ ] Verificar CORS: backend deve permitir `credentials: true` para origens do frontend
- [ ] Testar login/logout no browser (cookies devem aparecer em DevTools > Application)
- [ ] Monitorar logs do TenantInterceptor para "JWT não verificado" (esperado para tokens expirados)
- [ ] Atualizar scripts de health monitoring para incluir token de autenticação em `/health/metrics`

---

## Testes

Arquivo: `backend/test/security-hardening.e2e-spec.ts`

Cobertura:
1. Login seta access_token como httpOnly cookie
2. Rotas protegidas aceitam cookie E Bearer header
3. `/health/metrics` requer autenticação
4. JWT forjado é rejeitado
5. Logout limpa ambos os cookies
6. Refresh renova o access_token cookie

---

## Riscos Residuais

1. **CSRF:** Cookie `sameSite=strict` mitiga, mas para segurança máxima considerar CSRF tokens em forms
2. **Cookie em dev (localhost):** `secure: false` em desenvolvimento — aceitável
3. **Token em memória (React):** Perdido no refresh da página — mitigado pelo refresh via cookie httpOnly
4. **WebSocket:** Token enviado no handshake (memory ref) — não pode usar cookie pois Socket.IO usa WebSocket protocol
