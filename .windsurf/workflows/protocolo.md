---
description: protocolo
---

# PROTOCOLO PRÉ-DESENVOLVIMENTO — pub-system

✅ CHECKLIST OBRIGATÓRIO (ANTES DE ESCREVER QUALQUER LINHA DE CÓDIGO)

Toda vez que uma IA (ou você) receber uma tarefa de criação, refatoração ou fix de código no pub-system, DEVE executar este checklist na ordem:

---

## FASE 1 — VERIFICAÇÃO DOCUMENTAÇÃO (10 min)

- [ ] 1. Qual é o arquivo/módulo/funcionalidade?
  - ↓ Procure em `docs/`

- [ ] 2. Existe documentação específica?
  - `docs/architecture/current-system.md` ← SEMPRE ler
  - `docs/current/ARQUITETURA.md` ← Verificar
  - `docs/sessions/2026-04-XX/` ← Ver última sessão relevante
  - `README.md` ← Contexto geral

- [ ] 3. Qual foi a ÚLTIMA MUDANÇA neste arquivo?
  - ↓ `git log --oneline -- <arquivo>` (últimos 5 commits)
  - ↓ Leia o commit message + sessão docs correspondente

- [ ] 4. Existem BOAS PRÁTICAS documentadas para isto?
  - `docs/current/PERMISSOES.md` (se é auth/roles)
  - `docs/current/TROUBLESHOOTING.md` (se é fix)
  - `docs/infra/deploy-vm.md` (se é infra)
  - `docs/database/migrations.md` (se é banco)

- [ ] 5. ESTADO ATUAL CONFIRMADO?
  - ✅ Código compilando sem erros
  - ✅ Sistema rodando em produção (Oracle VM — api.pubsystem.com.br)
  - ✅ Última sessão: 2026-04-16 (auditoria completa)

---

## FASE 2 — ANÁLISE PONTA-A-PONTA (15 min)

Rastreie o código COMPLETO para a funcionalidade:

- [ ] **BACKEND:** Controller → Service → Repository → Query SQL
  - ↓ Arquivo: `backend/src/modulos/[módulo]/`
  - [ ] Validação de entrada (`@ValidatePipe` com DTO)
  - [ ] Autenticação (`@UseGuards`)
  - [ ] Autorização (`@Roles`)
  - [ ] `getTenantId()` — qual é o fallback?
  - [ ] Query raw SQL ou TypeORM?
  - [ ] `try/catch` com logging?
  - [ ] Transações?
  - [ ] Cache invalidation?

- [ ] **FRONTEND:** Page → Component → Hook → API call
  - ↓ Arquivo: `frontend/src/app/` ou `frontend/src/features/`
  - [ ] Rota protegida ou pública?
  - [ ] `AuthContext` ou cookie `authSession`?
  - [ ] Tenant context?
  - [ ] URL hardcoded ou `NEXT_PUBLIC_API_URL`?
  - [ ] Error handling?
  - [ ] Loading states?

- [ ] **BANCO:** Migrations → Schema → Indexes → Constraints
  - ↓ Arquivo: `backend/src/database/`
  - [ ] `tenant_id` nullable ou NOT NULL?
  - [ ] Foreign key para `tenants(id)`?
  - [ ] Índice em `(tenant_id, status)` ou similar?
  - [ ] Soft delete (`isActive`/`deletedAt`)?
  - [ ] Migration já foi executada em produção?

- [ ] **INFRA:** Docker → CI/CD → Secrets → Logs
  - ↓ Arquivo: `docker-compose.micro.yml` + `.github/workflows/`
  - [ ] Variáveis de ambiente documentadas?
  - [ ] Secrets expostos em logs?
  - [ ] Health checks?
  - [ ] Volumes persistentes?

---

## FASE 3 — RISCOS CONHECIDOS (CHECKLIST SEGURANÇA)

Antes de tocar em código, verifique se a mudança afeta estas áreas de RISCO:

### 🔴 P0 — CRÍTICOS (se tocar, TESTE MUITO)

- [ ] **Schedulers** (`QuaseProntoScheduler`, `MedalhaScheduler`)
  - SEMPRE validar `tenant_id` em WHERE

- [ ] **`getTenantId()`** em qualquer service
  - Verificar TODOS os fallbacks
  - Confirmar que não retorna null silenciosamente

- [ ] **WebSocket** (`pedidos.gateway.ts`, `base-tenant.gateway.ts`)
  - JWT verificado? Tenant correto?

- [ ] **Cache invalidation** (`cache-invalidation.service.ts`)
  - Usa `trackedKeys`? Ou `store.keys()`?
  - Filtra por `tenant_id`?

- [ ] **Migrations de banco**
  - Nunca drope coluna sem backup
  - Sempre crie migration reversa

### 🟠 P1 — ALTOS (se tocar, REVIEW EXTRA)

- [ ] Authentication (login, JWT, refresh token)
- [ ] Authorization (`@Roles`)
- [ ] Multi-tenant data isolation (`WHERE tenant_id`)
- [ ] API endpoints públicos
- [ ] CI/CD pipeline

### 🟡 P2 — MÉDIOS (mudança normal, mas watch)

- [ ] Cache (in-memory, não Redis ainda)
- [ ] Performance queries (N+1?)
- [ ] Logs (não expõe dados sensíveis?)
- [ ] Error handling
- [ ] Documentation

---

## FASE 4 — ESTADO ATUAL VS DOCUMENTAÇÃO

Antes de refatorar, confirme se a documentação está correta vs código real:

**Status da documentação (atualizado 2026-04-16):**

| Documento | Status |
|-----------|--------|
| `README.md` | ✅ Atualizado (2026-04-16) |
| `docs/architecture/current-system.md` | ✅ Atualizado (2026-04-16) |
| `docs/architecture/infrastructure.md` | ✅ Atualizado (2026-04-16) |
| `docs/current/ARQUITETURA.md` | ✅ Atualizado (2026-04-16) |
| `docs/sessions/2026-04-16/` | ✅ Auditoria completa |

**Padrões atuais confirmados:**

| Padrão | Resposta correta |
|--------|-----------------|
| `tenant_id` fonte | Ordem: `TenantContextService` → `request.tenant.id` → `request.user.tenantId` → `x-tenant-id` header |
| Cache | `keyv` in-memory com `trackedKeys` Set estático (Redis em backlog) |
| Banco | TypeORM + raw SQL em lugares específicos |
| Logs | Winston (não `console.log`) |
| Frontend HTTP | `axios` com interceptor JWT via `api.ts` |
| Frontend URL base | `NEXT_PUBLIC_API_URL` (env var) |

---

## FASE 5 — TESTES E VALIDAÇÃO PRÉ-DEPLOY

Antes de abrir PR, execute:

```bash
# Backend
cd backend
npm run lint            # ESLint sem erros
npm run build           # Compila (tsc)
npm test                # Testes passam (ou skip com --passWithNoTests)
npm run typeorm:migration:run  # Migrations rodam sem erro

# Frontend
cd frontend
npm run lint            # ESLint sem erros
npm run build           # Next.js build sem erro

# Verificações manuais
docker compose up -d
curl http://localhost:3000/health
# Frontend: http://localhost:3001
```

---

## 📌 TEMPLATE — O QUE PEDIR À IA

Quando mandar uma IA fazer algo no pub-system, use este template:

```markdown
# Task: [Nome da tarefa]

## 📋 Contexto
- Sistema: pub-system (SaaS multi-tenant)
- Arquivo(s) afetado(s): backend/src/modulos/[módulo]/xxx.service.ts
- Razão: [brief description]
- Status produção: ✅ LIVE em Oracle VM (api.pubsystem.com.br)

## ⚠️ Restrições (OBRIGATÓRIO VERIFICAR)
- [ ] Validar tenant_id em todas as queries
- [ ] Usar getTenantId() do contexto (ordem de precedência)
- [ ] Adicionar @ValidatePipe em DTOs
- [ ] Cache invalidation precisa atualizar trackedKeys
- [ ] Logs estruturados com Winston, não console.log

## 📚 Antes de Começar
1. Leia: docs/architecture/current-system.md (seção [X])
2. Leia: docs/sessions/2026-04-16/ (auditoria completa)
3. Verifique: git log --oneline -- [arquivo] (últimas mudanças)
4. Checklist: [indique riscos P0/P1/P2 relevantes]

## 🎯 O Que Fazer
[Descrição clara da tarefa]

## ✅ Critério de Aceitação
- [ ] Compila sem erro
- [ ] Testes passam (ou indicar skip)
- [ ] Documentação atualizada se necessário
- [ ] Sem warnings de linting
- [ ] Código revisado contra checklist de riscos
```

---

## 🔗 ESTRUTURA RÁPIDA — Onde Procurar Info

```
pub-system/
├── docs/
│   ├── architecture/
│   │   └── current-system.md   ← SEMPRE ler 1º
│   ├── current/
│   │   ├── ARQUITETURA.md      ← Verificar 2º
│   │   ├── PERMISSOES.md       ← Se auth
│   │   └── TROUBLESHOOTING.md  ← Se fix
│   ├── sessions/
│   │   └── 2026-04-16/         ← Última sessão (auditoria)
│   └── database/
│       └── migrations.md       ← Se banco
├── backend/
│   ├── src/
│   │   ├── modulos/            ← [módulo aqui]
│   │   └── database/
│   │       └── migrations/     ← Schema changes
│   └── package.json            ← Dependências reais
├── frontend/
│   └── src/app/                ← [feature aqui]
└── .github/workflows/
    └── ci.yml                  ← Deploy pipeline
```

---

## 🚨 RED FLAGS — PARE E PERGUNTE

Se você ver QUALQUER UM destes padrões, PARE e confirme com o time:

🛑 **"Vou adicionar nova dependência"**
→ Verificar: `package.json` real vs documentado

🛑 **"Vou mudar a query do `getTenantId()`"**
→ Verificar: TODOS os lugares onde é usado (service + gateway + scheduler)

🛑 **"Vou deletar migration ou tabela"**
→ Verificar: há dados em produção? Backups?

🛑 **"Vou remover/adicionar campo no schema"**
→ Verificar: migration foi criada? Irá reverter OK?

🛑 **"Vou mudar variável de ambiente"**
→ Verificar: documentado em `ENV_VARS.md`? Secrets no `.env` da VM?

🛑 **"Vou mexer em WebSocket ou Cache"**
→ Verificar: testes de multi-tenant funcionam?

🛑 **"Código tem query SQL raw"**
→ Verificar: por que não usar TypeORM? Segurança?

---

## 📋 CHECKLIST FINAL (PÓS-CÓDIGO)

Antes de commitar:

- [ ] Documentação atualizada (`docs/sessions/YYYY-MM-DD/RELATORIO_SESSAO.md`)
- [ ] Código sem `console.log` (usar Winston)
- [ ] Sem hardcoded URLs ou secrets
- [ ] Tenant isolation verificada (`WHERE tenant_id = :tenantId`)
- [ ] Testes passam ou skip justificado
- [ ] Linting sem warnings
- [ ] Sem comentários `TODO` ou `FIXME`
- [ ] Error messages claras (não expõe stack trace)
- [ ] Cache invalidation atualizada se necessário
- [ ] Git commit message descreve PORQUÊ (não só O QUÊ)
- [ ] Pronto para revisar em PR