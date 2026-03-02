# 📚 Índice Geral da Documentação - Pub System

**Última atualização:** 18/12/2025  
**Organizado por:** Technical Writer

---

## 📁 Estrutura de Pastas

```
pub-system/
├── README.md                    # Cartão de visita do projeto
└── docs/
    ├── INDICE_GERAL.md          # Este arquivo
    ├── INDICE.md                # Índice das visões por perfil
    ├── README.md                # Visão geral da documentação
    │
    ├── 00-10-*.md               # Documentação principal (visões)
    │
    ├── manuais/                 # Guias definitivos
    │   ├── SETUP.md
    │   ├── GUIA-TESTES-FASE1.md
    │   └── CONFIGURACAO_EXPIRACAO_TOKEN.md
    │
    ├── tecnico/                 # Arquitetura e migrations
    │   ├── MIGRATIONS.md
    │   ├── SECURITY.md
    │   ├── DOCUMENTACAO_TECNICA_COMPLETA.md
    │   └── ...
    │
    ├── troubleshooting/         # Soluções de problemas (FIX_, CORRECAO_)
    │   ├── SOLUCAO_ERRO_MEMORIA.md
    │   ├── FIX_COMANDA_TOTAL_ZERO.md
    │   └── ...
    │
    ├── relatorios/              # PRs, checklists, relatórios
    │   ├── RELATORIO_VALIDACAO_VENDA.md
    │   ├── PR_227_PAGAMENTO_COMANDA.md
    │   └── ...
    │
    └── historico/               # Logs de sessão antigos
        ├── RESUMO_SESSAO_*.md
        └── ...
```

---

## 🎯 Por Onde Começar?

### Se você é **novo no projeto**:
1. [README.md](./README.md) - Visão geral
2. [01-VISAO-GERAL-SISTEMA.md](./01-VISAO-GERAL-SISTEMA.md) - Arquitetura
3. [manuais/SETUP.md](./manuais/SETUP.md) - Como configurar

### Se você quer fazer **deploy em produção**:
1. [DEPLOY_ORACLE_CLOUD.md](./DEPLOY_ORACLE_CLOUD.md) - Guia completo Oracle Cloud ✨

### Se você é **desenvolvedor**:
1. [tecnico/MIGRATIONS.md](./tecnico/MIGRATIONS.md) - Banco de dados
2. [tecnico/DOCUMENTACAO_TECNICA_COMPLETA.md](./tecnico/DOCUMENTACAO_TECNICA_COMPLETA.md)
3. [08-ANALISE-GAPS-MELHORIAS-ATUALIZADA.md](./08-ANALISE-GAPS-MELHORIAS-ATUALIZADA.md) - O que falta

### Se você quer ver a **Sprint 3-4 (Segurança)**:
1. [2025-12-17-SPRINT-3-4-PARTE-1-REFRESH-TOKENS.md](./2025-12-17-SPRINT-3-4-PARTE-1-REFRESH-TOKENS.md) - Refresh Tokens
2. [2025-12-17-SPRINT-3-4-PARTE-2-AUDITORIA.md](./2025-12-17-SPRINT-3-4-PARTE-2-AUDITORIA.md) - Auditoria
3. [2025-12-17-SPRINT-3-4-PARTE-3-RATE-LIMITING.md](./2025-12-17-SPRINT-3-4-PARTE-3-RATE-LIMITING.md) - Rate Limiting
4. [RELATORIO-VALIDACAO-SPRINT-3-4.md](./RELATORIO-VALIDACAO-SPRINT-3-4.md) - Relatório de Validação

### Se você está **debugando um erro**:
1. Procure em [troubleshooting/](./troubleshooting/) por arquivos `FIX_` ou `CORRECAO_`
2. Use `Ctrl+F` para buscar o erro específico

### Se você quer ver o **histórico de mudanças**:
1. [historico/](./historico/) - Resumos de sessões antigas
2. [relatorios/](./relatorios/) - PRs e relatórios

---

## 📊 Documentação por Perfil de Usuário

| Perfil | Documento |
|--------|-----------|
| **Visão Geral** | [01-VISAO-GERAL-SISTEMA.md](./01-VISAO-GERAL-SISTEMA.md) |
| **Admin Sistema** | [02-VISAO-ADMINISTRADOR-SISTEMA.md](./02-VISAO-ADMINISTRADOR-SISTEMA.md) |
| **Admin Pub** | [03-VISAO-ADMINISTRADOR-PUB.md](./03-VISAO-ADMINISTRADOR-PUB.md) |
| **Garçom** | [04-VISAO-GARCOM.md](./04-VISAO-GARCOM.md) |
| **Caixa** | [05-VISAO-CAIXA.md](./05-VISAO-CAIXA.md) |
| **Cozinha** | [06-VISAO-COZINHA.md](./06-VISAO-COZINHA.md) |
| **Cliente** | [07-VISAO-CLIENTE.md](./07-VISAO-CLIENTE.md) |

---

## 📁 Conteúdo das Pastas

### 📘 `manuais/` (3 arquivos)
Guias definitivos para configuração e uso do sistema.

| Arquivo | Descrição |
|---------|-----------|
| `SETUP.md` | Guia completo de instalação |
| `GUIA-TESTES-FASE1.md` | Como testar o sistema |
| `CONFIGURACAO_EXPIRACAO_TOKEN.md` | Configuração de JWT |

### 🔧 `tecnico/` (10 arquivos)
Documentação técnica, arquitetura e migrations.

| Arquivo | Descrição |
|---------|-----------|
| `MIGRATIONS.md` | Guia de migrations do banco |
| `SECURITY.md` | Políticas de segurança |
| `DOCUMENTACAO_TECNICA_COMPLETA.md` | Arquitetura detalhada |
| `AUDITORIA_CAIXA_SERVICE.md` | Auditoria QA do módulo de caixa |
| `AUDITORIA_SEGURANCA_CONTROLLERS.md` | Auditoria de segurança dos controllers |
| `AUDITORIA_DBA_ENTIDADES.md` | Auditoria DBA das entidades TypeORM |
| `AUDITORIA_FRONTEND_PEDIDOS.md` | Auditoria Frontend - Integração e UX |
| `AUDITORIA_TIPOS_FRONTEND_BACKEND.md` | Comparação de tipos Frontend vs Backend |
| `AUDITORIA_DEVOPS_PRODUCAO.md` | Segurança para produção - variáveis e CORS |
| `AUDITORIA_BUILD_DEPLOY_DOCKER.md` | Otimização de Docker e Multi-Stage Build |
| `AUDITORIA_APPSEC_MAIN_TS.md` | Segurança AppSec - Helmet, Rate Limit, Validation |

### 🔐 Sprint 3-4: Segurança e Auditoria (18 Dez 2025) 🆕

| Arquivo | Descrição |
|---------|-----------|
| `2025-12-17-SPRINT-3-4-PLANEJAMENTO.md` | Planejamento completo da sprint |
| `2025-12-17-SPRINT-3-4-PARTE-1-REFRESH-TOKENS.md` | Implementação de Refresh Tokens |
| `2025-12-17-SPRINT-3-4-PARTE-2-AUDITORIA.md` | Sistema de Auditoria completo |
| `2025-12-17-SPRINT-3-4-PARTE-3-RATE-LIMITING.md` | Rate Limiting com decorators |
| `RELATORIO-VALIDACAO-SPRINT-3-4.md` | Relatório final de validação ✨ |

### `troubleshooting/` (18 arquivos)
Soluções para problemas conhecidos. **Ouro puro!**

| Prefixo | Quantidade | Descrição |
|---------|------------|-----------|
| `FIX_` | 6 | Correções de bugs |
| `CORRECAO_` | 10 | Correções documentadas |
| `SOLUCAO_` | 2 | Soluções de problemas |

### 📊 `relatorios/` (13 arquivos)
PRs, checklists e relatórios de validação.

| Prefixo | Quantidade | Descrição |
|---------|------------|-----------|
| `PR_` | 4 | Descrições de Pull Requests |
| `RELATORIO_` | 5 | Relatórios de validação |
| `CHECKLIST_` | 3 | Checklists de testes |

### 📜 `historico/` (58 arquivos)
Logs de sessões antigas. Útil para contexto histórico.

---

## 🔍 Busca Rápida

**Erro de memória?** → `troubleshooting/SOLUCAO_ERRO_MEMORIA.md`  
**Problema com Docker?** → `troubleshooting/SOLUCAO_COMPLETA_DOCKER_COMPOSE.md`  
**Migrations não rodam?** → `tecnico/MIGRATIONS.md`  
**Como configurar?** → `manuais/SETUP.md`  
**Deploy Oracle Cloud?** → `DEPLOY_ORACLE_CLOUD.md`  
**Refresh Tokens?** → `2025-12-17-SPRINT-3-4-PARTE-1-REFRESH-TOKENS.md` 🆕  
**Auditoria?** → `2025-12-17-SPRINT-3-4-PARTE-2-AUDITORIA.md` 🆕  
**Rate Limiting?** → `2025-12-17-SPRINT-3-4-PARTE-3-RATE-LIMITING.md` 🆕  

---

*Documentação organizada em 18/12/2025*
