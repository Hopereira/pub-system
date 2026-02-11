# Regras de Negócio — Pub System

**Atualizado:** 2026-02-11  
**Fonte da verdade:** `backend/src/modulos/*/services/`, `backend/src/modulos/*/entities/`

---

## 1. Comanda

**Fonte:** `backend/src/modulos/comanda/`

- Comanda tem **Mesa OU PontoEntrega** — nunca ambos (constraint XOR no banco)
- Comanda sem mesa e sem ponto de entrega = balcão
- Status: `ABERTA → FECHADA → PAGA`
- Fechamento (`PATCH /comandas/:id/fechar`):
  - Registra venda automaticamente no caixa aberto
  - Libera a mesa vinculada (status → LIVRE)
  - Emite `comanda_atualizada` via WebSocket
- Criação pública (sem login) — cliente pode abrir comanda
- Recuperação por código ou CPF (`GET /comandas/recuperar?q=x`)
- Agregados: múltiplos clientes na mesma comanda (`ComandaAgregado`)

---

## 2. Pedido e Itens

**Fonte:** `backend/src/modulos/pedido/`

- Pedido pertence a uma Comanda (N:1)
- Cada ItemPedido tem status individual:
  - `FEITO → EM_PREPARO → PRONTO → ENTREGUE`
  - Alternativas: `CANCELADO`, `DEIXADO_NO_AMBIENTE`
- Item é roteado para o ambiente de preparo do produto (Cozinha, Bar, etc.)
- Criação emite WebSocket: `novo_pedido` + `novo_pedido_ambiente:{ambienteId}`
- Mudança de status emite: `status_atualizado` + `status_atualizado_ambiente:{ambienteId}`
- Pedido pelo cliente (público): `POST /pedidos/cliente` — sem autenticação
- Pedido pelo garçom: `POST /pedidos/garcom` — requer JWT + role GARCOM/ADMIN

---

## 3. Mesa

**Fonte:** `backend/src/modulos/mesa/`

- Status: `LIVRE`, `OCUPADA`, `RESERVADA`
- Vinculada a ambiente de ATENDIMENTO (Salão, Varanda, etc.)
- Posição visual (x, y) para mapa do estabelecimento
- Mesas livres são listáveis publicamente (`GET /mesas/publicas/livres`)
- Ao fechar comanda, mesa volta para LIVRE automaticamente

---

## 4. Ambiente

**Fonte:** `backend/src/modulos/ambiente/`

- Dois tipos: `PREPARO` (Cozinha, Bar, Pizzaria) e `ATENDIMENTO` (Salão, Varanda)
- 100% dinâmico — admin cria/remove sem alteração de código
- Ambientes de preparo recebem pedidos via WebSocket (painel Kanban)
- Ambientes de atendimento contêm mesas
- Produtos são vinculados a ambientes de preparo

---

## 5. Caixa

**Fonte:** `backend/src/modulos/caixa/`

- Fluxo: Abertura → Movimentações → Fechamento
- Movimentações:
  - **Venda**: registrada automaticamente ao fechar comanda
  - **Sangria**: retirada de dinheiro (motivo obrigatório)
  - **Suprimento**: entrada de dinheiro
- Fechamento: confronta valor esperado vs valor informado
- Múltiplos caixas podem estar abertos simultaneamente
- Emite `caixa_atualizado` via WebSocket a cada movimentação

---

## 6. Produto

**Fonte:** `backend/src/modulos/produto/`

- Vinculado a ambiente de preparo (determina para onde o pedido vai)
- Imagem opcional via Google Cloud Storage
- Cardápio público sem autenticação (`GET /produtos/publicos/cardapio`)
- Ao deletar produto, ItemPedido existente mantém referência (SET NULL)

---

## 7. Funcionário e Roles

**Fonte:** `backend/src/modulos/funcionario/`

- Primeiro funcionário registrado vira ADMIN automaticamente (`POST /funcionarios/registro`)
- Roles determinam acesso a endpoints (ver SEGURANCA.md)
- Funcionário pode alterar própria senha e foto
- ADMIN pode criar/editar/remover outros funcionários

---

## 8. Cliente

**Fonte:** `backend/src/modulos/cliente/`

- Cadastro público (sem login)
- Criação rápida com campos mínimos (`POST /clientes/rapido`)
- Busca por CPF ou nome (público)
- Vinculado a comandas

---

## 9. Tenant (Multi-Tenancy)

**Fonte:** `backend/src/common/tenant/`

- Cada estabelecimento = 1 tenant
- Status: `ATIVO`, `SUSPENSO`, `INATIVO`
- Tenant suspenso: todas requisições bloqueadas pelo TenantGuard
- Provisioning cria infraestrutura completa em uma transação
- Slug único para subdomínio (`casarao-pub.pubsystem.com.br`)
- Plano determina features disponíveis (ver ARQUITETURA.md)

---

## 10. Evento e Página de Evento

**Fonte:** `backend/src/modulos/evento/`, `backend/src/modulos/pagina-evento/`

- Eventos têm data, valor de entrada, imagem
- Landing pages personalizadas por evento (PaginaEvento)
- Rotas públicas para divulgação
- Requer plano BASIC (Feature: EVENTOS)

---

## 11. Avaliação

**Fonte:** `backend/src/modulos/avaliacao/`

- Cliente avalia sem login (`POST /avaliacoes` público)
- Estatísticas de satisfação com filtros de data
- Requer plano BASIC (Feature: AVALIACOES)

---

## 12. Turno

**Fonte:** `backend/src/modulos/turno/`

- Check-in/check-out de funcionários
- Estatísticas de horas trabalhadas
- WebSocket via TurnoGateway
- Requer plano PRO (Feature: TURNOS)

---

## 13. Seeder (Dados de Teste)

**Fonte:** `backend/src/database/seeder.service.ts`

Executa automaticamente na primeira inicialização:

| Dado | Quantidade |
|------|-----------|
| Ambientes de preparo | 5 |
| Ambientes de atendimento | 3 |
| Mesas | 22 |
| Produtos | 42 |
| Clientes | 5 |
| Comandas abertas | 5 |
