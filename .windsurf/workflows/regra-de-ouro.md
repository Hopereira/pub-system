---
description: Regra de Ouro — consultar docs antes de qualquer ação no pub-system
---

# Regra de Ouro — Pub System

**ANTES de qualquer mudança de código, configuração ou infraestrutura, siga esta ordem:**

## 1. Consultar documentação existente

Verificar nesta ordem:

1. `docs/sessions/` — relatórios das sessões mais recentes (mais atualizado)
2. `docs/current/` — arquitetura, segurança, permissões, troubleshooting, env vars
3. `docs/architecture/` — multi-tenant, infraestrutura, sistema atual
4. `docs/infra/` — deploy-vm, cloudflare, backup
5. `docs/audits/` — auditorias de banco, infra e multi-tenant

## 2. Se não encontrar na documentação → verificar no código

```
backend/src/           → lógica de negócio, guards, services
backend/src/common/    → tenant, guards, interceptors
docker-compose.micro.yml → configuração de produção
.github/workflows/ci.yml → pipeline CI/CD
```

## 3. Se ainda não tiver clareza → perguntar ao usuário

Nunca assumir. Sempre perguntar se:
- O comportamento esperado não está documentado
- O código contradiz a documentação
- A mudança pode afetar produção sem rollback fácil

---

## Convenção de Sessões

Cada sessão de trabalho deve gerar um relatório em:
```
docs/sessions/YYYY-MM-DD/RELATORIO_SESSAO.md
```

Padrão observado (ver `docs/2026-04-01/`, `docs/2026-04-02/`, `docs/sessions/2026-04-04/`):

| Seção | Conteúdo |
|-------|---------|
| Objetivo / Situação Inicial | O que estava quebrado / o que era pedido |
| Diagnóstico | Root cause identificado, com evidências (logs, código) |
| Documentação Consultada | Quais docs foram lidos antes de agir |
| Arquivos Modificados | Tabela: arquivo → tipo de mudança → justificativa |
| Testes Realizados | Tabela: teste → resultado |
| Commits da Sessão | Hash → mensagem |
| Estado Final | O que está funcionando após a sessão |
| Risco Residual / Próximas Ações | O que ainda está pendente |

## Convenção de Branches

```
docs/sessao-YYYY-MM-DD    → relatório e docs de uma sessão
fix/descricao-curta        → correção de bug
feat/descricao-curta       → nova funcionalidade
chore/descricao-curta      → manutenção (limpeza, CI, deps)
```

---

## Regras Críticas de Infraestrutura

Extraídas de `docs/sessions/2026-04-04/` e `docs/architecture/infrastructure.md`:

1. **Arquivo único de produção:** `docker-compose.micro.yml` (raiz). Nunca criar compose fora da raiz.
2. **Rede Docker:** Sempre declarar `networks` explicitamente com `name:` fixo. Nunca confiar na rede `default`.
3. **Volume do banco:** `infra_postgres_data` com `external: true`. Nunca apagar sem backup.
4. **Deploy parcial:** Usar `--no-deps --force-recreate backend`. Nunca recriar o postgres no deploy automático.
5. **CI/CD:** Nunca usar `continue-on-error: true` no step de deploy.

## Regras de Multi-Tenant

Extraídas de `docs/current/`, `docs/architecture/multi-tenant.md`, `docs/2026-04-01/`, `docs/2026-04-02/`:

1. **Campo correto:** `tenantId` (não `empresaId` que é legado).
2. **SUPER_ADMIN:** `tenantId = null` — bypassa `TenantGuard` e `FeatureGuard`.
3. **Queries globais:** Usar `rawRepository` para operações sem filtro de tenant (ex: `isFirstAccess`).
4. **Resolução de slug:** Usar `createQueryBuilder` com `addSelect('empresa.tenant_id')` — não `findOne` com `select` restritivo.
5. **Subdomínios reservados:** `www`, `api`, `app`, `admin`, `mail`, `smtp` não são slugs de tenant.
