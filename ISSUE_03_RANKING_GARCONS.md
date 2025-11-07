# Issue #3: Ranking de Garçons - Implementação

**Branch:** `feature/ranking-garcons`  
**Prioridade:** MÉDIA  
**Estimativa:** 5 dias  
**Status:** 🚧 EM DESENVOLVIMENTO

---

## 🎯 Objetivo

Implementar sistema de ranking e gamificação para garçons, exibindo:
- Ranking em tempo real (diário/semanal/mensal)
- Estatísticas de performance individuais
- Medalhas e conquistas
- Comparação com a equipe
- Métricas de eficiência

---

## 📋 Checklist de Implementação

### Backend (60% estimado) 🚧

#### Fase 1: Métricas Avançadas ✅
- [x] Service analytics básico já existe
- [x] Performance de garçons já calculada
- [ ] **Adicionar métricas de reação e entrega final**
  - `tempo_reacao_minutos` (PRONTO → RETIRADO)
  - `tempo_entrega_final_minutos` (RETIRADO → ENTREGUE)
  - Percentual SLA (<2min reação = ótimo)
  
#### Fase 2: Novos Endpoints ❌
- [ ] `GET /analytics/garcons/ranking`
  - Query params: `periodo` (hoje/semana/mes), `ambienteId`
  - Retornar ranking ordenado por pontuação
  - Incluir posição, nome, avatar, pontos, medalhas
  
- [ ] `GET /analytics/garcons/:id/estatisticas`
  - Estatísticas detalhadas de um garçom
  - Histórico de performance
  - Gráficos de evolução
  
- [ ] `GET /analytics/garcons/:id/medalhas`
  - Lista de medalhas conquistadas
  - Progresso de medalhas em andamento
  - Próximas conquistas disponíveis

#### Fase 3: Sistema de Pontuação ❌
- [ ] Criar `PontuacaoService`
  - Calcular pontos por entrega (base: 10 pontos)
  - Bônus de velocidade (entrega <2min: +5 pontos)
  - Bônus de volume (>20 entregas/dia: +50 pontos)
  - Penalidade por atraso (>5min: -3 pontos)

#### Fase 4: Sistema de Medalhas ❌
- [ ] Criar enum `TipoMedalha`
  ```typescript
  enum TipoMedalha {
    VELOCISTA = 'VELOCISTA',           // 50 entregas <2min
    MARATONISTA = 'MARATONISTA',       // 100+ entregas em um dia
    PONTUAL = 'PONTUAL',               // 95% SLA por 7 dias
    MVP = 'MVP',                       // #1 do ranking semanal
    CONSISTENTE = 'CONSISTENTE',       // Top 3 por 30 dias
    ROOKIE = 'ROOKIE',                 // Primeira entrega
  }
  ```
  
- [ ] Criar entity `Medalha`
  - `id`, `tipo`, `nome`, `descricao`, `icone`, `requisitos`
  
- [ ] Criar entity `MedalhaGarcom`
  - Relação com Funcionario
  - `conquistadaEm`, `nivel` (bronze/prata/ouro)

#### Fase 5: Jobs Automáticos ❌
- [ ] `AtualizarRankingScheduler`
  - Roda a cada 5 minutos
  - Recalcula pontos e posições
  - Detecta novas medalhas conquistadas
  - Emite evento WebSocket `ranking_atualizado`

---

### Frontend (40% estimado) ❌

#### Fase 1: Tipos e Services ❌
- [ ] `src/types/ranking.ts`
  ```typescript
  interface RankingGarcom {
    posicao: number;
    funcionarioId: string;
    nome: string;
    avatar?: string;
    pontos: number;
    totalEntregas: number;
    tempoMedioReacao: number;
    tempoMedioEntrega: number;
    percentualSLA: number;
    medalhas: Medalha[];
    tendencia: 'subindo' | 'descendo' | 'estavel';
  }
  
  interface Medalha {
    tipo: string;
    nome: string;
    descricao: string;
    icone: string;
    nivel: 'bronze' | 'prata' | 'ouro';
    conquistadaEm: string;
  }
  ```
  
- [ ] `src/services/rankingService.ts`
  ```typescript
  getRanking(periodo: string, ambienteId?: string)
  getEstatisticas(garcomId: string)
  getMedalhas(garcomId: string)
  ```

#### Fase 2: Componentes ❌
- [ ] `src/components/ranking/PodiumCard.tsx`
  - Top 3 com visual de pódio (🥇🥈🥉)
  - Animações de brilho
  - Fotos dos garçons
  
- [ ] `src/components/ranking/RankingTable.tsx`
  - Tabela completa do ranking
  - Colunas: Pos, Nome, Pontos, Entregas, SLA, Tendência
  - Highlight do garçom logado
  - Filtros por período
  
- [ ] `src/components/ranking/MedalhasBadge.tsx`
  - Badge visual de medalhas
  - Tooltip com detalhes
  - Contador de medalhas por nível
  
- [ ] `src/components/ranking/ProgressoMedalha.tsx`
  - Card de progresso de conquista
  - Barra de progresso
  - "Faltam X entregas para conseguir VELOCISTA"
  
- [ ] `src/components/ranking/EstatisticasGarcom.tsx`
  - Gráfico de linha: evolução de pontos
  - Cards de métricas: total entregas, média tempo, SLA
  - Histórico de medalhas conquistadas

#### Fase 3: Páginas ❌
- [ ] `src/app/(protected)/garcom/ranking/page.tsx`
  - **Layout:**
    ```
    ┌─────────────────────────────────────┐
    │ 🏆 Ranking de Garçons               │
    │ [Hoje] [Semana] [Mês]              │
    ├─────────────────────────────────────┤
    │       🥇 Paulo   🥈 Ana   🥉 João   │
    │      1200pts    980pts   850pts     │
    ├─────────────────────────────────────┤
    │ 4. Maria Silva        720pts  ↑    │
    │ 5. José Costa         680pts  ↓    │
    │ 6. YOU → Pedro Lima   650pts  -    │
    ├─────────────────────────────────────┤
    │ 📊 Suas Estatísticas                │
    │ ✅ 45 entregas   ⏱️ 1.8min   📈 96% │
    │                                      │
    │ 🏅 Suas Medalhas (3)                │
    │ [🥇 VELOCISTA] [🥈 PONTUAL] [🥉 ROOKIE] │
    │                                      │
    │ 🎯 Próximas Conquistas              │
    │ ▓▓▓▓▓▓▓░░░ 75% MARATONISTA         │
    │ ▓▓░░░░░░░░ 25% MVP                 │
    └─────────────────────────────────────┘
    ```
  
- [ ] `src/app/(protected)/dashboard/ranking/page.tsx`
  - Versão para admin/gerente
  - Visão completa da equipe
  - Comparação entre ambientes
  - Exportar relatório

#### Fase 4: WebSocket e Tempo Real ❌
- [ ] Escutar evento `ranking_atualizado`
- [ ] Atualizar posições automaticamente
- [ ] Notificação quando subir/descer no ranking
- [ ] Notificação de medalha conquistada (confete 🎉)

#### Fase 5: Animações e UX ❌
- [ ] Animação de subida/descida no ranking (setas)
- [ ] Efeito de brilho nas medalhas
- [ ] Confete quando conquista medalha
- [ ] Comparação com ontem ("+20 pontos", "+2 posições")
- [ ] Modo competitivo: "Você está X pontos do próximo"

---

## 🎨 Design System

### Cores
- 🥇 **Ouro**: `#FFD700` - 1º lugar
- 🥈 **Prata**: `#C0C0C0` - 2º lugar
- 🥉 **Bronze**: `#CD7F32` - 3º lugar
- 🟢 **Verde**: Performance boa (SLA >95%)
- 🟡 **Amarelo**: Performance média (SLA 85-95%)
- 🔴 **Vermelho**: Performance ruim (SLA <85%)
- 🔵 **Azul**: Destaque do usuário logado

### Ícones
- 🏆 Trophy - Ranking geral
- 🥇🥈🥉 Medalhas - Pódio
- ⚡ Zap - Velocista
- 🎯 Target - MVP
- 📈 TrendingUp - Subindo
- 📉 TrendingDown - Descendo
- ➡️ Minus - Estável

---

## 📊 Fórmula de Pontuação

```typescript
// Base
pontos = totalEntregas * 10;

// Bônus de velocidade
if (tempoMedioReacao < 2min) {
  pontos += totalEntregas * 5;
}

// Bônus de volume
if (totalEntregas >= 20) {
  pontos += 50;
}
if (totalEntregas >= 50) {
  pontos += 100;
}

// Bônus de SLA
if (percentualSLA >= 95) {
  pontos += 100;
}

// Penalidade de atraso
const atrasados = entregas.filter(e => e.tempoReacao > 5min);
pontos -= atrasados.length * 3;

// Garantir não negativo
pontos = Math.max(pontos, 0);
```

---

## 🎯 Critérios de Medalhas

| Medalha | Bronze | Prata | Ouro |
|---------|--------|-------|------|
| **VELOCISTA** | 10 entregas <2min | 25 entregas <2min | 50 entregas <2min |
| **MARATONISTA** | 30 entregas/dia | 60 entregas/dia | 100 entregas/dia |
| **PONTUAL** | SLA 90% por 3 dias | SLA 95% por 7 dias | SLA 98% por 30 dias |
| **MVP** | Top 5 semanal | Top 3 semanal | #1 semanal |
| **CONSISTENTE** | Top 5 por 7 dias | Top 3 por 15 dias | Top 3 por 30 dias |

---

## 🧪 Testes

### Backend
- [ ] Cálculo de pontos correto
- [ ] Ranking ordenado corretamente
- [ ] Detecção de medalhas
- [ ] Filtros de período funcionando
- [ ] Performance com muitos dados

### Frontend
- [ ] Renderização do pódio
- [ ] Atualização em tempo real
- [ ] Animações de transição
- [ ] Responsividade mobile
- [ ] Filtros e navegação

---

## 📅 Cronograma

### Dia 1-2: Backend Base
- Endpoints de ranking
- Sistema de pontuação
- Testes unitários

### Dia 3: Backend Avançado
- Sistema de medalhas
- Jobs automáticos
- WebSocket events

### Dia 4: Frontend Base
- Tipos e services
- Componentes básicos
- Página do garçom

### Dia 5: Frontend Avançado
- Animações e UX
- WebSocket integration
- Testes E2E

---

## 🚀 Próximos Passos

1. ✅ Criar branch `feature/ranking-garcons`
2. ✅ Documentar plano de implementação
3. [ ] Estender analytics service com métricas de reação
4. [ ] Criar endpoints de ranking
5. [ ] Implementar sistema de pontuação
6. [ ] Criar sistema de medalhas
7. [ ] Implementar frontend
8. [ ] Testes e ajustes
9. [ ] Criar PR

---

**Iniciado em:** 07/11/2025  
**Última atualização:** 07/11/2025
