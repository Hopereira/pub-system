# Convenção de Sessões — Pub System

**Última atualização:** 2026-04-14

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
