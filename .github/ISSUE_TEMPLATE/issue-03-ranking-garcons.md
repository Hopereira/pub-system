---
name: Ranking de Garçons
about: Sistema de gamificação com ranking
title: '[FEATURE] Ranking de Garçons (Gamificação)'
labels: feature, backend, frontend, gamification, garçom, priority-medium
assignees: ''
---

## 🏆 Descrição
Sistema de ranking para motivar garçons com base em entregas, tempo médio e avaliações.

## 🎯 Objetivo
Gamificar o trabalho, aumentando produtividade e qualidade.

## 📋 Tarefas

### Backend
- [ ] Criar entidade `RankingGarcom`
- [ ] Criar migration
- [ ] Implementar `RankingService`
- [ ] Job para calcular ranking diário
- [ ] Endpoint `GET /garcom/ranking/hoje`
- [ ] Endpoint `GET /garcom/ranking/evento/:id`
- [ ] Endpoint `GET /garcom/:id/estatisticas`
- [ ] Implementar fórmula de pontuação

### Frontend
- [ ] Card de ranking no dashboard
- [ ] Tela completa de ranking
- [ ] Estatísticas pessoais
- [ ] Gráfico de evolução
- [ ] Comparação com outros

## 📊 Fórmula de Pontuação
```typescript
pontuacao = (totalEntregas * 10) 
          - (tempoMedioEntrega * 2) 
          + (avaliacaoMedia * 20)
          + bonus
```

## 🏗️ Estrutura
```typescript
@Entity('ranking_garcom')
export class RankingGarcom {
  garcom: Funcionario;
  data: Date;
  totalEntregas: number;
  tempoMedioEntrega: number;
  avaliacaoMedia: number;
  pontuacao: number;
  posicaoRanking: number;
}
```

## 📊 Métricas
- 🏆 Posição (#2 de 5)
- ✅ Total entregas (23)
- ⏱️ Tempo médio (8 min)
- ⭐ Avaliação (4.6/5)

## ✅ Critérios de Aceite
- [ ] Ranking calculado automaticamente
- [ ] Atualiza em tempo real
- [ ] Garçom vê posição
- [ ] Estatísticas pessoais
- [ ] Filtro por período
- [ ] Medalhas top 3 🥇🥈🥉

## 🔗 Dependências
- Issue #1 (Entregas)
- Issue #7 (Avaliações)

## ⏱️ Estimativa
**5 dias**
