# Relatório de Sessão — 02/04/2026

## Objetivo da Sessão

Depurar e corrigir falhas de login persistentes no sistema multi-tenant:

1. **Usuário tenant** `hop@hop.com` — login retornando 401 "Credenciais inválidas" apesar de credenciais corretas.
2. **Super Admin** `superadmin@pubsystem.com.br` — login retornando 404 "Estabelecimento não encontrado: www" e, após correção parcial, 401 "Não foi possível identificar o estabelecimento".
3. **Logout automático do Super Admin** — após login bem-sucedido, sessão era destruída imediatamente por rejeição de requests subsequentes.

---

## Ambiente

| Componente | Tecnologia | URL |
|---|---|---|
| Frontend | Next.js 14 + Vercel | `pubsystem.com.br` |
| Backend | NestJS + Docker (Oracle VM E2.1.Micro) | `api.pubsystem.com.br` |
| Banco de Dados | PostgreSQL 17 (Docker local) | `pub-postgres` |
| DNS/SSL | Cloudflare modo Flexível | — |
| Proxy | Nginx no host Ubuntu | `:80 → :3000` |

---

## Bugs Encontrados e Corrigidos

### Bug 1 — `hop@hop.com` retornava 401 (tenant UUID errado)

**Sintoma:** Login falhava com "Credenciais inválidas" mesmo com credenciais corretas.

**Root Cause:** `TenantResolverService.resolveBySlug()` usava `findOne` com cláusula `select` explícita que não carregava a propriedade `tenantId` herdada de `TenantAwareEntity` (TypeORM não popula campos herdados quando `select` é restritivo). O fallback `empresa.id` retornava o UUID da tabela `empresas` (`a367b711-...`) em vez do `tenantId` correto na tabela `tenants` (`aa25828b-...`).

**Diagnóstico:**
```bash
# UUID incorreto sendo usado no login:
tenant: a367b711-3654-421b-bf8a-1d5438bf6f1d  # empresas.id (ERRADO)
# UUID correto:
tenant: aa25828b-9b8e-4d11-8c34-dd3f0a72aed0  # tenants.tenant_id (CORRETO)
```

**Fix aplicado** — `backend/src/common/tenant/tenant-resolver.service.ts`:
```typescript
// ANTES: findOne com select restritivo não carregava tenantId herdado
const empresa = await this.empresaRepository.findOne({
  where: { slug },
  select: ['id', 'slug', 'nomeFantasia', 'ativo'],
});

// DEPOIS: createQueryBuilder com addSelect explícito
const findBySlug = (s: string) =>
  this.empresaRepository
    .createQueryBuilder('empresa')
    .addSelect('empresa.tenant_id')
    .where('empresa.slug = :slug', { slug: s })
    .getOne();

// Fallback: tenantId herdado ou id como último recurso
const tenantId = (empresa as any).tenantId || empresa.id;
```

**Commit:** `9dbbe58`

---

### Bug 2 — Super Admin recebia 404 "Estabelecimento não encontrado: www"

**Sintoma:** Frontend enviava `x-tenant-slug: www` ao backend ao tentar logar em `pubsystem.com.br` (sem subdomínio de tenant).

**Root Cause:** A função `extractTenantSlug()` em `authService.ts` extraía o primeiro segmento do hostname `www.pubsystem.com.br`, resultando em `www` como slug de tenant.

**Fix aplicado** — `frontend/src/services/authService.ts`:
```typescript
// ANTES: qualquer subdomínio era tratado como tenant slug
const parts = hostname.split('.');
if (parts.length >= 3) {
  return parts[0];
}

// DEPOIS: subdomínios reservados são ignorados
const RESERVED = ['www', 'api', 'app', 'admin', 'mail', 'smtp'];
const parts = hostname.split('.');
if (parts.length >= 3 && !RESERVED.includes(parts[0])) {
  return parts[0];
}
```

**Commit:** `6e430e2` — deployado automaticamente no Vercel.

---

### Bug 3 — Super Admin recebia 401 "Não foi possível identificar o estabelecimento"

**Sintoma:** Mesmo sem enviar `x-tenant-slug`, o backend retornava 401.

**Root Cause:** O container Docker estava rodando uma imagem desatualizada que não incluía os métodos:
- `AuthService.resolveTenantFromRequestOptional()` — versão que captura exceção e retorna `null` em vez de lançar
- `AuthService.validateSuperAdmin()` — autenticação sem tenant
- `FuncionarioService.findSuperAdminByEmail()` — busca por super admin com `tenantId IS NULL`
- `AuthController.login()` — fluxo com `resolveTenantFromRequestOptional` + branch para super admin

**Fix aplicado:**
1. Código fonte já existia correto em `auth.controller.ts`, `auth.service.ts`, `funcionario.service.ts`
2. Compilação TypeScript dentro do container: `docker exec pub-backend npx tsc --outDir /app/dist`
3. Restart do container: `docker restart pub-backend`

**auth.controller.ts** (fluxo de login corrigido):
```typescript
async login(...) {
  const tenantId = await this.authService.resolveTenantFromRequestOptional(
    host, headerTenantId, headerTenantSlug
  );
  let user: any;
  if (tenantId) {
    this.authService.setTenantInContext(tenantId);
    user = await this.authService.validateUser(loginDto.email, loginDto.senha, tenantId);
  } else {
    user = await this.authService.validateSuperAdmin(loginDto.email, loginDto.senha);
  }
  if (!user) throw new UnauthorizedException('Credenciais inválidas');
  // ...
}
```

---

### Bug 4 — Super Admin fazia logout automático (sessão destruída ao carregar dashboard)

**Sintoma:** Super Admin logava com sucesso e chegava ao Dashboard SaaS, mas era redirecionado imediatamente para `/login`. Console do browser mostrava:
- `GET /plan/features` → 401 "Token inválido: tenantId ausente"
- `GET /super-admin/metrics` → 401 "Token inválido: tenantId ausente"
- `GET /funcionarios/check-first-access` → 403 "Tenant não identificado. Verifique se você está autenticado corretamente"

**Root Causes identificados (3 sub-bugs):**

#### 4a — `jwt.strategy.ts` rejeitava tokens sem tenantId

O `JwtStrategy.validate()` lançava `UnauthorizedException` para qualquer token sem `tenantId`, sem exceção para `SUPER_ADMIN`.

**Fix** — `backend/src/auth/strategies/jwt.strategy.ts`:
```typescript
// ANTES:
if (!payload.tenantId) {
  throw new UnauthorizedException('Token inválido: tenantId ausente');
}

// DEPOIS:
if (!payload.tenantId && payload.cargo !== 'SUPER_ADMIN') {
  throw new UnauthorizedException('Token inválido: tenantId ausente');
}
```

#### 4b — `TenantGuard` usava `Reflect.defineMetadata` incompatível com NestJS

O decorator `@SkipTenantGuard()` usava `Reflect.defineMetadata` diretamente, enquanto `reflector.getAllAndOverride` do NestJS espera metadata definida via `SetMetadata`. O decorator era silenciosamente ignorado, causando o guard a rodar em todas as rotas incluindo as marcadas com `@SkipTenantGuard()`.

Além disso, o guard bloqueava usuários sem `tenantId` **antes** de verificar se era SUPER_ADMIN (a verificação de SUPER_ADMIN estava depois do bloco de bloqueio).

**Fix** — `backend/src/common/tenant/guards/tenant.guard.ts`:
```typescript
// ANTES: decorator com Reflect.defineMetadata (incompatível)
export const SkipTenantGuard = () => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(SKIP_TENANT_GUARD, true, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(SKIP_TENANT_GUARD, true, target);
    return target;
  };
};

// DEPOIS: SetMetadata (compatível com reflector.getAllAndOverride)
export const SkipTenantGuard = () => SetMetadata(SKIP_TENANT_GUARD, true);
```

```typescript
// ANTES: verificação SUPER_ADMIN APÓS o bloco de bloqueio (nunca chegava lá)
if (!userTenantId) {
  throw new ForbiddenException('Usuário não está associado a nenhum estabelecimento');
}
if (user.cargo === 'SUPER_ADMIN') { return true; } // NUNCA ALCANÇADO

// DEPOIS: SUPER_ADMIN bypass ANTES do bloco de bloqueio
if (user.cargo === 'SUPER_ADMIN') {
  return true; // Acesso global, sem verificação de tenant
}
if (!userTenantId) {
  throw new ForbiddenException('Usuário não está associado a nenhum estabelecimento');
}
```

**Commit:** `80eaf19`

#### 4c — `isFirstAccess()` usava `count()` com filtro de tenant via `BaseTenantRepository`

`FuncionarioService.isFirstAccess()` chamava `this.funcionarioRepository.count()` que herda de `BaseTenantRepository` — exigindo tenant no contexto. Como o `check-first-access` é uma rota pública sem tenant, o repositório lançava 403.

O mesmo problema afetava `onModuleInit()` e `registroPrimeiroAcesso()`.

**Fix** — `backend/src/modulos/funcionario/funcionario.service.ts`:
```typescript
// ANTES: count() herdado de BaseTenantRepository (exige tenant)
const count = await this.funcionarioRepository.count();

// DEPOIS: rawRepository.count() (sem filtro de tenant, contagem global)
const count = await this.funcionarioRepository.rawRepository.count();
```

**Commit:** `80eaf19`

---

## Processo de Deploy

### Problema de Infraestrutura: Builds Lentos

A VM Oracle E2.1.Micro tem recursos limitados (1 OCPU, 1GB RAM). Builds Docker completos com `--no-cache` levavam mais de 30 minutos ou não concluíam. A estratégia adotada foi:

1. **Patches JS diretos** — para correções imediatas, patchear os arquivos `.js` compilados dentro do container usando scripts Python (`docker exec ... cat`, manipulação Python, `docker cp` de volta)
2. **Recompilação `tsc` dentro do container** — após copiar os `.ts` corretos, rodar `npx tsc --outDir /app/dist` dentro do container para gerar os `.js` corretos
3. **Build completo com cache** — `docker compose build backend` com cache de camadas para gerar nova imagem persistente
4. **`up --no-deps backend`** — subir apenas o container do backend sem recriar o postgres

### Sequência final de deploy

```bash
# 1. Git pull no servidor
cd ~/pub-system && git pull origin main

# 2. Build da imagem com cache
docker compose -f docker-compose.micro.yml build backend

# 3. Recriar apenas o backend
docker stop pub-backend && docker rm pub-backend
docker compose -f docker-compose.micro.yml up -d --no-deps backend

# 4. Conectar na rede correta (postgres)
docker network connect infra_pub-network pub-backend
```

### Deploy Frontend (Vercel)

Mudanças no frontend são deployadas automaticamente via push para `main` no GitHub.

---

## Verificação Final

Todos os endpoints testados via `python3` + `curl` no servidor:

```
check-first-access:   {"isFirstAccess":false}                    ✅
Super Admin login:    {"access_token":"eyJ...","tenant_id":null}  ✅
plan/features:        {"plano":"ENTERPRISE","features":{...}}     ✅
super-admin/metrics:  {"totalTenants":3,...}                      ✅
hop@hop.com login:    {"access_token":"eyJ...","tenant_id":"aa25828b-..."}  ✅
```

---

## Arquivos Modificados

| Arquivo | Tipo | Descrição |
|---|---|---|
| `backend/src/common/tenant/tenant-resolver.service.ts` | Bug fix | `createQueryBuilder` + `addSelect('empresa.tenant_id')` |
| `backend/src/common/tenant/guards/tenant.guard.ts` | Bug fix | `SkipTenantGuard` com `SetMetadata`; bypass SUPER_ADMIN antes do bloco de bloqueio |
| `backend/src/auth/strategies/jwt.strategy.ts` | Bug fix | Bypass SUPER_ADMIN na validação de `tenantId` |
| `backend/src/auth/auth.service.ts` | Feature | `resolveTenantFromRequestOptional`, `validateSuperAdmin` |
| `backend/src/auth/auth.controller.ts` | Feature | Fluxo de login com branch tenant / super admin |
| `backend/src/modulos/funcionario/funcionario.service.ts` | Bug fix | `rawRepository.count()` para operações globais sem tenant |
| `frontend/src/services/authService.ts` | Bug fix | Filtro de subdomínios reservados em `extractTenantSlug` |

---

## Commits da Sessão

| Hash | Mensagem |
|---|---|
| `9dbbe58` | `fix(tenant): usar createQueryBuilder com addSelect para carregar tenantId herdado` |
| `6e430e2` | `fix(frontend): filtrar subdomínios reservados (www, api) em extractTenantSlug` |
| `80eaf19` | `fix(super-admin): SkipTenantGuard com SetMetadata, bypass SUPER_ADMIN no TenantGuard, count via rawRepository` |

---

## Estado Final do Sistema

- **hop@hop.com** — login funcional, tenant UUID correto `aa25828b-9b8e-4d11-8c34-dd3f0a72aed0`
- **superadmin@pubsystem.com.br** — login funcional, `tenantId: null`, acesso global ao Dashboard SaaS
- **Imagem Docker** — reconstruída com código correto, fixes persistem entre restarts
- **Frontend Vercel** — deployado com filtro de subdomínios reservados
