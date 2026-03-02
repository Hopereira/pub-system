# Changelog — Limpeza Agressiva de Documentação

**Data:** 2026-02-11  
**Política:** Código é verdade absoluta. Docs que não refletem código atual → DELETE.

---

## Resumo

| Ação | Quantidade |
|------|-----------|
| Arquivos **deletados** | 190 |
| Arquivos **reescritos** | 3 |
| Arquivos **criados** | 3 |
| Pastas **deletadas** | 12 |
| Arquivos finais em `docs/` | 11 |

---

## 1. Pastas Deletadas Inteiras

### `docs/archive/` — 136 arquivos → DELETE

| Subpasta | Qtd | Motivo |
|----------|-----|--------|
| `archive/sessoes/` | 58 | Relatos de sessão de dev. Zero valor técnico residual. Bugs já corrigidos, features já implementadas. |
| `archive/analises/` | 44 | Análises pontuais, visões por perfil, relatórios de deploy antigos. Tudo substituído por `current/`. |
| `archive/multi-tenancy-implementacao/` | 20 | Relatos do processo de implementação MT. O código está pronto; docs descrevem processo, não estado. |
| `archive/sprints/` | 9 | Docs de sprints concluídas. Bugs resolvidos, features entregues. |
| `archive/prs/` | 5 | PR descriptions. Efêmeras, sem valor técnico permanente. |

### `docs/manuais/` — 5 arquivos → DELETE

| Arquivo | Motivo |
|---------|--------|
| `SETUP.md` | Substituído por `current/SETUP_LOCAL.md` (mais completo, com Redis, Docker healthcheck) |
| `GUIA-TESTES.md` | Guia de testes manuais genérico. Sem testes automatizados no projeto, sem valor prático. |
| `GUIA-TESTES-FASE1.md` | Testes de fase 1 já concluída. Obsoleto. |
| `GUIA-TESTES-MANUAIS-ADM.md` | Testes manuais de admin. Rascunho sem manutenção. |
| `CONFIGURACAO_EXPIRACAO_TOKEN.md` | Config de token já documentada em `current/SEGURANCA.md`. Duplicata. |

### `docs/tecnico/` — 17 arquivos → DELETE

| Arquivo | Motivo |
|---------|--------|
| `AUDITORIA_APPSEC_MAIN_TS.md` | Auditoria pontual de main.ts. Conteúdo absorvido por `current/SEGURANCA.md`. |
| `AUDITORIA_BUILD_DEPLOY_DOCKER.md` | Auditoria de Docker. Substituído por `current/DEPLOY.md`. |
| `AUDITORIA_DBA_ENTIDADES.md` | Auditoria de entidades. Substituído por `current/ARQUITETURA.md`. |
| `AUDITORIA_DEEP_SCAN_CODIGO.md` | Scan de código pontual. Achados incorporados na auditoria final. |
| `AUDITORIA_DEVOPS_PRODUCAO.md` | Auditoria DevOps. Substituído por `current/DEPLOY.md`. |
| `AUDITORIA_FRONTEND_PEDIDOS.md` | Auditoria frontend pedidos. Substituído por `current/ARQUITETURA.md`. |
| `AUDITORIA_SEGURANCA_CONTROLLERS.md` | Auditoria de segurança. Substituído por `current/SEGURANCA.md`. |
| `AUDITORIA_TIPOS_FRONTEND_BACKEND.md` | Auditoria de tipos. Pontual, sem manutenção. |
| `CONFIGURATION.md` | Config genérica. Substituído por `current/ENV_VARS.md`. |
| `CORRECOES_FINAIS_MIGRATIONS.md` | Correções de migrations já aplicadas. Obsoleto. |
| `DETALHES_TECNICOS_SISTEMA.md` | Detalhes técnicos. Substituído por `current/ARQUITETURA.md`. |
| `DOCUMENTACAO_TECNICA_COMPLETA.md` | Doc técnica antiga. Contradiz código atual em múltiplos pontos. |
| `MIGRATIONS.md` | Guia de migrations. Conteúdo absorvido por `current/SETUP_LOCAL.md`. |
| `PLANO_VALIDACAO_VENDA.md` | Plano de validação já executado. Obsoleto. |
| `SECURITY.md` | Stub de 0.6 KB. Substituído por `current/SEGURANCA.md` (6.6 KB). |
| `SOLUCAO_FINAL_MIGRATIONS.md` | Solução de bug de migration já resolvido. Obsoleto. |
| `SOLUCAO_MIGRATIONS.md` | Idem. Duplicata do anterior. |

### `docs/troubleshooting/` — 18 arquivos → DELETE

| Arquivo | Motivo |
|---------|--------|
| `CORRECAO_COMANDAS_E_CAIXA.md` | Bug corrigido. Código já atualizado. |
| `CORRECAO_DATA_INVALIDA_PEDIDOS.md` | Bug corrigido. |
| `CORRECAO_EMPRESA_SEEDER.md` | Bug corrigido. |
| `CORRECAO_ENTREGA_PEDIDO.md` | Bug corrigido. |
| `CORRECAO_ERRO_LOADPEDIDOS.md` | Bug corrigido. |
| `CORRECAO_ERRO_RETIRADA_DUPLICADA.md` | Bug corrigido. |
| `CORRECAO_MESAS_TEMPORARIAS.md` | Bug corrigido. |
| `CORRECAO_RELATORIO_CHECKIN.md` | Bug corrigido. |
| `CORRECAO_TABELA_TURNOS.md` | Bug corrigido. |
| `CORRECAO_VALIDACAO_MESA.md` | Bug corrigido. |
| `FIX_ATUALIZACAO_DINAMICA_AMBIENTE.md` | Bug corrigido. |
| `FIX_ATUALIZACAO_DINAMICA_CHECK_IN_OUT.md` | Bug corrigido. |
| `FIX_BACKEND_SEARCH_SEM_PEDIDOS.md` | Bug corrigido. |
| `FIX_COMANDA_TOTAL_ZERO.md` | Bug corrigido. |
| `FIX_FINALIZAR_NAO_ATUALIZA.md` | Bug corrigido. |
| `FIX_QUASE_PRONTO_COLUNA_ERRADA.md` | Bug corrigido. |
| `SOLUCAO_COMPLETA_DOCKER_COMPOSE.md` | Solução Docker antiga. Substituído por `current/SETUP_LOCAL.md`. |
| `SOLUCAO_ERRO_MEMORIA.md` | Solução já aplicada no docker-compose.yml. Documentado em `current/TROUBLESHOOTING.md`. |

### `docs/templates/` — 5 arquivos → DELETE

| Arquivo | Motivo |
|---------|--------|
| `API_REFERENCE.md` | Template genérico nunca usado. `current/API.md` já existe. |
| `DEPLOY_GUIDE.md` | Template genérico. `current/DEPLOY.md` já existe. |
| `OPERATIONS_MANUAL.md` | Template genérico. Nunca preenchido. |
| `README_DEVELOPER.md` | Template genérico. `current/README.md` já existe. |
| `ROADMAP.md` | Template de roadmap. Sem uso. |

### `docs/comercial/` — 1 arquivo → DELETE

| Arquivo | Motivo |
|---------|--------|
| `ANALISE_PRONTIDAO_VENDA.md` | Análise comercial/marketing. Sem valor técnico. |

### Pastas vazias → DELETE

| Pasta | Motivo |
|-------|--------|
| `docs/decisions/` | Criada vazia, nunca usada. |
| `docs/runbooks/` | Criada vazia, nunca usada. |

---

## 2. Arquivos Deletados em `docs/relatorios/`

| Arquivo | Motivo |
|---------|--------|
| `AUDITORIA_REPO_CODIGO_VS_DOCS.md` | Substituído por `AUDITORIA_FINAL.md` (mais completo, formato exigido). |
| `CHANGELOG_DOCS_REFATORACAO.md` | Substituído por `CHANGELOG_LIMPEZA_DOCS.md` (este arquivo). |
| `PLANO_REFATORACAO_DOCS.md` | Plano executado. Sem valor residual. |
| `Captura de tela 2025-10-11 175821.png` | Screenshot sem referência. Lixo. |

---

## 3. Arquivos Removidos de `docs/current/`

| Arquivo | Motivo |
|---------|--------|
| `MODULOS.md` | Conteúdo consolidado em `ARQUITETURA.md` (tabela de módulos já existia). |
| `WEBSOCKET.md` | Conteúdo consolidado em `ARQUITETURA.md` (seção WebSocket adicionada). |
| `FRONTEND.md` | Conteúdo consolidado em `ARQUITETURA.md` (seção Frontend adicionada). |
| `MULTI_TENANCY.md` | Conteúdo consolidado em `ARQUITETURA.md` (seção Multi-Tenancy) e `SEGURANCA.md` (seção Isolamento). |

---

## 4. Arquivos Reescritos

| Arquivo | O que mudou |
|---------|------------|
| `current/README.md` | Removidas referências a pastas/docs deletados. Adicionado REGRAS_NEGOCIO.md ao índice. |
| `current/ARQUITETURA.md` | Adicionadas seções Multi-Tenancy, WebSocket e Frontend (consolidação). |
| `current/SEGURANCA.md` | Adicionada seção 9 (Isolamento Multi-Tenant) com tabela de mecanismos. |

---

## 5. Arquivos Criados

| Arquivo | Justificativa |
|---------|--------------|
| `current/REGRAS_NEGOCIO.md` | Exigido pela estrutura. Documenta regras de domínio extraídas dos services. |
| `relatorios/AUDITORIA_FINAL.md` | Relatório de auditoria no formato exigido. |
| `relatorios/CHANGELOG_LIMPEZA_DOCS.md` | Este arquivo. Registro de toda deleção com justificativa. |

---

## 6. Estrutura Final

```
docs/
  current/                    (8 arquivos — fonte de verdade)
    README.md                 Índice mestre
    ARQUITETURA.md            Stack, módulos, entidades, MT, WS, frontend
    SETUP_LOCAL.md            Setup local com Docker
    ENV_VARS.md               Variáveis de ambiente
    API.md                    ~130 endpoints mapeados do código
    REGRAS_NEGOCIO.md         Regras de domínio
    SEGURANCA.md              Auth, JWT, rate limit, audit, isolamento MT
    DEPLOY.md                 Deploy produção
    TROUBLESHOOTING.md        Erros comuns

  relatorios/                 (2 arquivos — auditoria)
    AUDITORIA_FINAL.md        Relatório completo código vs docs
    CHANGELOG_LIMPEZA_DOCS.md Este arquivo

Total: 10 arquivos. Zero duplicata. Zero contradição.
```
