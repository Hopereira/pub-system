# Roteiro de Testes Frontend por Persona

**Branch:** `testes-frontend-personas`  
**Data:** 2026-04-02  
**Ambiente:** https://pubsystem.com.br (Frontend Vercel) + https://api.pubsystem.com.br (Backend Oracle VM)  
**Tenant de teste:** `pub-demo` (slug)  

---

## Credenciais de Teste

| Persona | Email | Senha | Tenant |
|---------|-------|-------|--------|
| SUPER_ADMIN | superadmin@pubsystem.com.br | super123 | — (sem tenant) |
| ADMIN | admin@admin.com | (a definir) | pub-demo |
| GERENTE | (a criar) | (a definir) | pub-demo |
| GARCOM | (a criar) | (a definir) | pub-demo |
| CAIXA | (a criar) | (a definir) | pub-demo |
| COZINHEIRO | (a criar) | (a definir) | pub-demo |
| CLIENTE | — | — | público |

---

## P1 — SUPER_ADMIN

### Caminho Feliz
- [ ] T1.1 — Login em `pubsystem.com.br/login` com `superadmin@pubsystem.com.br` → redireciona para `/super-admin` ou `/dashboard`
- [ ] T1.2 — Listar tenants ativos
- [ ] T1.3 — Ver detalhes do tenant `pub-demo`
- [ ] T1.4 — Ver métricas da plataforma
- [ ] T1.5 — Suspender tenant → reativar tenant

### Caminho Triste
- [ ] T1.6 — Login com senha errada → mensagem de erro clara
- [ ] T1.7 — Tentar acessar rota de tenant (`/dashboard`) sem ter tenantId → comportamento esperado
- [ ] T1.8 — Rate limit: 6 tentativas de login com senha errada → bloqueio por 15min

---

## P2 — ADMIN

### Caminho Feliz
- [ ] T2.1 — Login com ADMIN em `pub-demo` → redireciona para `/dashboard`
- [ ] T2.2 — Criar funcionário GARCOM
- [ ] T2.3 — Criar funcionário CAIXA
- [ ] T2.4 — Criar funcionário COZINHEIRO
- [ ] T2.5 — Criar ambiente de PREPARO (ex: "Cozinha") e ATENDIMENTO (ex: "Salão")
- [ ] T2.6 — Criar produto vinculado ao ambiente de preparo
- [ ] T2.7 — Criar mesa vinculada ao ambiente de atendimento
- [ ] T2.8 — Criar ponto de entrega
- [ ] T2.9 — Configurar mapa de mesas (`/dashboard/mapa/configurar`) — drag & drop
- [ ] T2.10 — Ver cardápio (`/dashboard/admin/cardapio`)
- [ ] T2.11 — Ver relatórios (`/dashboard`)
- [ ] T2.12 — Alterar plano (`/dashboard/configuracoes/plano`)

### Caminho Triste
- [ ] T2.13 — Tentar criar funcionário SUPER_ADMIN → deve ser bloqueado
- [ ] T2.14 — Tentar acessar `/super-admin` → deve receber 403/redirect
- [ ] T2.15 — Criar produto sem ambiente de preparo → validação de campo obrigatório
- [ ] T2.16 — Login com tenant errado (slug de outro tenant) → 403

---

## P3 — GERENTE

### Caminho Feliz
- [ ] T3.1 — Login com GERENTE → redireciona para `/dashboard`
- [ ] T3.2 — Ver pedidos (`/dashboard/gestaopedidos`)
- [ ] T3.3 — Ver comandas abertas
- [ ] T3.4 — Ver relatórios/analytics
- [ ] T3.5 — Ver mapa de mesas (visualizar, não configurar)

### Caminho Triste
- [ ] T3.6 — Tentar acessar `/dashboard/admin/funcionarios` → deve bloquear ou ocultar ações de escrita
- [ ] T3.7 — Tentar criar funcionário → deve ser bloqueado (403)
- [ ] T3.8 — Tentar acessar `/dashboard/admin/empresa` → deve bloquear
- [ ] T3.9 — Tentar acessar `/dashboard/configuracoes/plano` → deve bloquear

---

## P4 — GARCOM

### Caminho Feliz
- [ ] T4.1 — Login com GARCOM → redireciona para `/garcom`
- [ ] T4.2 — Ver mapa de mesas (`/garcom/mapa`) — cores por status
- [ ] T4.3 — Abrir comanda em uma mesa livre
- [ ] T4.4 — Adicionar itens ao pedido (produto existente)
- [ ] T4.5 — Enviar pedido → item aparece na cozinha
- [ ] T4.6 — Ver status dos pedidos enviados
- [ ] T4.7 — Entregar item com status PRONTO
- [ ] T4.8 — Ver gestão de pedidos (`/dashboard/gestaopedidos`)

### Caminho Triste
- [ ] T4.9 — Tentar abrir comanda em mesa já OCUPADA → comportamento esperado
- [ ] T4.10 — Tentar adicionar produto inexistente / fora do cardápio
- [ ] T4.11 — Tentar acessar `/dashboard/admin` → deve bloquear
- [ ] T4.12 — Tentar fechar comanda (ação de caixa) → deve bloquear
- [ ] T4.13 — Logout e relogin → sessão limpa

---

## P5 — CAIXA

### Caminho Feliz
- [ ] T5.1 — Login com CAIXA → redireciona para `/caixa`
- [ ] T5.2 — Abrir caixa (check-in de turno)
- [ ] T5.3 — Buscar comanda por mesa no terminal (`/caixa/terminal`)
- [ ] T5.4 — Ver detalhes da comanda com itens e total
- [ ] T5.5 — Fechar comanda (pagamento)
- [ ] T5.6 — Ver comandas abertas (`/caixa/comandas-abertas`)
- [ ] T5.7 — Ver histórico de caixa
- [ ] T5.8 — Fechar caixa (check-out de turno)

### Caminho Triste
- [ ] T5.9 — Buscar comanda inexistente → estado vazio amigável
- [ ] T5.10 — Tentar fechar comanda sem itens → validação
- [ ] T5.11 — Tentar acessar `/dashboard/admin` → deve bloquear
- [ ] T5.12 — Tentar criar funcionário → deve bloquear
- [ ] T5.13 — Fechar caixa sem abrir → comportamento esperado

---

## P6 — COZINHEIRO

### Caminho Feliz
- [ ] T6.1 — Login com COZINHEIRO → redireciona para `/cozinha`
- [ ] T6.2 — Ver painel Kanban com pedidos em preparo
- [ ] T6.3 — Atualizar status de item FEITO → EM_PREPARO
- [ ] T6.4 — Atualizar status EM_PREPARO → PRONTO
- [ ] T6.5 — Ver atualização em tempo real quando novo pedido chega (WebSocket)

### Caminho Triste
- [ ] T6.6 — Tentar acessar `/dashboard` → deve bloquear ou mostrar visão limitada
- [ ] T6.7 — Tentar acessar `/dashboard/admin` → deve bloquear
- [ ] T6.8 — Tentar fechar comanda → deve bloquear

---

## P7 — CLIENTE (público, sem login)

### Caminho Feliz
- [ ] T7.1 — Acessar cardápio público via QR Code / URL `/{slug}/cardapio/{comandaId}`
- [ ] T7.2 — Ver produtos do cardápio sem login
- [ ] T7.3 — Fazer pedido como cliente pelo portal
- [ ] T7.4 — Ver resumo do pedido (`/acesso-cliente/{comandaId}/resumo`)
- [ ] T7.5 — Acessar portal do cliente (`/portal-cliente/{comandaId}`)

### Caminho Triste
- [ ] T7.6 — Acessar cardápio com `comandaId` inválido → erro amigável
- [ ] T7.7 — Tentar acessar rota protegida sem estar logado → redireciona para `/login`
- [ ] T7.8 — Pedido com quantidade 0 ou negativa → validação no frontend

---

## Legenda de Status

| Símbolo | Significado |
|---------|-------------|
| ✅ | Passou — comportamento correto |
| ❌ | Falhou — bug encontrado |
| ⚠️ | Passou com ressalva / comportamento inesperado |
| 🔒 | Segurança: bloqueio correto |
| 🔓 | Segurança: bloqueio AUSENTE (bug crítico) |
| ⏭️ | Pulado / não aplicável |

---

## Resultados

> Preencher durante a execução dos testes

### P1 — SUPER_ADMIN
| ID | Resultado | Observação |
|----|-----------|------------|

### P2 — ADMIN
| ID | Resultado | Observação |
|----|-----------|------------|

### P3 — GERENTE
| ID | Resultado | Observação |
|----|-----------|------------|

### P4 — GARCOM
| ID | Resultado | Observação |
|----|-----------|------------|

### P5 — CAIXA
| ID | Resultado | Observação |
|----|-----------|------------|

### P6 — COZINHEIRO
| ID | Resultado | Observação |
|----|-----------|------------|

### P7 — CLIENTE
| ID | Resultado | Observação |
|----|-----------|------------|

---

## Bugs Encontrados

| # | Persona | ID Teste | Descrição | Severidade | Status |
|---|---------|----------|-----------|-----------|--------|
