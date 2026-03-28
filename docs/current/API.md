# API Reference — Pub System

**Última atualização:** 2026-02-11  
**Fonte da verdade:** Todos os `*.controller.ts` em `backend/src/`  
**Status:** Ativo  
**Swagger UI:** `http://localhost:3000/api` (apenas em dev)

---

## Convenções

- **Base URL:** `http://localhost:3000` (dev) / `https://api.pubsystem.com.br` (prod)
- **Auth:** `Authorization: Bearer <access_token>` para rotas protegidas
- **Tenant:** Resolvido automaticamente via JWT (campo `tenantId`)
- **Paginação:** `?page=1&limit=20&sortBy=criadoEm&sortOrder=DESC`
- **UUID:** Todos os IDs são UUID v4, validados com `ParseUUIDPipe`
- **Erros:** Formato `{ statusCode, message, error }`

### Legenda
- 🔓 Público (sem autenticação)
- 🔒 JWT obrigatório
- 👑 SUPER_ADMIN
- 🛡️ Feature Guard (requer plano específico)

---

## Auth (`/auth`)

**Fonte:** `backend/src/auth/auth.controller.ts`

| Método | Rota | Auth | Rate Limit | Descrição |
|--------|------|------|-----------|-----------|
| POST | `/auth/login` | 🔓 | ThrottleLogin (5/min) | Login → `{ access_token }` (refresh_token em cookie httpOnly `path=/auth`) |
| POST | `/auth/refresh` | 🔓 | ThrottleAPI (30/min) | Renovar access token (lê refresh_token do cookie httpOnly) |
| POST | `/auth/logout` | 🔒 | ThrottleAPI | Logout + revogar refresh token |
| POST | `/auth/logout-all` | 🔒 | ThrottleStrict | Revogar todas as sessões |
| GET | `/auth/sessions` | 🔒 | ThrottleAPI | Listar sessões ativas |
| DELETE | `/auth/sessions/:id` | 🔒 | ThrottleAPI | Revogar sessão específica |

---

## Setup (`/setup`)

**Fonte:** `backend/src/auth/create-super-admin.controller.ts`

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/setup/super-admin` | 🔓 | Criar SUPER_ADMIN (**⚠️ remover em prod**) |

---

## Registro Público (`/registro`)

**Fonte:** `backend/src/common/tenant/controllers/public-registration.controller.ts`

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/registro/verificar-slug?slug=x` | 🔓 | Verificar disponibilidade de slug |
| GET | `/registro/gerar-slug?nome=x` | 🔓 | Gerar slug a partir do nome |
| POST | `/registro` | 🔓 | Registrar novo pub (provisioning completo) |
| GET | `/registro/tenant/:slug` | 🔓 | Info pública de tenant por slug |

---

## Super Admin (`/super-admin`)

**Fonte:** `backend/src/common/tenant/controllers/super-admin.controller.ts`

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/super-admin/metrics` | 👑 | Métricas globais da plataforma |
| GET | `/super-admin/tenants` | 👑 | Listar todos os tenants |
| GET | `/super-admin/tenants/:id` | 👑 | Detalhes de um tenant |
| POST | `/super-admin/tenants` | 👑 | Criar tenant |
| POST | `/super-admin/tenants/:id/suspend` | 👑 | Suspender tenant |
| POST | `/super-admin/tenants/:id/reactivate` | 👑 | Reativar tenant |
| PATCH | `/super-admin/tenants/:id/plan` | 👑 | Alterar plano |
| GET | `/super-admin/slugs/:slug/available` | 👑 | Verificar slug |
| PUT | `/super-admin/tenants/:id` | 👑 | Atualizar dados do tenant |
| POST | `/super-admin/tenants/:id/reset-admin-password` | 👑 | Reset senha admin |
| GET | `/super-admin/tenants/:id/funcionarios` | 👑 | Listar funcionários do tenant |
| DELETE | `/super-admin/tenants/:id` | 👑 | Soft delete tenant |
| DELETE | `/super-admin/tenants/:id/hard` | 👑 | Hard delete (**irreversível**) |

---

## Plan Features (`/plan`)

**Fonte:** `backend/src/common/tenant/controllers/plan-features.controller.ts`

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/plan/features` | 🔒 | Features do plano atual do tenant |
| GET | `/plan/compare` | 🔒 | Comparação entre planos |

---

## Plans (`/plans`)

**Fonte:** `backend/src/modulos/plan/plan.controller.ts`

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/plans/public` | 🔓 | Planos para landing page |
| GET | `/plans/features` | 🔓 | Todas features disponíveis |
| GET | `/plans` | 👑 | Listar todos planos |
| GET | `/plans/:id` | 👑 | Buscar plano por ID |
| POST | `/plans` | 👑 | Criar plano |
| PATCH | `/plans/:id` | 👑 | Atualizar plano |
| DELETE | `/plans/:id` | 👑 | Desativar plano |

---

## Payments (`/payments`)

**Fonte:** `backend/src/modulos/payment/payment.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| POST | `/payments/webhooks/:gateway` | 🔓 | — | Webhook de gateways |
| GET | `/payments/gateways` | 🔒 | — | Gateways disponíveis |
| POST | `/payments/checkout` | 🔒 | ADMIN | Criar checkout upgrade |
| POST | `/payments/subscription` | 🔒 | ADMIN | Criar assinatura |
| GET | `/payments/subscription` | 🔒 | ADMIN | Assinatura ativa |
| POST | `/payments/subscription/cancel` | 🔒 | ADMIN | Cancelar assinatura |
| GET | `/payments/transactions` | 🔒 | ADMIN | Histórico transações |
| GET | `/payments/admin/configs` | 👑 | — | Configs de gateway |
| PUT | `/payments/admin/configs/:gateway` | 👑 | — | Atualizar config |

---

## Empresa (`/empresa`)

**Fonte:** `backend/src/modulos/empresa/empresa.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| POST | `/empresa` | 🔒 | ADMIN | Criar empresa |
| GET | `/empresa` | 🔒 | ADMIN | Buscar dados |
| PATCH | `/empresa/:id` | 🔒 | ADMIN | Atualizar |

---

## Ambientes (`/ambientes`)

**Fonte:** `backend/src/modulos/ambiente/ambiente.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| GET | `/ambientes/debug/tenant-info` | 🔒 | ADMIN | Debug tenant |
| POST | `/ambientes` | 🔒 | ADMIN | Criar |
| GET | `/ambientes` | 🔒 | ADMIN+ | Listar todos |
| GET | `/ambientes/:id` | 🔒 | ADMIN+ | Buscar por ID |
| PUT | `/ambientes/:id` | 🔒 | ADMIN | Atualizar |
| DELETE | `/ambientes/:id` | 🔒 | ADMIN | Remover |

---

## Funcionários (`/funcionarios`)

**Fonte:** `backend/src/modulos/funcionario/funcionario.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| GET | `/funcionarios/check-first-access` | 🔓 | — | Verificar primeiro acesso |
| POST | `/funcionarios/registro` | 🔓 | — | Registro primeiro acesso |
| POST | `/funcionarios` | 🔒 | ADMIN | Criar funcionário |
| GET | `/funcionarios` | 🔒 | ADMIN | Listar todos |
| GET | `/funcionarios/meu-perfil` | 🔒 | — | Próprio perfil |
| PATCH | `/funcionarios/alterar-senha` | 🔒 | — | Alterar própria senha |
| PATCH | `/funcionarios/meu-perfil` | 🔒 | — | Atualizar próprio perfil |
| PATCH | `/funcionarios/upload-foto` | 🔒 | — | Upload foto própria |
| GET | `/funcionarios/:id` | 🔒 | ADMIN | Buscar por ID |
| PATCH | `/funcionarios/:id` | 🔒 | ADMIN | Atualizar |
| DELETE | `/funcionarios/:id` | 🔒 | ADMIN | Remover |
| PATCH | `/funcionarios/:id/upload-foto` | 🔒 | ADMIN | Upload foto (admin) |

---

## Mesas (`/mesas`)

**Fonte:** `backend/src/modulos/mesa/mesa.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| GET | `/mesas/publicas/livres` | 🔓 | — | Mesas livres (cliente) |
| POST | `/mesas` | 🔒 | ADMIN | Criar |
| GET | `/mesas` | 🔒 | — | Listar todas |
| GET | `/mesas/ambiente/:ambienteId` | 🔒 | ADMIN/GARCOM | Por ambiente |
| GET | `/mesas/:id` | 🔒 | — | Por ID |
| PATCH | `/mesas/:id` | 🔒 | ADMIN | Atualizar |
| DELETE | `/mesas/:id` | 🔒 | ADMIN | Remover |
| GET | `/mesas/mapa/visualizar` | 🔒 | ADMIN/GARCOM/CAIXA | Mapa visual |
| PUT | `/mesas/:id/posicao` | 🔒 | ADMIN | Atualizar posição |
| PUT | `/mesas/posicoes/batch` | 🔒 | ADMIN | Batch posições |

---

## Clientes (`/clientes`) 🛡️ CLIENTES

**Fonte:** `backend/src/modulos/cliente/cliente.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| POST | `/clientes` | 🔓 | — | Criar cliente |
| POST | `/clientes/rapido` | 🔓 | — | Criação rápida |
| GET | `/clientes` | 🔒 | ADMIN | Listar todos |
| GET | `/clientes/by-cpf` | 🔓 | — | Buscar por CPF |
| GET | `/clientes/buscar` | 🔓 | — | Busca flexível |
| GET | `/clientes/:id` | 🔒 | ADMIN | Por ID |

---

## Comandas (`/comandas`)

**Fonte:** `backend/src/modulos/comanda/comanda.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| POST | `/comandas` | 🔓 | — | Criar comanda |
| GET | `/comandas/search?term=x` | 🔒 | ADMIN/CAIXA | Buscar |
| GET | `/comandas/recuperar?q=x` | 🔓 | — | Recuperar por código/CPF |
| GET | `/comandas/:id/public` | 🔓 | — | Dados públicos (QR Code) |
| GET | `/comandas` | 🔒 | ADMIN/GARCOM/CAIXA | Listar (paginado) |
| GET | `/comandas/mesa/:mesaId/aberta` | 🔒 | ADMIN/GARCOM/CAIXA | Comanda da mesa |
| PATCH | `/comandas/:id/fechar` | 🔒 | ADMIN/CAIXA | Fechar + registrar venda |
| GET | `/comandas/:id` | 🔒 | ADMIN/GARCOM/CAIXA | Por ID |
| PATCH | `/comandas/:id` | 🔒 | ADMIN/GARCOM/CAIXA | Atualizar |
| DELETE | `/comandas/:id` | 🔒 | ADMIN | Remover |
| PATCH | `/comandas/:id/local` | 🔓 | — | Atualizar local |
| PATCH | `/comandas/:id/ponto-entrega` | 🔓 | — | Atualizar ponto entrega |
| GET | `/comandas/:id/agregados` | 🔓 | — | Listar agregados |

---

## Pedidos (`/pedidos`)

**Fonte:** `backend/src/modulos/pedido/pedido.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| POST | `/pedidos` | 🔒 | ADMIN/GARCOM | Criar pedido |
| POST | `/pedidos/cliente` | 🔓 | — | Pedido pelo cliente |
| POST | `/pedidos/garcom` | 🔒 | ADMIN/GARCOM | Pedido pelo garçom |
| PATCH | `/pedidos/item/:id/status` | 🔒 | ADMIN/COZ/GARCOM | Atualizar status item |
| GET | `/pedidos` | 🔒 | Vários | Listar com filtros |
| GET | `/pedidos/prontos` | 🔒 | ADMIN/GARCOM/COZ | Pedidos prontos |
| GET | `/pedidos/:id` | 🔒 | Vários | Por ID |
| PATCH | `/pedidos/:id` | 🔒 | ADMIN/GARCOM/COZ | Atualizar |
| DELETE | `/pedidos/:id` | 🔒 | ADMIN | Remover |
| PATCH | `/pedidos/item/:id/retirar` | 🔒 | ADMIN/GARCOM | Retirar item |
| PATCH | `/pedidos/item/:id/deixar-no-ambiente` | 🔒 | ADMIN/GARCOM | Deixar no ambiente |
| PATCH | `/pedidos/item/:id/marcar-entregue` | 🔒 | ADMIN/GARCOM | Marcar entregue |

---

## Produtos (`/produtos`)

**Fonte:** `backend/src/modulos/produto/produto.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| POST | `/produtos` | 🔒 | ADMIN | Criar (multipart/form-data) |
| PATCH | `/produtos/:id` | 🔒 | ADMIN | Atualizar (multipart) |
| DELETE | `/produtos/:id` | 🔒 | ADMIN | Remover |
| GET | `/produtos/publicos/cardapio` | 🔓 | — | Cardápio público |
| GET | `/produtos` | 🔒 | — | Listar (paginado) |
| GET | `/produtos/:id` | 🔒 | — | Por ID |

---

## Pontos de Entrega (`/pontos-entrega`) 🛡️ PONTOS_ENTREGA

**Fonte:** `backend/src/modulos/ponto-entrega/ponto-entrega.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| GET | `/pontos-entrega/publicos/ativos` | 🔓 | — | Pontos ativos (cliente) |
| POST | `/pontos-entrega` | 🔒 | ADMIN | Criar |
| GET | `/pontos-entrega` | 🔒 | ADMIN/CAIXA/GARCOM | Listar |
| GET | `/pontos-entrega/ativos` | 🔒 | ADMIN/CAIXA/GARCOM | Listar ativos |
| GET | `/pontos-entrega/ambiente/:id` | 🔒 | ADMIN/GARCOM | Por ambiente |
| GET | `/pontos-entrega/:id` | 🔒 | ADMIN/CAIXA/GARCOM | Por ID |
| PATCH | `/pontos-entrega/:id` | 🔒 | ADMIN | Atualizar |
| PATCH | `/pontos-entrega/:id/toggle-ativo` | 🔒 | ADMIN | Toggle ativo |
| DELETE | `/pontos-entrega/:id` | 🔒 | ADMIN | Remover |
| PUT | `/pontos-entrega/:id/posicao` | 🔒 | ADMIN | Posição no mapa |

---

## Eventos (`/eventos`) 🛡️ EVENTOS

**Fonte:** `backend/src/modulos/evento/evento.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| PATCH | `/eventos/:id/upload` | 🔒 | ADMIN | Upload imagem |
| POST | `/eventos` | 🔒 | ADMIN | Criar |
| GET | `/eventos` | 🔒 | ADMIN | Listar |
| GET | `/eventos/publicos` | 🔓 | — | Eventos públicos |
| GET | `/eventos/publicos/:id` | 🔓 | — | Evento público por ID |
| PATCH | `/eventos/:id` | 🔒 | ADMIN | Atualizar |
| DELETE | `/eventos/:id` | 🔒 | ADMIN | Remover |
| GET | `/eventos/:id` | 🔒 | ADMIN | Por ID |

---

## Páginas de Evento (`/paginas-evento`)

**Fonte:** `backend/src/modulos/pagina-evento/pagina-evento.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| POST | `/paginas-evento` | 🔒 | ADMIN | Criar |
| GET | `/paginas-evento` | 🔒 | ADMIN | Listar |
| GET | `/paginas-evento/:id` | 🔒 | ADMIN | Por ID |
| PATCH | `/paginas-evento/:id` | 🔒 | ADMIN | Atualizar |
| DELETE | `/paginas-evento/:id` | 🔒 | ADMIN | Remover |
| PATCH | `/paginas-evento/:id/upload-media` | 🔒 | ADMIN | Upload mídia |
| GET | `/paginas-evento/ativa/publica` | 🔓 | — | Página ativa |
| GET | `/paginas-evento/:id/public` | 🔓 | — | Página pública |

---

## Caixa (`/caixa`)

**Fonte:** `backend/src/modulos/caixa/caixa.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| POST | `/caixa/abertura` | 🔒 | ADMIN/CAIXA | Abrir caixa |
| POST | `/caixa/fechamento` | 🔒 | ADMIN/CAIXA | Fechar caixa |
| POST | `/caixa/sangria` | 🔒 | ADMIN/CAIXA | Registrar sangria |
| POST | `/caixa/venda` | 🔒 | ADMIN/CAIXA | Registrar venda |
| POST | `/caixa/suprimento` | 🔒 | ADMIN/CAIXA | Registrar suprimento |
| GET | `/caixa/aberto` | 🔒 | Vários | Caixa aberto |
| GET | `/caixa/aberto/todos` | 🔒 | ADMIN/CAIXA | Todos caixas abertos |
| GET | `/caixa/:id/resumo` | 🔒 | ADMIN/CAIXA | Resumo |
| GET | `/caixa/:id/movimentacoes` | 🔒 | ADMIN/CAIXA | Movimentações |
| GET | `/caixa/:id/sangrias` | 🔒 | ADMIN/CAIXA | Sangrias |
| GET | `/caixa/historico` | 🔒 | ADMIN/CAIXA | Histórico |
| GET | `/caixa/relatorio/vendas-por-caixa` | 🔒 | ADMIN/CAIXA | Relatório vendas |

---

## Turnos (`/turnos`) 🛡️ TURNOS

**Fonte:** `backend/src/modulos/turno/turno.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| POST | `/turnos/check-in` | 🔒 | Vários | Check-in |
| POST | `/turnos/check-out` | 🔒 | Vários | Check-out |
| GET | `/turnos/ativos` | 🔒 | ADMIN/CAIXA | Funcionários ativos |
| GET | `/turnos/funcionario/:id` | 🔒 | Vários | Turnos do funcionário |
| GET | `/turnos/funcionario/:id/estatisticas` | 🔒 | — | Estatísticas |
| GET | `/turnos/funcionario/:id/ativo` | 🔒 | — | Turno ativo |

---

## Avaliações (`/avaliacoes`) 🛡️ AVALIACOES

**Fonte:** `backend/src/modulos/avaliacao/avaliacao.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| POST | `/avaliacoes` | 🔓 | — | Criar avaliação (cliente) |
| GET | `/avaliacoes` | 🔒 | ADMIN | Listar |
| GET | `/avaliacoes/estatisticas` | 🔒 | ADMIN/CAIXA | Estatísticas |
| GET | `/avaliacoes/estatisticas/hoje` | 🔒 | Vários | Estatísticas do dia |

---

## Analytics (`/analytics`) 🛡️ ANALYTICS

**Fonte:** `backend/src/modulos/analytics/analytics.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| GET | `/analytics/pedidos/relatorio-geral` | 🔒 | ADMIN | Relatório geral |
| GET | `/analytics/pedidos/tempos` | 🔒 | ADMIN | Tempos de pedidos |
| GET | `/analytics/garcons/performance` | 🔒 | ADMIN | Performance garçons |
| GET | `/analytics/ambientes/performance` | 🔒 | ADMIN | Performance ambientes |
| GET | `/analytics/produtos/mais-vendidos` | 🔒 | ADMIN | Mais vendidos |
| GET | `/analytics/garcons/ranking` | 🔒 | ADMIN/GARCOM | Ranking |
| GET | `/analytics/garcons/:id/estatisticas` | 🔒 | ADMIN/GARCOM | Estatísticas garçom |

---

## Medalhas (`/medalhas`) 🛡️ MEDALHAS

**Fonte:** `backend/src/modulos/medalha/medalha.controller.ts`

| Método | Rota | Auth | Roles | Descrição |
|--------|------|------|-------|-----------|
| GET | `/medalhas/garcom/:id` | 🔒 | ADMIN/GARCOM | Medalhas do garçom |
| GET | `/medalhas/garcom/:id/progresso` | 🔒 | ADMIN/GARCOM | Progresso |
| GET | `/medalhas/garcom/:id/verificar` | 🔒 | ADMIN/GARCOM | Verificar novas |

---

## Auditoria (`/audit`)

**Fonte:** `backend/src/modulos/audit/audit.controller.ts`

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/audit` | 🔒 | Listar registros (filtros: funcionarioId, entityName, action, datas) |
| GET | `/audit/entity/:name/:id` | 🔒 | Histórico de uma entidade |
| GET | `/audit/user/:id` | 🔒 | Atividades de um usuário |
| GET | `/audit/report` | 🔒 | Gerar relatório |
| GET | `/audit/statistics` | 🔒 | Estatísticas |
| GET | `/audit/failed-logins` | 🔒 | Logins falhados |

---

## Health (`/health`)

**Fonte:** `backend/src/health/health.controller.ts`

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/health` | 🔓 | Health check (verifica banco) |

---

## Resumo Estatístico

| Métrica | Valor |
|---------|-------|
| **Total de endpoints** | ~130 |
| **Endpoints públicos** | ~25 |
| **Endpoints protegidos (JWT)** | ~105 |
| **Endpoints SUPER_ADMIN** | ~15 |
| **Controllers** | 28 |
| **Módulos com Feature Guard** | 7 |
| **Endpoints com upload** | 5 |
