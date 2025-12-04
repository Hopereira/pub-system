# 🔧 DETALHES TÉCNICOS - PUB SYSTEM

**Data:** 11/11/2025  
**Complemento ao:** RELATORIO_VARREDURA_SISTEMA.md

---

## 📦 ESTRUTURA DE PASTAS

### Backend
```
backend/src/
├── auth/                  # JWT + Passport
├── database/             
│   └── migrations/       # 4 migrations principais
├── modulos/
│   ├── ambiente/         # 8 arquivos
│   ├── analytics/        # 3 arquivos
│   ├── avaliacao/        # 6 arquivos
│   ├── cliente/          # 9 arquivos
│   ├── comanda/          # 12 arquivos
│   ├── empresa/          # 6 arquivos
│   ├── evento/           # 6 arquivos
│   ├── funcionario/      # 10 arquivos
│   ├── medalha/          # 8 arquivos ⚠️ 90%
│   ├── mesa/             # 9 arquivos
│   ├── pagina-evento/    # 6 arquivos
│   ├── pedido/           # 21 arquivos
│   ├── ponto-entrega/    # 6 arquivos
│   ├── produto/          # 8 arquivos
│   └── turno/            # 7 arquivos ✅ Backend
├── shared/               # Utilitários
└── types/                # Tipos globais
```

### Frontend
```
frontend/src/
├── app/
│   ├── (auth)/           # Login
│   ├── (cliente)/        # QR Code público
│   ├── (protected)/
│   │   ├── dashboard/    # Admin/Gerente
│   │   └── garcom/       # Sistema garçom ⚠️ 95%
│   └── (public)/         # Landing pages
├── components/
│   ├── layout/           # Sidebar, Header
│   ├── mapa/             # Mapa visual
│   ├── pedidos/          # Cards pedidos
│   ├── ranking/          # Ranking/medalhas
│   └── ui/               # shadcn/ui
├── hooks/                # 7 hooks custom
├── services/             # 18 services ✅
└── types/                # 24 tipos
```

---

## 🗄️ BANCO DE DADOS

### Tabelas Principais (30+)

**Core:**
- empresas
- ambientes
- funcionarios (5 roles)
- clientes

**Operacional:**
- mesas (com x, y, rotação)
- pontos_entrega (com x, y)
- produtos
- comandas
- comandas_agregados
- pedidos
- itens_pedido (6 status)

**Rastreamento:**
- turnos (check-in/out)
- medalhas (16 medalhas)
- medalhas_garcons

**Eventos:**
- eventos
- paginas_evento
- avaliacoes

### Status de Pedidos

```typescript
enum PedidoStatus {
  FEITO           // Criado
  EM_PREPARO      // Iniciado
  QUASE_PRONTO    // 70% do tempo (automático)
  PRONTO          // Finalizado
  RETIRADO        // Garçom retirou
  ENTREGUE        // Cliente recebeu
}
```

### Campos de Rastreamento

**itens_pedido:**
```sql
iniciado_em                 TIMESTAMP
pronto_em                   TIMESTAMP
quase_pronto_em             TIMESTAMP (automático)
retirado_em                 TIMESTAMP
entregue_em                 TIMESTAMP
retirado_por_garcom_id      UUID
garcom_entrega_id           UUID
tempo_preparo_minutos       INT (calculado)
tempo_reacao_minutos        INT (PRONTO → RETIRADO)
tempo_entrega_final_minutos INT (RETIRADO → ENTREGUE)
```

---

## 🔌 ENDPOINTS PRINCIPAIS

### Autenticação
```
POST /auth/login
GET  /auth/profile
```

### Pedidos
```
POST  /pedidos
GET   /pedidos?ambienteId=X
PATCH /pedidos/item/:id/status
PATCH /pedidos/item/:id/retirar
PATCH /pedidos/item/:id/marcar-entregue
```

### Analytics
```
GET /analytics/pedidos/relatorio-geral
GET /analytics/garcons/performance
GET /analytics/garcons/ranking?periodo=HOJE|SEMANA|MES
GET /analytics/ambientes/performance
GET /analytics/produtos/mais-vendidos
```

### Turnos ✅ Backend
```
POST /turnos/check-in
POST /turnos/check-out
GET  /turnos/ativos
GET  /turnos/funcionario/:id
GET  /turnos/funcionario/:id/estatisticas
```

### Medalhas ⚠️ 90%
```
GET  /medalhas/garcom/:id
GET  /medalhas/garcom/:id/progresso
POST /medalhas/garcom/:id/verificar
```

### Mesas
```
GET /mesas
GET /mesas/com-detalhes  # Com cliente e tempo
```

---

## 🔔 WEBSOCKET

### Eventos Emitidos (Backend)

```typescript
// Pedidos
novo_pedido
novo_pedido_ambiente:{id}
status_atualizado
status_atualizado_ambiente:{id}

// Fluxo garçom
item_quase_pronto
item_retirado
item_entregue
item_deixado_no_ambiente

// Outros
comanda_atualizada
medalha_conquistada  // ⚠️ Emitido mas não escutado
```

### Hook Frontend

```typescript
// useAmbienteNotification.ts
const { pedidos } = useAmbienteNotification(ambienteId);
// - Conecta automaticamente
// - Toca som para novos
// - Destaca por 5s
// - Reconexão automática
```

---

## 🎨 COMPONENTES PRINCIPAIS

### Mapa Visual
```
VisualizadorMapa.tsx
├── Grid 2D com mesas
├── Cores por status
├── Nome cliente + tempo
├── Click → Sheet ações
└── Pontos de entrega
```

### Gestão Pedidos
```
MapaPedidos.tsx
├── 6 cards métricas
├── Filtros ambiente/status
├── Som notificação
├── Botão localizar
└── WebSocket tempo real
```

### Ranking
```
RankingPage.tsx
├── Filtros período
├── PodiumCard (top 3)
├── Cards estatísticas
├── MedalhasBadge ⚠️ 90%
├── ProgressoMedalha
└── RankingTable
```

---

## 🔐 AUTENTICAÇÃO

### Fluxo
```
1. Login → POST /auth/login
2. Recebe JWT token
3. Salva em localStorage
4. Adiciona em headers (axios)
5. Guards verificam role
6. Redireciona por cargo
```

### Roles e Acesso

```typescript
ADMIN:
  ✅ /dashboard (tudo)
  ✅ /garcom (supervisão)
  
GERENTE:
  ✅ /dashboard (operacional + relatórios)
  ✅ /garcom (supervisão)
  
CAIXA:
  ✅ /dashboard (limitado)
  ✅ /caixa
  ❌ /garcom
  
GARCOM:
  ❌ /dashboard (bloqueado)
  ✅ /garcom (completo)
  
COZINHA:
  ✅ /cozinha
  ✅ /dashboard/gestaopedidos
  ❌ /garcom
```

---

## ⚙️ JOBS AUTOMÁTICOS

### QuaseProntoScheduler
```typescript
@Cron('*/15 * * * * *')  // A cada 15s
async marcarQuasePronto() {
  // 1. Busca itens EM_PREPARO
  // 2. Calcula tempo médio histórico
  // 3. Usa 70% do tempo como alvo
  // 4. Marca QUASE_PRONTO
  // 5. Emite evento WebSocket
}
```

### MedalhaScheduler ⚠️ 90%
```typescript
@Cron(CronExpression.EVERY_5_MINUTES)
async verificarMedalhas() {
  // 1. Busca garçons ativos
  // 2. Calcula estatísticas
  // 3. Verifica requisitos
  // 4. Concede medalhas
  // 5. Emite evento
  
  // ✅ ROOKIE, VELOCISTA, MARATONISTA
  // ⏳ PONTUAL, MVP, CONSISTENTE
}
```

---

## 📊 SISTEMA DE MEDALHAS

### 16 Medalhas Configuradas

**VELOCISTA** (entregas <2min)
- Bronze: 10 entregas
- Prata: 25 entregas
- Ouro: 50 entregas

**MARATONISTA** (volume)
- Bronze: 30/dia
- Prata: 60/dia
- Ouro: 100/dia

**PONTUAL** (SLA) ⏳ Não detectado
- Bronze: 90% por 3 dias
- Prata: 95% por 7 dias
- Ouro: 98% por 30 dias

**MVP** (primeiro lugar) ⏳ Não detectado
- Bronze: Top 5 semanal
- Prata: Top 3 semanal
- Ouro: #1 semanal

**CONSISTENTE** (top ranking) ⏳ Não detectado
- Bronze: Top 5 por 7 dias
- Prata: Top 3 por 15 dias
- Ouro: Top 3 por 30 dias

**ROOKIE** (primeira entrega)
- Única medalha

### Detecção Automática

**Implementado (3/6):**
- ✅ ROOKIE - Primeira entrega
- ✅ VELOCISTA - Conta entregas rápidas
- ✅ MARATONISTA - Conta total entregas/dia

**Pendente (3/6):**
- ⏳ PONTUAL - Requer histórico SLA
- ⏳ MVP - Requer avaliações
- ⏳ CONSISTENTE - Requer ranking histórico

---

## 🧪 TESTES

### Scripts Disponíveis

**Setup:**
- `setup.ps1` - Configuração completa
- `verify-setup.ps1` - Verificação
- `docker-start.ps1` - Iniciar
- `docker-rebuild.ps1` - Rebuild

**Testes:**
- `test-medalhas.ps1` - Testa medalhas
- `test-quase-pronto.sql` - Verifica status

**Migrations:**
- `executar-migration-avaliacao.ps1`
- `executar-migration-tempo.ps1`

### Dados de Teste

**SQL:**
- `create-admin.sql` - Cria admin
- `check-ambiente.sql` - Verifica ambientes
- `check-pedido.sql` - Verifica pedidos
- `check-users.sql` - Lista usuários

---

## 📝 DOCUMENTAÇÃO

### Principais (70+ arquivos)

**Essenciais:**
- README.md
- SETUP.md
- MIGRATIONS.md
- DOCUMENTACAO_TECNICA_COMPLETA.md

**Sistema Garçom:**
- ROADMAP_GARCOM.md
- MAPA_VISUAL_GARCOM.md
- PEDIDO_RAPIDO_MAPA.md
- MELHORIAS_GESTAO_PEDIDOS_GARCOM.md

**Funcionalidades:**
- SISTEMA_RASTREAMENTO_COMPLETO.md
- SISTEMA_ENTREGA_COMPLETO.md
- SISTEMA_MEDALHAS_IMPLEMENTADO.md
- MODULO_RELATORIOS_IMPLEMENTADO.md

**Issues:**
- ISSUE_03_RANKING_GARCONS.md
- issue-01-sistema-entrega.md
- issue-02-pedido-garcom.md
- issue-03-ranking-garcons.md
- issue-04-checkin-checkout.md

---

## 🔍 ARQUIVOS CRÍTICOS FALTANTES

### Frontend

**1. Página Check-in** ❌
```
frontend/src/app/(protected)/garcom/presenca/page.tsx
```

**2. Componentes Turno** ❌
```
frontend/src/components/turno/CheckInButton.tsx
frontend/src/components/turno/StatusTurno.tsx
frontend/src/components/turno/TempoTrabalhado.tsx
```

### Backend

**3. Detecção Medalhas** ⚠️
```
backend/src/modulos/medalha/medalha.service.ts
// Adicionar lógica PONTUAL, MVP, CONSISTENTE
```

---

## ✅ CONCLUSÃO TÉCNICA

**Sistema robusto e bem arquitetado:**
- Separação clara backend/frontend
- TypeScript end-to-end
- WebSocket para tempo real
- Rastreamento completo
- Jobs automáticos
- Documentação extensa

**Falta apenas:**
- 1 página frontend (check-in)
- 3 componentes UI
- Lógica de 3 medalhas

**Tempo para 100%:** 5-8 dias
