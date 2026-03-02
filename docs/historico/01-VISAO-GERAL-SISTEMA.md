# 🏗️ Visão Geral do Sistema - Pub System

**Versão:** 0.2.0  
**Data:** 04/12/2024  
**Branch:** dev-test  
**Status:** ✅ 90% Pronto para Produção

---

## 🎯 Objetivo do Sistema

O **Pub System** é uma plataforma completa de gestão para bares, restaurantes e pubs, oferecendo:

- 📋 **Gestão de Pedidos** - Criação, acompanhamento e entrega
- 💰 **Gestão Financeira** - Caixa, pagamentos, relatórios
- 👥 **Gestão de Equipe** - Funcionários, turnos, ranking
- 🍽️ **Cardápio Digital** - Autoatendimento via QR Code
- 📊 **Analytics** - Métricas, relatórios, dashboards
- 🏆 **Gamificação** - Medalhas e ranking de garçons

---

## 🏛️ Arquitetura do Sistema

### **Stack Tecnológico**

#### **Backend**
- **Framework:** NestJS 10.x
- **Linguagem:** TypeScript 5.x
- **Banco de Dados:** PostgreSQL 15+
- **ORM:** TypeORM 0.3.x
- **Autenticação:** JWT (Passport)
- **Comunicação Real-Time:** Socket.io
- **Upload de Arquivos:** Google Cloud Storage
- **Documentação API:** Swagger/OpenAPI
- **Validação:** class-validator, class-transformer
- **Cálculos Monetários:** Decimal.js

#### **Frontend**
- **Framework:** Next.js 15.5.2 (App Router)
- **Linguagem:** TypeScript 5.x
- **UI Library:** React 19
- **Estilização:** TailwindCSS 4
- **Componentes:** Radix UI + shadcn/ui
- **Gerenciamento de Estado:** React Query (TanStack Query)
- **Requisições HTTP:** Axios (com retry)
- **Validação de Formulários:** React Hook Form + Zod
- **Notificações:** Sonner (toast)
- **Ícones:** Lucide React
- **Temas:** next-themes

#### **Infraestrutura**
- **Containerização:** Docker + Docker Compose
- **Orquestração:** Kubernetes (opcional)
- **CI/CD:** GitHub Actions
- **Monitoramento:** Logs customizados (recomendado: New Relic/Datadog)
- **Backup:** PostgreSQL pg_dump (automatizado)

---

## 📊 Modelo de Dados

### **Entidades Principais (22 entidades)**

#### **1. Gestão de Estabelecimento**
- `Empresa` - Dados da empresa
- `Ambiente` - Áreas físicas (Cozinha, Bar, Salão, etc)
- `Mesa` - Mesas do estabelecimento
- `PontoEntrega` - Pontos de retirada (Balcão, etc)

#### **2. Gestão de Pessoas**
- `Funcionario` - Colaboradores (ADMIN, GERENTE, GARCOM, CAIXA, COZINHA)
- `Cliente` - Clientes do estabelecimento
- `TurnoFuncionario` - Controle de jornada (check-in/check-out)

#### **3. Gestão de Produtos**
- `Produto` - Itens do cardápio
- `Comanda` - Comandas de consumo
- `Pedido` - Pedidos feitos
- `ItemPedido` - Itens individuais de cada pedido
- `RetiradaItem` - **NOVO** - Rastreamento de retirada por garçom

#### **4. Gestão Financeira** ✅ **NOVO MÓDULO**
- `AberturaCaixa` - Abertura de caixa com valor inicial
- `FechamentoCaixa` - Fechamento com conferência detalhada
- `Sangria` - Retiradas de dinheiro do caixa
- `MovimentacaoCaixa` - Todas as movimentações financeiras

#### **5. Eventos e Marketing**
- `Evento` - Eventos especiais
- `PaginaEvento` - Páginas customizadas de eventos

#### **6. Feedback e Gamificação**
- `Avaliacao` - Avaliações dos clientes
- `Medalha` - Medalhas para gamificação
- `FuncionarioMedalha` - Relação funcionário-medalha

#### **7. Agregação**
- `ComandaAgregado` - Agregação de comandas

---

## 🔐 Autenticação e Autorização

### **Sistema de Autenticação**

**Tecnologia:** JWT (JSON Web Tokens)

**Fluxo:**
```
1. Login → POST /auth/login
2. Backend valida credenciais
3. Retorna token JWT (validade: 1 hora)
4. Frontend armazena em localStorage
5. Todas requisições incluem: Authorization: Bearer {token}
```

**Refresh Tokens:** ⚠️ Não implementado (pendente)

### **Cargos e Permissões**

| Cargo | Acesso | Rotas Principais |
|-------|--------|------------------|
| **ADMIN** | Total | `/dashboard/*` (todas) |
| **GERENTE** | Gestão operacional | `/dashboard/*` (exceto empresa) |
| **GARCOM** | Área do garçom | `/garcom/*` |
| **CAIXA** | Área do caixa | `/caixa/*`, `/dashboard` (limitado) |
| **COZINHA** | Kanban de pedidos | `/dashboard/gestaopedidos`, `/cozinha` |

### **Guards Implementados**

1. **JwtAuthGuard** - Valida token JWT
2. **RolesGuard** - Valida cargo do usuário
3. **Public Decorator** - Permite rotas públicas (clientes)

---

## 🛣️ Rotas e Endpoints

### **Backend (NestJS)**

#### **Autenticação**
- `POST /auth/login` - Login (público)
- `GET /auth/me` - Dados do usuário logado

#### **Funcionários**
- `GET /funcionarios` - Listar (ADMIN)
- `POST /funcionarios` - Criar (ADMIN)
- `PATCH /funcionarios/:id` - Atualizar (ADMIN)
- `DELETE /funcionarios/:id` - Deletar (ADMIN)

#### **Comandas**
- `POST /comandas` - Criar (público/garçom)
- `GET /comandas` - Listar (ADMIN, GERENTE, CAIXA)
- `GET /comandas/search?term=` - Buscar por termo (mesa, cliente, CPF)
- `GET /comandas/:id` - Buscar (todos)
- `GET /comandas/:id/public` - Buscar (público)
- `GET /comandas/mesa/:mesaId/aberta` - Buscar comanda aberta de uma mesa
- `PATCH /comandas/:id/fechar` - Fechar (CAIXA)

#### **Pedidos**
- `POST /pedidos` - Criar (funcionários)
- `POST /pedidos/cliente` - Criar (público)
- `POST /pedidos/garcom` - Criar (garçom)
- `GET /pedidos` - Listar
- `PATCH /pedidos/item/:id/status` - Atualizar status
- `PATCH /pedidos/item/:id/retirar` - **NOVO** - Retirar item
- `PATCH /pedidos/item/:id/entregar` - **NOVO** - Entregar item

#### **Caixa** ✅ **NOVO MÓDULO**
- `POST /caixa/abertura` - Abrir caixa
- `POST /caixa/fechamento` - Fechar caixa
- `POST /caixa/sangria` - Registrar sangria
- `POST /caixa/venda` - Registrar venda
- `GET /caixa/aberto` - Buscar caixa aberto (por turno ou funcionário)
- `GET /caixa/aberto/todos` - Buscar todos os caixas abertos (admin)
- `GET /caixa/:id/resumo` - Resumo completo do caixa
- `GET /caixa/:id/movimentacoes` - Movimentações do caixa
- `GET /caixa/:id/sangrias` - Sangrias do caixa
- `GET /caixa/historico` - Histórico de fechamentos

#### **Produtos**
- `GET /produtos` - Listar
- `POST /produtos` - Criar (ADMIN)
- `PATCH /produtos/:id` - Atualizar (ADMIN)
- `DELETE /produtos/:id` - Deletar (ADMIN)

#### **Mesas**
- `GET /mesas` - Listar
- `POST /mesas` - Criar (ADMIN)
- `PATCH /mesas/:id` - Atualizar (ADMIN)
- `DELETE /mesas/:id` - Deletar (ADMIN)

#### **Analytics**
- `GET /analytics/geral` - Estatísticas gerais
- `GET /analytics/ranking-garcons` - Ranking de garçons
- `GET /analytics/produtos-mais-vendidos` - Produtos populares

#### **Turnos**
- `POST /turnos/check-in` - Check-in
- `POST /turnos/check-out` - Check-out
- `GET /turnos/ativo` - Turno ativo do funcionário

### **Frontend (Next.js)**

#### **Autenticação**
- `/login` - Página de login

#### **Dashboard Administrativo**
- `/dashboard` - Dashboard principal (ADMIN, GERENTE, CAIXA)
- `/dashboard/gestaopedidos` - Kanban de pedidos
- `/dashboard/operacional/mesas` - Mapa operacional de mesas
- `/dashboard/operacional/pedidos-pendentes` - Pedidos pendentes
- `/dashboard/mapa/configurar` - Configurador de mapa visual
- `/dashboard/mapa/visualizar` - Visualização do mapa
- `/dashboard/relatorios` - Relatórios
- `/dashboard/comandas/[id]` - Detalhes de comanda
- `/dashboard/cozinha` - Área da cozinha (alternativa)
- `/dashboard/admin/funcionarios` - Gestão de funcionários
- `/dashboard/admin/cardapio` - Gestão de cardápio
- `/dashboard/admin/empresa` - Gestão de empresa
- `/dashboard/admin/agenda-eventos` - Agenda de eventos
- `/dashboard/admin/paginas-evento` - Páginas de eventos

#### **Área do Garçom**
- `/garcom` - Dashboard do garçom
- `/garcom/novo-pedido` - Criar pedido
- `/garcom/mapa` - Mapa de mesas
- `/garcom/mapa-visual` - Mapa visual de mesas (alternativo)
- `/garcom/qrcode-comanda` - Gerar QR Code
- `/garcom/ranking` - Ranking de garçons

#### **Área do Caixa** ✅ **NOVO**
- `/caixa` - Dashboard do caixa
- `/caixa/terminal` - Terminal de busca e pagamento
- `/caixa/comandas-abertas` - Comandas abertas
- `/caixa/clientes` - Busca de clientes
- `/caixa/gestao` - Gestão de caixa (abertura/fechamento)
- `/caixa/historico` - Histórico de movimentações
- `/caixa/relatorios` - Relatórios financeiros
- `/caixa/[id]/detalhes` - Detalhes de comanda

#### **Área da Cozinha**
- `/cozinha` - Dashboard da cozinha

#### **Área do Cliente (Público)**
- `/comanda/[id]` - Acesso à comanda
- `/acesso-cliente/[comandaId]` - Acesso do cliente à comanda
- `/acesso-cliente/[comandaId]/resumo` - Resumo da comanda do cliente
- `/recuperar-comanda` - Recuperar comanda perdida
- `/primeiro-acesso` - Primeiro acesso do cliente

---

## 🔄 Comunicação em Tempo Real (WebSocket)

### **Gateway de Pedidos**

**Arquivo:** `backend/src/modulos/pedido/pedidos.gateway.ts`

**Eventos Emitidos:**
- `novoPedido` - Novo pedido criado
- `statusPedidoAtualizado` - Status de pedido mudou
- `pedidoPronto` - Pedido ficou pronto
- `pedidoEntregue` - Pedido foi entregue

**Eventos Recebidos:**
- `joinAmbiente` - Entrar em sala de ambiente
- `leaveAmbiente` - Sair de sala de ambiente

**Segurança:**
- CORS restrito para `FRONTEND_URL`
- Autenticação via token (recomendado implementar)

**Uso no Frontend:**
```typescript
// Conectar ao WebSocket
const socket = io(process.env.NEXT_PUBLIC_API_URL);

// Entrar em sala de ambiente
socket.emit('joinAmbiente', { ambienteId: 'uuid' });

// Escutar novos pedidos
socket.on('novoPedido', (pedido) => {
  // Atualizar UI
  toast.success('Novo pedido recebido!');
});
```

---

## 🎨 Design System

### **Componentes UI (shadcn/ui)**

**Componentes Implementados:**
- `Button` - Botões
- `Card` - Cards
- `Badge` - Badges de status
- `Input` - Campos de texto
- `Select` - Seleção
- `Dialog` - Modais
- `Toast` - Notificações
- `Tabs` - Abas
- `Table` - Tabelas
- `Progress` - **NOVO** - Barra de progresso
- E mais...

### **Paleta de Cores**

**Status de Pedidos:**
- 🔵 Azul - FEITO
- 🟡 Amarelo - EM_PREPARO
- 🟢 Verde - PRONTO
- ⚪ Cinza - ENTREGUE
- 🔴 Vermelho - CANCELADO

**Status de Mesas:**
- 🟢 Verde - LIVRE
- 🟡 Amarelo - OCUPADA
- 🔴 Vermelho - AGUARDANDO_PAGAMENTO
- 🔵 Azul - RESERVADA

---

## 📈 Métricas e Analytics

### **Métricas Disponíveis**

#### **Dashboard Principal**
- Total de vendas do dia
- Mesas ocupadas
- Tempo médio de preparo
- Pedidos pendentes
- Comandas abertas
- Taxa de satisfação

#### **Ranking de Garçons**
- Total de entregas
- Entregas rápidas (< 2min)
- Tempo médio de entrega
- Pontuação total
- Posição no ranking

#### **Produtos**
- Produtos mais vendidos
- Receita por produto
- Quantidade vendida

#### **Caixa** ✅ **NOVO**
- Total de vendas por forma de pagamento
- Ticket médio
- Quantidade de comandas fechadas
- Sangrias realizadas
- Diferença de caixa

---

## 🏆 Sistema de Gamificação

### **Medalhas Disponíveis**

#### **Tipos de Medalha**
- `VELOCISTA` - Entregas rápidas
- `MARATONISTA` - Muitas entregas em um dia
- `PONTUAL` - Entregas no SLA
- `MVP` - 1º lugar no ranking
- `CONSISTENTE` - Top 3 por vários dias

#### **Níveis**
- 🥉 Bronze
- 🥈 Prata
- 🥇 Ouro

#### **Requisitos (Exemplo)**
```json
{
  "VELOCISTA_BRONZE": {
    "entregasRapidas": 10
  },
  "MARATONISTA_OURO": {
    "entregasPorDia": 100
  },
  "PONTUAL_PRATA": {
    "percentualSLA": 95,
    "diasConsecutivos": 7
  }
}
```

### **Sistema de Pontos**

| Ação | Pontos |
|------|--------|
| Entrega rápida (< 2min) | +10 |
| Entrega no SLA (< 5min) | +5 |
| Avaliação positiva (4-5★) | +3 |
| Entrega normal | +1 |

---

## ⚙️ Configurações e Variáveis de Ambiente

### **Backend (.env)**

```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=pub_system

# JWT
JWT_SECRET=seu_secret_super_seguro_aqui

# Frontend
FRONTEND_URL=http://localhost:3001

# Google Cloud Storage (Upload de Imagens)
GCS_BUCKET_NAME=pub-system-uploads
GOOGLE_APPLICATION_CREDENTIALS=./gcs-key.json

# Porta do Backend
PORT=3000
```

### **Frontend (.env.local)**

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 📦 Módulos do Sistema

### **Backend (17 módulos)**

1. **EmpresaModule** - Gestão de empresas
2. **AmbienteModule** - Gestão de ambientes
3. **FuncionarioModule** - Gestão de funcionários
4. **AuthModule** - Autenticação
5. **MesaModule** - Gestão de mesas
6. **ComandaModule** - Gestão de comandas
7. **ClienteModule** - Gestão de clientes
8. **PedidoModule** - Gestão de pedidos
9. **ProdutoModule** - Gestão de produtos
10. **PontoEntregaModule** - Pontos de entrega
11. **EventoModule** - Eventos
12. **PaginaEventoModule** - Páginas de eventos
13. **AvaliacaoModule** - Avaliações
14. **TurnoModule** - Turnos de funcionários
15. **AnalyticsModule** - Analytics e relatórios
16. **MedalhaModule** - Sistema de medalhas
17. **CaixaModule** ✅ **NOVO** - Gestão financeira

### **Frontend (Contextos)**

1. **AuthContext** - Autenticação
2. **TurnoContext** ✅ **NOVO** - Gestão de turnos
3. **CaixaContext** ✅ **NOVO** - Gestão de caixa
4. **SocketContext** ✅ **NOVO** - WebSocket

---

## ✅ Status de Implementação

### **Funcionalidades Core (90%)**

| Funcionalidade | Status | Observações |
|----------------|--------|-------------|
| Autenticação JWT | ✅ Completo | Falta refresh tokens |
| Gestão de Funcionários | ✅ Completo | - |
| Gestão de Mesas | ✅ Completo | - |
| Gestão de Produtos | ✅ Completo | - |
| Gestão de Comandas | ✅ Completo | - |
| Gestão de Pedidos | ✅ Completo | - |
| Cardápio Digital | ✅ Completo | - |
| Portal do Cliente | ✅ Completo | - |
| Kanban de Pedidos | ✅ Completo | - |
| WebSocket | ✅ Completo | - |
| Mapa Visual de Mesas | ✅ Completo | - |
| Eventos | ✅ Completo | - |
| Avaliações | ✅ Completo | - |
| Ranking de Garçons | ✅ Completo | - |
| Sistema de Medalhas | ✅ Completo | - |
| Relatórios Básicos | ✅ Completo | Falta PDF/Excel |

### **Área do Caixa (100%)** ✅ **NOVO**

| Funcionalidade | Status | Observações |
|----------------|--------|-------------|
| Dashboard do Caixa | ✅ Completo | - |
| Abertura de Caixa | ✅ Completo | Com valor inicial |
| Fechamento de Caixa | ✅ Completo | Com conferência |
| Sangrias | ✅ Completo | Com autorização |
| Registro de Vendas | ✅ Completo | 6 formas de pagamento |
| Terminal de Busca | ✅ Completo | Busca inteligente |
| Relatórios Financeiros | ✅ Completo | - |
| Histórico | ✅ Completo | - |

### **Rastreamento (95%)** ✅ **ATUALIZADO**

| Funcionalidade | Status | Observações |
|----------------|--------|-------------|
| Rastreamento de Retirada | ✅ Completo | Por garçom |
| Prevenção de Duplicação | ✅ Completo | - |
| Métricas de Performance | ✅ Completo | - |
| Horários Exatos | ✅ Completo | - |

### **O Que Falta (10%)**

| Funcionalidade | Status | Prioridade |
|----------------|--------|------------|
| Multi-Tenancy | ❌ Não implementado | 🔴 CRÍTICA |
| Integrações de Pagamento | ❌ Não implementado | 🔴 CRÍTICA |
| Refresh Tokens | ❌ Não implementado | 🔴 CRÍTICA |
| Auditoria de Ações | ❌ Não implementado | 🟡 ALTA |
| Testes Automatizados | ❌ Não implementado | 🟡 ALTA |
| Exportação PDF/Excel | ❌ Não implementado | 🟡 ALTA |
| Controle de Estoque | ❌ Não implementado | 🟢 MÉDIA |
| Nota Fiscal Eletrônica | ❌ Não implementado | 🟢 MÉDIA |
| App Mobile Nativo | ❌ Não implementado | 🟢 MÉDIA |

---

## 🎯 Conclusão

O **Pub System** está **90% pronto para produção single-tenant**, com:

✅ **Funcionalidades core completas**  
✅ **Área do caixa 100% implementada**  
✅ **Gestão financeira completa**  
✅ **Rastreamento detalhado**  
✅ **Sistema de gamificação**  
✅ **Comunicação em tempo real**

**Próximos passos:** Multi-tenancy, integrações de pagamento, testes automatizados.

---

**Próximo Documento:** [02-VISAO-ADMINISTRADOR-SISTEMA.md](./02-VISAO-ADMINISTRADOR-SISTEMA.md)
