# Arquitetura do Pub System

**Última atualização:** 2026-04-14  
**Fonte da verdade:** `backend/src/app.module.ts`, `docker-compose.yml`, `frontend/src/app/`  
**Status:** Ativo

---

## Visão Macro

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   FRONTEND      │     │   BACKEND        │     │   BANCO         │
│   Next.js 16    │────▶│   NestJS v10/v11 │────▶│   PostgreSQL 15 │
│   :3001         │     │   :3000          │     │   :5432         │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
        │                        │
        │ WebSocket (Socket.IO)  │
        ◀────────────────────────┘
                                 │
                        ┌────────┴─────────┐
                        │   REDIS 7        │
                        │   Cache          │
                        │   :6379          │
                        │  (DEV ONLY)      │
                        └──────────────────┘
```

### Produção

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   VERCEL        │     │   CLOUDFLARE     │     │   ORACLE VM     │
│   Frontend      │────▶│   SSL + CDN      │────▶│   Backend+Nginx │
│   Next.js 16    │     │   Flexível       │     │   NestJS :3000  │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                 ┌────────┴────────┐
                                                 │   PostgreSQL 17 │
                                                 │   Docker local  │
                                                 │   Oracle VM     │
                                                 └─────────────────┘
```

---

## Stack Tecnológica

### Backend
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| NestJS | @nestjs/common@10 / @nestjs/core@11 | Framework principal |
| TypeScript | 5.1.3 | Linguagem |
| TypeORM | 0.3.27 | ORM |
| PostgreSQL | 15 (dev) / 17 (prod) | Banco de dados |
| Socket.IO | 4.7.4 | WebSocket (tempo real) |
| Redis | 7 (alpine) | Cache — apenas desenvolvimento |
| Passport.js | — | Autenticação JWT |
| Swagger | — | Documentação API |
| Helmet | — | Headers de segurança |
| Winston | — | Logging estruturado |
| Google Cloud Storage | 7.19.0 | Upload de imagens |
| Joi | — | Validação de env vars |
| class-validator | — | Validação de DTOs |

### Frontend
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Next.js | 16.2.2 | Framework (App Router + Turbopack) — atualizado CVE-2025-66478 |
| React | 19.1.0 | UI |
| TypeScript | — | Linguagem |
| Tailwind CSS | 4 | Estilização |
| Radix UI + shadcn/ui | — | Componentes |
| Socket.IO Client | 4.8.1 | WebSocket |
| React Hook Form + Zod | 4.1.5 | Formulários |
| Axios | — | HTTP client |
| Lucide | — | Ícones |
| Sonner | — | Toast notifications |

### Infraestrutura
| Serviço | Uso | Custo |
|---------|-----|-------|
| Docker + Docker Compose | Desenvolvimento local | — |
| Vercel (Hobby) | Frontend produção | Gratuito |
| Oracle Cloud (Always Free) | Backend produção | Gratuito |
| PostgreSQL 17 (Docker local) | Banco produção na Oracle VM | Gratuito |
| Cloudflare (Free) | DNS + SSL + CDN | Gratuito |
| Registro.br | Domínio pubsystem.com.br | ~R$40/ano |

---

## Módulos Backend

**Fonte:** `backend/src/app.module.ts`

O sistema é composto por 20 módulos NestJS organizados em `src/modulos/` e `src/common/`:

### Módulos de Negócio (`src/modulos/`)
| Módulo | Controller | Feature Guard | Descrição |
|--------|-----------|---------------|-----------|
| `ambiente` | AmbienteController | — | Ambientes dinâmicos (PREPARO/ATENDIMENTO) |
| `analytics` | AnalyticsController | ANALYTICS (PRO) | Relatórios e métricas avançadas |
| `audit` | AuditController | — | Logs de auditoria |
| `avaliacao` | AvaliacaoController | AVALIACOES (BASIC) | Avaliações de clientes |
| `caixa` | CaixaController | — | Gestão financeira do caixa |
| `cliente` | ClienteController | CLIENTES (BASIC) | CRUD de clientes |
| `comanda` | ComandaController | — | Sistema de comandas |
| `empresa` | EmpresaController | — | Dados do estabelecimento |
| `evento` | EventoController | EVENTOS (BASIC) | Agenda de eventos |
| `funcionario` | FuncionarioController | — | Gestão de funcionários |
| `medalha` | MedalhaController | MEDALHAS (PRO) | Gamificação com medalhas |
| `mesa` | MesaController | — | Gestão de mesas e mapa visual |
| `pagina-evento` | PaginaEventoController | — | Landing pages de eventos |
| `payment` | PaymentController | — | Pagamentos e assinaturas |
| `pedido` | PedidoController + PedidoAnalyticsController | — / ANALYTICS | Sistema de pedidos |
| `plan` | PlanController | — | Gestão de planos de assinatura |
| `ponto-entrega` | PontoEntregaController | PONTOS_ENTREGA (BASIC) | Pontos de entrega |
| `produto` | ProdutoController | — | Cardápio e produtos |
| `turno` | TurnoController | TURNOS (PRO) | Check-in/out de funcionários |

### Módulos de Infraestrutura
| Módulo | Localização | Descrição |
|--------|------------|-----------|
| `auth` | `src/auth/` | JWT, refresh tokens, sessões |
| `cache` | `src/cache/` | Cache com invalidação — keyv in-memory (prod) / Redis (dev) |
| `common/tenant` | `src/common/tenant/` | Multi-tenancy completo |
| `common/logger` | `src/common/logger/` | Winston logging |
| `health` | `src/health/` | Health check (Terminus) |
| `jobs` | `src/jobs/` | Cron jobs (ScheduleModule) |
| `database` | `src/database/` | TypeORM config, seeder, migrations |
| `shared/storage` | `src/shared/storage/` | Google Cloud Storage |

---

## Entidades Principais

**Fonte:** `backend/src/modulos/*/entities/`

| Entidade | Relações principais | Status possíveis |
|----------|-------------------|-----------------|
| **Empresa** | 1:N Ambientes, Funcionários | — |
| **Ambiente** | tipo: PREPARO/ATENDIMENTO; N:1 Empresa | — |
| **Mesa** | N:1 Ambiente (ATENDIMENTO) | LIVRE, OCUPADA, RESERVADA |
| **Funcionario** | N:1 Empresa; cargo (role) | — |
| **Cliente** | 1:N Comandas | — |
| **Produto** | N:1 Ambiente (PREPARO) | — |
| **Comanda** | N:1 Cliente; N:1 Mesa OU PontoEntrega (XOR) | ABERTA, FECHADA, PAGA |
| **ComandaAgregado** | N:1 Comanda | — |
| **Pedido** | N:1 Comanda; 1:N ItemPedido | FEITO, EM_PREPARO, PRONTO, ENTREGUE, CANCELADO |
| **ItemPedido** | N:1 Pedido; N:1 Produto | FEITO, EM_PREPARO, PRONTO, ENTREGUE, CANCELADO, DEIXADO_NO_AMBIENTE |
| **PontoEntrega** | N:1 Ambiente | ativo: boolean |
| **Evento** | 1:N PaginaEvento | — |
| **PaginaEvento** | N:1 Evento | ativa: boolean |
| **Tenant** | 1:N Empresas | ATIVO, SUSPENSO, INATIVO |
| **AberturaCaixa** | N:1 Funcionario | aberto/fechado |
| **Turno** | N:1 Funcionario | check-in/check-out |
| **AuditLog** | N:1 Funcionario | — |
| **Avaliacao** | N:1 Comanda | — |
| **RefreshToken** | N:1 Funcionario | ativo/revogado |

---

## Roles do Sistema

**Fonte:** `backend/src/modulos/funcionario/enums/cargo.enum.ts`

| Role | Escopo | Acesso principal |
|------|--------|-----------------|
| `SUPER_ADMIN` | Plataforma | Gestão de tenants, planos, métricas globais |
| `ADMIN` | Tenant | Acesso total ao estabelecimento |
| `GERENTE` | Tenant | Definido no enum mas **não usado em nenhum @Roles()** |
| `CAIXA` | Tenant | Terminal de caixa, comandas, busca |
| `GARCOM` | Tenant | Pedidos, entregas, ranking |
| `COZINHEIRO` | Tenant | Preparo de pedidos |
| `COZINHA` | Tenant | Alias de COZINHEIRO em alguns controllers |
| `BARTENDER` | Tenant | Preparo de pedidos (bar) |

---

## Planos e Feature Flags

**Fonte:** `backend/src/common/tenant/services/plan-features.service.ts`

| Plano | Features incluídas |
|-------|-------------------|
| FREE | Módulos base (empresa, ambiente, mesa, funcionario, comanda, pedido, produto) |
| BASIC | FREE + CLIENTES, EVENTOS, PONTOS_ENTREGA, AVALIACOES |
| PRO | BASIC + ANALYTICS, TURNOS, MEDALHAS |
| ENTERPRISE | PRO + todas features, limites expandidos |

O `FeatureGuard` bloqueia endpoints de módulos que requerem plano superior ao do tenant.

---

## Fluxo de Pedido (end-to-end)

```
1. Cliente/Garçom cria pedido
   └─ POST /pedidos (funcionário) ou POST /pedidos/cliente (público)

2. Backend cria Pedido + ItemPedido
   └─ pedido.service.ts → create()

3. WebSocket emite eventos
   └─ PedidosGateway.emitNovoPedido()
   └─ Eventos: novo_pedido, novo_pedido_ambiente:{id}

4. Painel de preparo recebe notificação
   └─ useAmbienteNotification hook → som + destaque visual

5. Cozinha/Bar atualiza status
   └─ PATCH /pedidos/item/:id/status → EM_PREPARO → PRONTO

6. Garçom retira item pronto
   └─ PATCH /pedidos/item/:id/retirar

7. Item entregue ao cliente
   └─ PATCH /pedidos/item/:id/marcar-entregue

8. Comanda fechada no caixa
   └─ PATCH /comandas/:id/fechar → registra venda + libera mesa
```

---

## Multi-Tenancy

**Fonte:** `backend/src/common/tenant/`

### Modelo
- Banco compartilhado, schema compartilhado — todas tabelas têm coluna `tenantId`
- `TenantInterceptor` (global) injeta `tenantId` em todas queries automaticamente
- `TenantGuard` (global) valida que tenant existe e está ATIVO
- `TenantContextService` armazena `tenantId` no contexto da requisição
- WebSocket isolado por rooms: `tenant_{tenantId}`

### Provisioning
`POST /registro` cria em uma transação: Tenant → Empresa → Ambientes padrão → Mesas → Admin.

### Planos e Features
| Plano | Features |
|-------|----------|
| FREE | empresa, ambiente, mesa, funcionario, comanda, pedido, produto |
| BASIC | FREE + CLIENTES, EVENTOS, PONTOS_ENTREGA, AVALIACOES |
| PRO | BASIC + ANALYTICS, TURNOS, MEDALHAS |
| ENTERPRISE | PRO + tudo, limites expandidos |

`FeatureGuard` + `@RequireFeature(Feature.X)` bloqueia endpoints de módulos fora do plano.

### Gestão (Super Admin)
`/super-admin/*` — listar, criar, suspender, reativar, deletar tenants, alterar planos, reset senha admin.

---

## WebSocket (Socket.IO)

**Fonte:** `backend/src/modulos/pedido/pedidos.gateway.ts`, `backend/src/modulos/turno/turno.gateway.ts`

### Gateways
| Gateway | Descrição |
|---------|-----------|
| PedidosGateway | Pedidos, comandas, caixa |
| TurnoGateway | Turnos de funcionários |

Ambos herdam `BaseTenantGateway` — isolamento por room `tenant_{tenantId}`.

### Eventos Server → Client
| Evento | Quando |
|--------|--------|
| `novo_pedido` | Pedido criado |
| `novo_pedido_ambiente:{ambienteId}` | Pedido com itens para ambiente específico |
| `status_atualizado` | Status de pedido/item muda |
| `status_atualizado_ambiente:{ambienteId}` | Status muda em ambiente específico |
| `comanda_atualizada` | Comanda atualizada |
| `nova_comanda` | Comanda criada |
| `caixa_atualizado` | Movimentação no caixa |

### Eventos Client → Server
| Evento | Efeito |
|--------|--------|
| `join_comanda` | Entra no room `comanda_{id}` (QR Code público) |
| `leave_comanda` | Sai do room |

### Hook Frontend
`useAmbienteNotification(ambienteId)` — conecta WebSocket, filtra por ambiente, toca som, destaca pedido 5s.

---

## Frontend

**Fonte:** `frontend/src/app/`, `frontend/src/middleware.ts`

### Stack
Next.js 16 (App Router + Turbopack), React 19, Tailwind CSS 4, shadcn/ui, Socket.IO Client, React Hook Form + Zod, Axios.

### Rotas principais
| Rota | Auth | Descrição |
|------|------|-----------|
| `/` | Pública | Login |
| `/comanda/[id]` | Pública | QR Code comanda |
| `/cardapio` | Pública | Cardápio público |
| `/entrada/[eventoId]` | Pública | Formulário de entrada em evento (cria comanda pública) |
| `/portal-cliente/[comandaId]` | Pública | Hub do cliente pós-entrada |
| `/recuperar-comanda` | Pública | Recuperar comanda por código/CPF |
| `/dashboard` | JWT | Dashboard principal (ADMIN/GERENTE) |
| `/caixa` | CAIXA | Terminal de caixa |
| `/garcom` | GARCOM | Interface do garçom |
| `/dashboard/operacional/[ambienteId]` | COZINHEIRO/BARTENDER | Painel Kanban preparo |
| `/dashboard/comandas` | ADMIN/CAIXA | Gestão comandas |
| `/dashboard/cardapio` | ADMIN | Gestão produtos |
| `/dashboard/relatorios` | ADMIN | Analytics |
| `/super-admin` | SUPER_ADMIN | Gestão plataforma |

### Middleware (`frontend/src/middleware.ts`)

**Proteção de rotas autenticadas:**
- Matcher inclui `/dashboard/:path*`
- Verifica cookie `authSession` (não httpOnly, gerenciado pelo `AuthContext`)
- Redireciona para `/login` se o cookie estiver ausente
- **Nota:** verifica apenas presença do cookie — validação real do JWT ocorre no `AuthContext` e nas chamadas à API

**Roteamento multi-tenant:**
Detecta subdomínio e reescreve para `/t/[slug]`:
```
casarao-pub.pubsystem.com.br/ → /t/casarao-pub
```

**Hosts ignorados (sem rewrite):** `localhost`, `*.pubsystem.com.br`, `*.vercel.app` (incluindo previews do Vercel — fix 2026-04-11).

### Services
Cada módulo backend tem um service correspondente em `frontend/src/services/` usando Axios com interceptor JWT automático.
