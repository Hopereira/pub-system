# Convenção de Sessões — Pub System

**Última atualização:** 2026-04-05

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
| 2026-04-05 | `docs/sessions/2026-04-05/RELATORIO_SESSAO.md` | Fix 500 em POST /pontos-entrega — empresa_id NOT NULL no banco |
