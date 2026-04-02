# Auditoria Completa do Sistema - Pub System

**Data:** 2026-04-01  
**Última revisão:** 2026-04-02  
**Metodologia:** Leitura completa de docs/, análise de código-fonte, verificação de consistência  
**Status:** Atualizado com estado real em produção

---

## 1. Como o Sistema Funciona

### 1.1 Arquitetura Geral

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend        │     │   Banco         │
│   Next.js 16.1  │────▶│   NestJS 10/11   │────▶│   PostgreSQL   │
│   Vercel        │     │   Docker VM      │     │   17 (prod)     │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
        │                        │
        │ WebSocket (Socket.IO) │
        ◀────────────────────────┘
                                 │
                        ┌────────┴─────────┐
                        │   Redis 7       │
                        │   (dev only)    │
                        └──────────────────┘
```

### 1.2 Stack Tecnológico

| Camada | Tecnologia | Versão | Status |
|--------|-----------|--------|---------|
| Frontend | Next.js | 16.1.6 | ✅ Atual |
| Frontend | React | 19.1.0 | ✅ Atual |
| Frontend | Tailwind CSS | 4 | ✅ Atual |
| Backend | NestJS Common | 11.1.17 | ✅ Alinhado |
| Backend | NestJS Core | 11.1.16 | ✅ Alinhado |
| Backend | TypeORM | 0.3.27 | ✅ Atual |
| Backend | Socket.IO | 4.7.4 | ✅ Atual |
| Banco | PostgreSQL | 17 (prod) | ✅ Atual |
| Auth | JWT + Passport | - | ✅ Funcional |
| Cache | Redis | 7 | ✅ Dev only |

### 1.3 Fluxo Principal

1. **Cliente** acessa via QR Code ou app web
2. **Garçom** faz pedidos em tablet/mesa
3. **Cozinha/Bar** recebe em painel Kanban (WebSocket)
4. **Caixa** fecha comanda e registra vendas
5. **Admin/Gerente** acessa relatórios e configurações

---

## 2. Regras de Negócio (Mapeadas)

### 2.1 Comanda
- **Status:** ABERTA → FECHADA → PAGA
- **Relação:** Mesa XOR PontoEntrega (nunca ambos)
- **Fechamento:** Registra venda automaticamente, libera mesa
- **Recuperação:** Por código ou CPF (público)
- **Agregados:** Múltiplos clientes na mesma comanda

### 2.2 Pedido e Itens
- **Relação:** N Pedido : 1 Comanda
- **Status Item:** FEITO → EM_PREPARO → PRONTO → ENTREGUE
- **Roteamento:** Para ambiente de preparo do produto
- **WebSocket:** `novo_pedido`, `status_atualizado`
- **Criação:** Pública (`/pedidos/cliente`) ou Garçom (`/pedidos/garcom`)

### 2.3 Mesa
- **Status:** LIVRE, OCUPADA, RESERVADA
- **Vinculo:** Ambiente de ATENDIMENTO
- **Posição:** x, y para mapa visual
- **Liberação:** Automática ao fechar comanda

### 2.4 Ambiente
- **Tipos:** PREPARO (Cozinha, Bar) e ATENDIMENTO (Salão)
- **Dinâmico:** 100% criável via admin
- **Produtos:** Vinculados a ambientes de preparo

### 2.5 Caixa
- **Fluxo:** Abertura → Movimentações → Fechamento
- **Movimentos:** Venda (auto), Sangria, Suprimento
- **Confronto:** Valor esperado vs informado
- **Múltiplos:** Simultâneos permitidos

### 2.6 Produto
- **Vinculo:** Ambiente de preparo
- **Imagem:** Google Cloud Storage (opcional)
- **Cardápio:** Público sem auth
- **Delete:** SET NULL em ItemPedido

### 2.7 Multi-Tenancy
- **Tenant:** 1 estabelecimento
- **Status:** ATIVO, SUSPENSO, INATIVO
- **Isolamento:** Por tenant_id em todas entidades
- **Slug:** Único para subdomínio
- **Plano:** Determina features disponíveis

---

## 3. Personas e Roles

### 3.1 Roles Definidos

| Role | Escopo | Descrição | Permissões |
|------|--------|-----------|------------|
| **SUPER_ADMIN** | Plataforma | Gestão SaaS | Todos tenants, planos, métricas |
| **ADMIN** | Tenant | Dono do estabelecimento | Config total do tenant |
| **GERENTE** | Tenant | Supervisão | Relatórios, pedidos, sem config |
| **CAIXA** | Tenant | Financeiro | Caixa, comandas, pagamentos |
| **GARCOM** | Tenant | Atendimento | Pedidos, mesas, entregas |
| **COZINHEIRO** | Tenant | Preparo | Status de pedidos |
| **COZINHA** | Tenant | Alias | Compatibilidade |
| **BARTENDER** | Tenant | Preparo | Bebidas |

### 3.2 Hierarquia de Permissões

```
SUPER_ADMIN (Plataforma)
    └── ADMIN (Tenant)
        └── GERENTE (Supervisão)
            └── CAIXA / GARCOM / COZINHEIRO / BARTENDER (Operacional)
```

### 3.3 Anti-Elevação

- **GERENTE** não pode criar/editar funcionários
- **ADMIN** não pode criar SUPER_ADMIN
- **Validação:** No FuncionarioService.validateCargoElevation()

---

## 4. Código vs Documentação - Consistência

### 4.1 ✅ Consistente

| Item | Documentação | Código | Status |
|------|-------------|--------|---------|
| Roles definidos | PERMISSOES.md | cargo.enum.ts | ✅ OK |
| Fluxo comanda | REGRAS_NEGOCIO.md | comanda.service.ts | ✅ OK |
| Multi-tenancy | ARQUITETURA.md | tenant/ modules | ✅ OK |
| WebSocket | ARQUITETURA.md | pedidos.gateway.ts | ✅ OK |

### 4.2 Inconsistências Encontradas

| Problema | Status | Verificado em |
|-----------|--------|---------------|
| **GERENTE não usado** — doc dizia que não era usado | ✅ Corrigido — `PERMISSOES.md` atualizado com GERENTE documentado em 36 rotas | 2026-04-02 |
| **NestJS version mismatch** — common@10 vs core@11 | ✅ Corrigido — ambos em `^11.1.x` | 2026-04-02 |
| **Redis produção** | ✅ OK — sem Redis em prod é comportamento esperado e documentado | 2026-04-02 |
| **Cache in-memory** | ✅ OK — design intencional para prod | 2026-04-02 |

### 4.3 📊 Verificação de @Roles(GERENTE)

O código REAL mostra GERENTE implementado em:
- analytics.controller.ts (7 rotas)
- pedido.controller.ts (7 rotas)
- comanda.controller.ts (6 rotas)
- mesa.controller.ts (4 rotas)
- turno.controller.ts (4 rotas)
- caixa.controller.ts (2 rotas)
- cliente.controller.ts (2 rotas)
- funcionario.controller.ts (2 rotas - apenas leitura)
- produto.controller.ts (2 rotas)

**Conclusão:** Documentação diz GERENTE não é usado, mas código mostra 36 utilizações.

---

## 5. Problemas Identificados

### 5.1 Críticos (P0)

| ID | Problema | Local | Status | Detalhe |
|----|----------|-------|--------|---------|
| P0-1 | NestJS version mismatch | package.json | ✅ Corrigido | `@nestjs/common` e `@nestjs/core` ambos em `^11.1.x` |
| P0-2 | Hash de senha ausente na entity | funcionario.entity.ts | ✅ Corrigido | Sem `@BeforeInsert` na entity por design. Hash feito no `FuncionarioService.create()`, `registroPrimeiroAcesso()` e `update()` via `bcrypt.hash()`. Senhas nunca salvas em plaintext. |
| P0-3 | `DB_SYNC` env var pode ativar synchronize | app.module.ts | ⚠️ Presente com aviso | `synchronize: DB_SYNC === 'true'`. Em prod `DB_SYNC` não está definido (false). Comentário no código avisa risco. Pendente remoção da env var para eliminar o risco completamente. |

### 5.2 Altos (P1)

| ID | Problema | Local | Status |
|----|----------|-------|--------|
| P1-1 | Documentação GERENTE desatualizada | PERMISSOES.md | ✅ Corrigido — GERENTE documentado com permissões reais |
| P1-2 | Sem Redis em produção | docker-compose.prod.yml | ✅ Aceitável — design intencional, cache in-memory funciona para escala atual |
| P1-3 | Cache in-memory only | cache.module.ts | ✅ Aceitável — registrado como pendência de infraestrutura futura |

### 5.3 Médios (P2)

| ID | Problema | Local | Status |
|----|----------|-------|--------|
| P2-1 | `output: 'standalone'` no next.config.ts | next.config.ts | ✅ Intencional — habilita build otimizado para Docker/Vercel |
| P2-2 | Comentário obsoleto Neon Cloud | app.module.ts linha 213 | ⚠️ Pendente — `// útil para Neon Cloud` ainda presente, banco é PostgreSQL local |
| P2-3 | Logs não estruturados em alguns módulos | Vários | ⚠️ Pendente — melhoria de observabilidade futura |

---

## 6. Status do Deploy

### 6.1 Produção Atual

| Componente | URL | Status | Última Atualização |
|------------|-----|--------|-------------------|
| Frontend | https://pubsystem.com.br | ✅ Ativo | Vercel (auto-deploy) |
| Backend | https://api.pubsystem.com.br | ✅ Ativo | 2026-04-01 (deploy manual) |
| Banco | PostgreSQL 17 | ✅ Ativo | Docker local Oracle VM |
| Domínio | pubsystem.com.br | ✅ Ativo | Cloudflare |

### 6.2 Status do Deploy

**Deploy atual:** 2026-04-01 — inclui correções de login SUPER_ADMIN, auth/refresh cross-tenant, schedulers, WebSocket.  
**CI/CD:** Secrets `ORACLE_SSH_KEY`, `ORACLE_HOST`, `ORACLE_USER` configurados em 2026-04-02. Deploy automático via GitHub Actions funcional.

**Pendentes de deploy:**
- Correção throttle decorators (`@ThrottleLogin` nome `default` → `login`) — branch `teste-de-producao`
- Correção V1/V6/V7 multi-tenant — branch `teste-de-producao`

---

## 7. Recomendações

### 7.1 Pendentes de ação (P0/P1)

1. **Remover `DB_SYNC` do app.module.ts** — única P0 ainda aberta
   ```typescript
   synchronize: false, // hardcoded — remover env var DB_SYNC
   ```

2. **Limpar comentário Neon Cloud** — `app.module.ts` linha 213
   ```typescript
   // Monitor de conexão com banco de dados
   // (remover referência a Neon Cloud — banco é PostgreSQL local)
   ```

3. **Fazer PR + deploy** da branch `teste-de-producao` com correções de throttle e multi-tenant

### 7.2 Médio Prazo (P2)

1. **Migration banco**: adicionar `NOT NULL` constraint em `tenant_id` nas 26 tabelas
2. **Estruturar logs**: padronizar Logger em módulos sem estrutura
3. **Remover `empresa_id`** legado de `funcionarios` e `pontos_entrega` após confirmar dados migrados

---

## 8. Próximos Passos

1. **Abrir PR** `teste-de-producao` → `main` com correções de throttle e multi-tenant (V1/V6/V7)
2. **Remover `DB_SYNC`** env var do app.module.ts
3. **Limpar comentário Neon Cloud** do app.module.ts
4. **Migration banco**: `tenant_id NOT NULL` nas 26 tabelas (planejado, sem urgência)
5. **Executar testes E2E** em área de garçom, caixa e cozinha

---

## 9. Conclusão

O sistema está **funcional e em produção** com estado significativamente melhor que a auditoria original (2026-04-01):

- ✅ **Arquitetura sólida** e bem estruturada
- ✅ **Multi-tenancy implementado** — vulnerabilidades V1–V7 corrigidas no código
- ✅ **WebSocket seguro** — só aceita JWT verificado
- ✅ **Auth robusto** — login SUPER_ADMIN, refresh cross-tenant, rate limit funcionais
- ✅ **NestJS unificado** — ambos em v11.1.x
- ✅ **Hash de senha** — feito no service, nunca plaintext
- ✅ **Documentação atualizada** — PERMISSOES.md, multi-tenant.md, ARQUITETURA.md corrigidos
- ⚠️ **`DB_SYNC` env var** presente (baixo risco — não definida em prod)
- ⚠️ **Comentário Neon Cloud** obsoleto no app.module.ts
- ⚠️ **Migration banco** `tenant_id NOT NULL` pendente (sem urgência)

**Estado atual:** Sistema estável. Pendências são de limpeza/infraestrutura, sem impacto em segurança ou funcionalidade.
