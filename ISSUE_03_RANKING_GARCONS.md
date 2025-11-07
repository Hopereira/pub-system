# Issue #3: Ranking de Garçons - Implementação

**Branch:** `feature/ranking-garcons`  
**Prioridade:** MÉDIA  
**Estimativa:** 5 dias  
**Status:** 🚧 EM DESENVOLVIMENTO (85% COMPLETO)

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

### Backend (60% estimado) ✅ 90% COMPLETO

#### Fase 1: Métricas Avançadas ✅ COMPLETO
- [x] Service analytics básico já existe
- [x] Performance de garçons já calculada
- [x] **Adicionar métricas de reação e entrega final**
  - `tempo_reacao_minutos` (PRONTO → RETIRADO)
  - `tempo_entrega_final_minutos` (RETIRADO → ENTREGUE)
  - Percentual SLA (<2min reação = ótimo)
  
#### Fase 2: Novos Endpoints ✅ COMPLETO
- [x] `GET /analytics/garcons/ranking`
  - Query params: `periodo` (hoje/semana/mes), `ambienteId`
  - Retornar ranking ordenado por pontuação
  - Incluir posição, nome, avatar, pontos, medalhas
  
- [x] `GET /analytics/garcons/:id/estatisticas`
  - Estatísticas detalhadas de um garçom
  - Histórico de performance
  - Evolução diária (últimos 7 dias)
  
- [x] `GET /medalhas/garcom/:id` ✅ NOVO
  - Lista de medalhas conquistadas
  
- [x] `GET /medalhas/garcom/:id/progresso` ✅ NOVO
  - Progresso de medalhas em andamento
  - Próximas conquistas disponíveis
  
- [x] `GET /medalhas/garcom/:id/verificar` ✅ NOVO
  - Verifica e concede novas medalhas

#### Fase 3: Sistema de Pontuação ✅ COMPLETO
- [x] Criar lógica de pontuação em `getRankingGarcons()`
  - Calcular pontos por entrega (base: 10 pontos)
  - Bônus de velocidade (entrega <2min: +5 pontos)
  - Bônus de volume (>20 entregas/dia: +50 pontos)
  - Penalidade por atraso (>5min: -3 pontos por minuto extra)
  - Bônus de SLA (95%: +100 pontos, 90%: +50 pontos)

#### Fase 4: Sistema de Medalhas ✅ 90% COMPLETO
- [x] Criar enum `TipoMedalha` ✅
  - VELOCISTA (entregas rápidas)
  - MARATONISTA (volume de entregas)
  - PONTUAL (consistência SLA)
  - MVP (primeiro lugar)
  - CONSISTENTE (top ranking)
  - ROOKIE (primeira entrega)
  
- [x] Criar enum `NivelMedalha` ✅
  - BRONZE, PRATA, OURO
  
- [x] Criar entity `Medalha` ✅
  - `id`, `tipo`, `nome`, `descricao`, `icone`, `nivel`
  - `requisitos` (JSONB flexível)
  - `ativo` (boolean)
  
- [x] Criar entity `MedalhaGarcom` ✅
  - Relação com Funcionario
  - `conquistadaEm`, `metadata` (JSONB)
  - Unique constraint (funcionario_id, medalha_id)
  
- [x] Criar migration `CreateMedalhasTables` ✅
  - 16 medalhas pré-configuradas
  - 3 níveis × 5 tipos + ROOKIE
  
- [x] Criar `MedalhaService` ✅
  - getMedalhasGarcom()
  - getProgressoMedalhas()
  - verificarNovasMedalhas()
  - calcularEstatisticas()
  - verificarRequisitos()
  
- [x] Criar `MedalhaController` ✅
  - Rotas configuradas
  
- [x] Criar `MedalhaModule` ✅
  - Registrado no AppModule

#### Fase 5: Jobs Automáticos ✅ 80% COMPLETO
- [x] `MedalhaScheduler` criado ✅
  - Roda a cada 5 minutos
  - Verifica todos os garçons ativos
  - Detecta novas medalhas conquistadas
  - Emite evento WebSocket `medalha_conquistada`
- [ ] Implementar detecção completa de todos os tipos (PONTUAL, MVP, CONSISTENTE pendentes)

---

### Frontend (40% estimado) ✅ 80% COMPLETO

#### Fase 1: Tipos e Services ✅ COMPLETO
- [x] `src/types/ranking.ts`
  - RankingGarcom, Medalha, EstatisticasGarcom
  - TipoMedalha, NivelMedalha enums
  - RankingResponse, EvolucaoDiaria
  
- [x] `src/services/rankingService.ts` ✅ COMPLETO
  - getRanking(periodo, ambienteId, limite)
  - getEstatisticas(garcomId, periodo)
  - getMedalhas(garcomId) ✅ IMPLEMENTADO
  - getProgressoMedalhas(garcomId) ✅ IMPLEMENTADO
  - verificarNovasMedalhas(garcomId) ✅ IMPLEMENTADO

#### Fase 2: Componentes ✅ COMPLETO
- [x] `src/components/ranking/PodiumCard.tsx`
  - Top 3 com visual de pódio (🥇🥈🥉)
  - Animações de brilho (animate-pulse no 1º)
  - Cores diferenciadas (ouro/prata/bronze)
  - Gradientes e sombras
  
- [x] `src/components/ranking/RankingTable.tsx`
  - Tabela completa do ranking
  - Colunas: Pos, Nome, Pontos, Entregas, Reação, SLA, Tendência
  - Highlight do garçom logado (fundo azul)
  - Badges coloridos por SLA
  - Ícones de tendência (TrendingUp/Down/Minus)
  
- [x] `src/components/ranking/MedalhasBadge.tsx` ✅ NOVO
  - Badge visual de medalhas
  - Tooltip com detalhes
  - Efeito visual por nível (drop-shadow)
  - Contador "+X" quando há muitas
  
- [x] `src/components/ranking/ProgressoMedalha.tsx` ✅ NOVO
  - Card de progresso de conquista
  - Barra de progresso (Progress component)
  - "Faltam X entregas para conseguir VELOCISTA"
  - Badge de nível colorido
  
- [ ] `src/components/ranking/EstatisticasGarcom.tsx`
  - Gráfico de linha: evolução de pontos
  - Cards de métricas: total entregas, média tempo, SLA
  - Histórico de medalhas conquistadas

#### Fase 3: Páginas ✅ COMPLETO
- [x] `src/app/(protected)/garcom/ranking/page.tsx` ✅ ATUALIZADO
  - Filtros de período (Hoje/Semana/Mês)
  - Pódio visual (PodiumCard)
  - Cards de estatísticas pessoais (4 métricas)
  - **Seção "Suas Medalhas"** ✅ NOVO
  - **Seção "Próximas Conquistas"** ✅ NOVO
  - Tabela de ranking completo
  - Comparação com próximo colocado
  - Highlight do garçom logado
  - Botão de refresh
  - Loading states
  
- [ ] `src/app/(protected)/dashboard/ranking/page.tsx`
  - Versão para admin/gerente
  - Visão completa da equipe
  - Comparação entre ambientes
  - Exportar relatório

#### Fase 4: WebSocket e Tempo Real ❌ PENDENTE
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
