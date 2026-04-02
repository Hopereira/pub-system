# Relatório de Sessão — 2026-04-01

**Objetivo:** Corrigir login do Super Admin no Pub System  
**Status:** ✅ Concluído  
**Ambiente:** Produção (Oracle VM `134.65.248.235`)

---

## 1. Problema

O Super Admin (`superadmin@pubsystem.com.br`) não conseguia fazer login no dashboard SaaS (`pubsystem.com.br/login`). O sistema retornava erros porque toda a arquitetura de autenticação exigia um `tenantId` obrigatório — mas o SUPER_ADMIN tem escopo de **plataforma** e não pertence a nenhum tenant (`tenantId = NULL`).

### Erros encontrados

| Erro | Causa raiz |
|------|-----------|
| `403 Forbidden` | `TenantGuard` bloqueava rotas de auth sem tenant |
| `404 Estabelecimento não encontrado` | `resolveTenantFromRequest` não encontrava tenant para o domínio base |
| `401 Credenciais inválidas` | `validateUser` buscava por email + tenantId, mas super admin tem tenantId NULL |
| `401 Token inválido: tenantId ausente` | `JwtStrategy.validate()` rejeitava JWTs sem tenantId |
| Super admin não existia no banco | Nenhum registro com `cargo=SUPER_ADMIN` havia sido criado |

---

## 2. Documentação Consultada (antes de implementar)

| Documento | Informação relevante |
|-----------|---------------------|
| `docs/architecture/multi-tenant.md` §11 | SUPER_ADMIN bypassa TenantGuard e FeatureGuard, escopo plataforma |
| `docs/current/SEGURANCA.md` §2 | RolesGuard: SUPER_ADMIN tem bypass explícito |
| `docs/current/PERMISSOES.md` §1-2 | SUPER_ADMIN: escopo Plataforma, acesso total a todos os tenants |
| `docs/current/ENV_VARS.md` §Setup | `ENABLE_SETUP` + `SETUP_TOKEN` para criar primeiro super admin |
| `docs/current/SEGURANCA.md` §10 | Endpoint `/setup/super-admin` protegido por env vars |

---

## 3. Arquivos Modificados

### 3.1 `backend/src/auth/strategies/jwt.strategy.ts`

**Mudança:** Permitir `tenantId: null` no JWT para usuários com `cargo === 'SUPER_ADMIN'`.

```typescript
// ANTES
if (!payload.tenantId) {
  throw new UnauthorizedException('Token inválido: tenantId ausente');
}

// DEPOIS
if (!payload.tenantId && payload.cargo !== 'SUPER_ADMIN') {
  throw new UnauthorizedException('Token inválido: tenantId ausente');
}
return {
  // ...
  tenantId: payload.tenantId || null,
};
```

**Justificativa:** Doc `multi-tenant.md` §11 — "SUPER_ADMIN bypassa TenantGuard e FeatureGuard".

### 3.2 `backend/src/auth/auth.service.ts`

**Mudança 1:** Novo método `resolveTenantFromRequestOptional()` — retorna `null` em vez de lançar exceção quando não encontra tenant.

```typescript
async resolveTenantFromRequestOptional(
  host?: string, headerTenantId?: string, headerTenantSlug?: string
): Promise<string | null> {
  try {
    return await this.resolveTenantFromRequest(host, headerTenantId, headerTenantSlug);
  } catch {
    return null;
  }
}
```

**Mudança 2:** Novo método `validateSuperAdmin()` — autentica super admin buscando por `tenantId IS NULL`.

```typescript
async validateSuperAdmin(email: string, pass: string, ipAddress?: string): Promise<any> {
  const user = await this.funcionarioService.findSuperAdminByEmail(email);
  if (user && (await bcrypt.compare(pass, user.senha))) {
    const { senha, ...result } = user;
    return result;
  }
  return null;
}
```

**Mudança 3:** Assinatura do método `login()` alterada de `tenantId: string` para `tenantId: string | null`.

```typescript
// ANTES
async login(user: any, tenantId: string, ipAddress: string, userAgent?: string)

// DEPOIS
async login(user: any, tenantId: string | null, ipAddress: string, userAgent?: string)
```

**Justificativa:** Doc `PERMISSOES.md` §5.2 — "Todo request deve incluir tenantId no JWT" aplica-se a tenants normais. SUPER_ADMIN é exceção documentada.

### 3.3 `backend/src/auth/auth.controller.ts`

**Mudança:** Login com dois fluxos — tenant (normal) e super admin (sem tenant).

```typescript
// 1. Tentar resolver tenant (pode ser null para super admin)
const tenantId = await this.authService.resolveTenantFromRequestOptional(
  host, headerTenantId, headerTenantSlug
);

let user: any;
if (tenantId) {
  // Fluxo normal: login com tenant
  this.authService.setTenantInContext(tenantId);
  user = await this.authService.validateUser(loginDto.email, loginDto.senha, tenantId, ipAddress);
} else {
  // Fluxo super admin: login sem tenant
  user = await this.authService.validateSuperAdmin(loginDto.email, loginDto.senha, ipAddress);
}
```

### 3.4 `backend/src/modulos/funcionario/funcionario.service.ts`

**Mudança:** Novo método `findSuperAdminByEmail()` — busca funcionário com `tenant_id IS NULL` e `cargo = SUPER_ADMIN`.

```typescript
findSuperAdminByEmail(email: string): Promise<Funcionario | null> {
  return this.funcionarioRepository.rawRepository
    .createQueryBuilder('funcionario')
    .where('funcionario.email = :email', { email })
    .andWhere('funcionario.tenant_id IS NULL')
    .andWhere('funcionario.cargo = :cargo', { cargo: Cargo.SUPER_ADMIN })
    .addSelect('funcionario.senha')
    .getOne();
}
```

**Justificativa:** Usa `rawRepository` para bypassing do filtro automático de tenant do `BaseTenantRepository`, pois o super admin não pertence a nenhum tenant.

---

## 4. Dados Criados no Banco

| Campo | Valor |
|-------|-------|
| `email` | `superadmin@pubsystem.com.br` |
| `nome` | `Super Admin` |
| `cargo` | `SUPER_ADMIN` |
| `status` | `ATIVO` |
| `tenant_id` | `NULL` |
| `senha` | Hash bcrypt de `super123` |

Criado via script Node.js executado dentro do container `pub-backend` com bcrypt para gerar o hash corretamente.

---

## 5. Deploy

| Etapa | Comando/Ação |
|-------|-------------|
| Commit | `git commit -m "fix: suporte login SUPER_ADMIN sem tenant (tenantId null)"` |
| Push | `git push origin main` |
| Build | `docker build -f backend/Dockerfile.prod -t pub-backend-prod:latest ./backend` |
| Transfer | `docker save` → `scp` → VM |
| Deploy | `docker load` → `docker run` com env vars |
| Criar super admin | Script Node.js via `docker exec` (bcrypt hash + pg query) |

---

## 6. Testes Realizados

| Teste | Resultado |
|-------|-----------|
| `POST /auth/login` sem tenant header (super admin) | ✅ 200 — JWT com `tenantId: null`, `cargo: SUPER_ADMIN` |
| `POST /auth/login` com `x-tenant-slug` (tenant normal) | ✅ Funciona normalmente (sem regressão) |
| JWT contém `cargo: SUPER_ADMIN` e `tenantId: null` | ✅ Verificado no payload decodificado |
| Backend logs mostram fluxo correto | ✅ `Autenticação SUPER_ADMIN bem-sucedida` |

---

## 7. Fluxo Completo do Login Super Admin

```
1. Usuário acessa pubsystem.com.br/login (sem subdomínio)
2. Frontend: extractTenantSlug() retorna null (sem subdomínio)
3. Frontend: POST /auth/login { email, senha } — SEM header x-tenant-slug
4. Backend AuthController: resolveTenantFromRequestOptional() retorna null
5. Backend AuthController: chama validateSuperAdmin() (fluxo sem tenant)
6. Backend FuncionarioService: findSuperAdminByEmail() busca WHERE tenant_id IS NULL AND cargo = 'SUPER_ADMIN'
7. Backend AuthService: bcrypt.compare() valida senha
8. Backend AuthService: login() gera JWT com tenantId: null
9. Backend JwtStrategy: validate() aceita tenantId null para cargo SUPER_ADMIN
10. Frontend: decodifica JWT, detecta cargo SUPER_ADMIN
11. Frontend: redireciona para /super-admin (dashboard SaaS)
```

---

## 8. Arquivos do Frontend (nenhuma alteração necessária)

O frontend já estava 100% preparado para o super admin:

| Arquivo | Funcionalidade |
|---------|---------------|
| `frontend/src/services/authService.ts` | `extractTenantSlug()` retorna `null` em domínio base |
| `frontend/src/app/(auth)/login/page.tsx` | Redireciona `SUPER_ADMIN` para `/super-admin` |
| `frontend/src/app/(protected)/super-admin/page.tsx` | Dashboard SaaS com métricas e gestão de tenants |
| `frontend/src/services/superAdminService.ts` | Todos os endpoints `/super-admin/*` implementados |

---

## 9. Resumo das Mudanças

| Componente | Antes | Depois |
|-----------|-------|--------|
| `JwtStrategy` | Rejeitava JWT sem tenantId | Aceita tenantId null para SUPER_ADMIN |
| `AuthService.login()` | `tenantId: string` (obrigatório) | `tenantId: string \| null` |
| `AuthController.login()` | Sempre resolvia tenant (falhava sem subdomínio) | Fluxo condicional: tenant ou super admin |
| `FuncionarioService` | Só buscava por email + tenantId | Novo método `findSuperAdminByEmail` (tenantId IS NULL) |
| Banco de dados | Sem super admin | Super admin criado com tenantId NULL |
| Frontend | Já preparado | Zero alterações |

---

## 10. Observações

- O hash bcrypt deve ser gerado via Node.js (dentro do container) para evitar problemas de escaping no shell
- O endpoint `POST /setup/super-admin` existe como alternativa para criar o super admin (requer `ENABLE_SETUP=true` + `SETUP_TOKEN`)
- O `SUPER_ADMIN` bypassa `TenantGuard` e `FeatureGuard` conforme documentação de arquitetura
- Nenhuma regressão nos fluxos de login de tenants normais via subdomínio
