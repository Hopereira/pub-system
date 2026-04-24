# Convenção de Sessões — Pub System

**Última atualização:** 2026-04-24

---

## Estrutura de Pastas

Cada sessão de trabalho gera uma pasta com data e pelo menos um relatório:

```
docs/
├── sessions/
│   ├── CONVENCAO.md                        ← este arquivo
│   ├── 2026-04-04/
│   │   ├── RELATORIO_SESSAO.md             ← relatório principal
│   │   └── DOCKER_REDE_DIAGNOSTICO.md      ← doc técnico específico (opcional)
│   └── YYYY-MM-DD/
│       └── RELATORIO_SESSAO.md
├── 2026-04-01/
│   └── RELATORIO_SUPER_ADMIN_LOGIN.md      ← sessões antigas (pré-convenção)
└── 2026-04-02/
    └── RELATORIO_SESSAO.md
```

> Sessões anteriores a 2026-04-04 ficam em `docs/YYYY-MM-DD/` (formato antigo).  
> A partir de 2026-04-04 usar `docs/sessions/YYYY-MM-DD/`.

---

## Template de Relatório

```markdown
# Relatório de Sessão — YYYY-MM-DD

**Data:** DD de Mês de YYYY
**Status final:** ✅ / ❌ / 🔄

## 1. Situação Inicial
O que estava quebrado / o que foi pedido.

## 2. Documentação Consultada
| Documento | Informação relevante |

## 3. Diagnóstico
Root cause com evidências (logs, código antes/depois).

## 4. Correções Aplicadas
Por arquivo: o que mudou e por quê.

## 5. Testes Realizados
| Teste | Resultado |

## 6. Commits da Sessão
| Hash | Mensagem |

## 7. Estado Final
O que está funcionando.

## 8. Risco Residual / Próximas Ações
O que ainda está pendente.
```

---

## Sessões Registradas

| Data | Arquivo | Resumo |
|------|---------|--------|
| 2026-04-01 | `docs/2026-04-01/RELATORIO_SUPER_ADMIN_LOGIN.md` | Fix login SUPER_ADMIN (tenantId null, bypass TenantGuard) |
| 2026-04-02 | `docs/2026-04-02/RELATORIO_SESSAO.md` | Fix login hop@hop.com (UUID errado), Fix Super Admin logout automático |
| 2026-04-04 | `docs/sessions/2026-04-04/RELATORIO_SESSAO.md` | Fix 502 Bad Gateway — rede Docker e volume postgres |
| 2026-04-05 | `docs/sessions/2026-04-05/RELATORIO_SESSAO.md` | Bug1: POST /pontos-entrega 500 (empresa_id NOT NULL); Bug2: POST /produtos timeout GCS; Bug3: cache invalidation glob; Bug4: preços de planos hardcoded |
| 2026-04-07 | `docs/sessions/2026-04-07/RELATORIO_SESSAO.md` | Fix MRR hardcoded no backend (super-admin.service.ts); Fix CVE-2025-66478/55183/55184 next 16.1.7→16.2.2 |
| 2026-04-08 | `docs/sessions/2026-04-08/RELATORIO.md` | Fix cache invalidatePattern (keyv sem suporte a keys()); Fix CozinhaPageClient não recarregava pedidos ao trocar de aba de ambiente |
| 2026-04-11 | `docs/sessions/2026-04-11/RELATORIO_SESSAO.md` | Fix redirecionamento pós-login por cargo (COZINHEIRO/BARTENDER→operacional); Fix POST /comandas 400 em evento sem PaginaEvento (fallback tenantId via eventoId) |
| 2026-04-19 | `docs/sessions/2026-04-19/RELATORIO_SESSAO.md` | Fix feature gating frontend/backend (tenantId inconsistente em PlanFeaturesController); Migrar features para DB; Fix tenant-provisioning respeitar limites; Fix cache invalidation (trackKey faltante em 4 services) |
| 2026-04-24 | `docs/security-hardening.md` | Sprint 1 Security Hardening: JWT verify() no TenantInterceptor; access_token httpOnly cookie; remoção sessionStorage; middleware JWT real (jose); /health/metrics protegido; ignoreBuildErrors removido |
| 2026-04-24 | `docs/performance.md` | Sprint 2 Performance: Remoção de eager:true (21 JOINs implícitos eliminados em 10 entidades); explicit relations em CaixaService; cache in-memory FeatureGuard (TTL 5min); 7 índices adicionados (caixa, pedido); audit REQUEST scope (todos justificados para multi-tenancy) |
| 2026-04-24 | `docs/scalability.md` | Sprint 3 Escalabilidade: BullMQ para audit logs (async com sync fallback); LoggerService com tenantId estruturado + JSON em prod; TenantLoggingInterceptor enriquecido; Redis e rate limit por tenant já implementados anteriormente |
| 2026-04-24 | `docs/enterprise.md` | Sprint 4 Enterprise: RLS (Row Level Security) com migration + subscriber + middleware feature-flagged; Sentry error tracking com tenant context; CI/CD com job dedicado tenant-isolation; testes E2E reais de isolamento multi-tenant; health check Redis; métricas com feature flags |
| 2026-04-24 | `docs/production-readiness.md` | Sprint 5 Production Readiness: RLS DRY-RUN mode + risk logging; RequestId global middleware; event catalog observabilidade; Sentry enhanced (requestId, role, 409); health checks BullMQ+RLS; Socket.IO Redis adapter multi-node; load tests k6/queue/WS; rls:readiness script; CI gates; docs observability/load-testing/db-checklist |
| 2026-04-24 | `docs/operations.md` | Sprint 6 Operations Hardening: AlertService com threshold rules (500s, queue, RLS, WS, DB, auth, rate-limit) + webhook Slack/Discord; SlowQueryLogger TypeORM (auto-log >200ms + sugestão de índice); GET /internal/status dashboard operacional (DB pool, RLS, tenants, WS metrics, slow queries, alertas, features); WebSocket metrics (connections, auth failures, events); smoke tests pós-deploy (login + endpoints + WS); incident playbook (8 cenários P0-P3); docs operations/performance-monitoring/scale-plan/incidents; CI smoke test pós-deploy |
| 2026-04-24 | `docs/tenant-onboarding-refactor.md` | Sprint 7 Tenant Onboarding Refactor: Wizard multi-step /primeiro-acesso (Empresa→Endereço→Plano→Pagamento→Confirmação); EmailService global com Nodemailer + fallback SKIPPED; PasswordResetService + controller /senha (validar-token, definir, recuperar); PasswordReset entity + migration (nullable, retrocompatível); tenant-provisioning aceita campos V2 (razaoSocial, endereço detalhado) + envia welcome email pós-commit; Super Admin: reenviar email + gerar link senha; /definir-senha frontend com validação de token; env vars EMAIL_ENABLED, SMTP_*, TENANT_ONBOARDING_V2_ENABLED; 17 novos testes (344 total) |
