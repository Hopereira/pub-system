# 🗺️ Roadmap - Sistema do Garçom

## 📋 Visão Geral
Implementação completa do sistema mobile para garçons, incluindo gestão de entregas, pedidos diretos, ranking e controle de presença.

---

## 🎯 Issues Criadas

### Issue #1: Sistema de Entrega de Pedidos ⭐⭐⭐
**Prioridade:** ALTA  
**Estimativa:** 5 dias  
**Arquivo:** `.github/ISSUE_TEMPLATE/issue-01-sistema-entrega.md`

**Funcionalidades:**
- Marcar pedido como entregue
- Registrar garçom responsável
- Calcular tempo de entrega
- Histórico de entregas

---

### Issue #2: Pedido Direto pelo Garçom ⭐⭐⭐
**Prioridade:** ALTA  
**Estimativa:** 8 dias  
**Arquivo:** `.github/ISSUE_TEMPLATE/issue-02-pedido-garcom.md`

**Funcionalidades:**
- Buscar cliente por nome/CPF
- Criar cliente rapidamente
- Fazer pedido sem QR Code
- Cliente vê pedido no celular depois

---

### Issue #3: Ranking de Garçons ⭐⭐
**Prioridade:** MÉDIA  
**Estimativa:** 5 dias  
**Arquivo:** `.github/ISSUE_TEMPLATE/issue-03-ranking-garcons.md`

**Funcionalidades:**
- Ranking diário/por evento
- Gamificação com medalhas
- Estatísticas pessoais
- Comparação com equipe

---

### Issue #4: Check-in/Check-out ⭐⭐
**Prioridade:** MÉDIA  
**Estimativa:** 3 dias  
**Arquivo:** `.github/ISSUE_TEMPLATE/issue-04-checkin-checkout.md`

**Funcionalidades:**
- Registro de presença
- Controle de turnos
- Horas trabalhadas
- Relatórios

---

## 📅 Cronograma Sugerido

### Sprint 1 (2 semanas) - CORE
```
Semana 1:
- Issue #2: Pedido pelo Garçom (dias 1-5)
- Issue #4: Check-in/Check-out (dias 1-3)

Semana 2:
- Issue #1: Sistema de Entrega (dias 1-5)
- Testes integrados (dias 6-7)
```

### Sprint 2 (1 semana) - GAMIFICAÇÃO
```
Semana 3:
- Issue #3: Ranking de Garçons (dias 1-5)
- Testes e ajustes (dias 6-7)
```

---

## 🎯 Ordem de Implementação Recomendada

1. **Issue #4** - Check-in/Check-out (BASE)
   - Necessário para validar garçom ativo
   - Mais simples, entrega valor rápido

2. **Issue #2** - Pedido pelo Garçom (CORE)
   - Funcionalidade mais importante
   - Permite atendimento híbrido

3. **Issue #1** - Sistema de Entrega (CORE)
   - Complementa o fluxo de pedidos
   - Gera dados para ranking

4. **Issue #3** - Ranking (MOTIVAÇÃO)
   - Depende das issues anteriores
   - Gamificação aumenta engajamento

---

## 📊 Dependências

```
Issue #4 (Check-in)
    ↓
Issue #2 (Pedido Garçom)
    ↓
Issue #1 (Entrega)
    ↓
Issue #3 (Ranking)
```

---

## ✅ Checklist de Implementação

### Fase 1: Preparação
- [ ] Criar branch `feature/sistema-garcom`
- [ ] Revisar arquitetura atual
- [ ] Definir padrões de código
- [ ] Configurar ambiente de testes

### Fase 2: Desenvolvimento
- [ ] Implementar Issue #4
- [ ] Implementar Issue #2
- [ ] Implementar Issue #1
- [ ] Implementar Issue #3

### Fase 3: Testes
- [ ] Testes unitários (backend)
- [ ] Testes de integração
- [ ] Testes E2E
- [ ] Testes de performance

### Fase 4: Deploy
- [ ] Code review
- [ ] Merge para develop
- [ ] Deploy em staging
- [ ] Testes de aceitação
- [ ] Deploy em produção

---

## 🎨 Design System

### Cores
- 🟢 Verde: Ações positivas (check-in, entrega)
- 🔴 Vermelho: Urgente (pedido pronto há muito tempo)
- 🟡 Amarelo: Atenção (pedido pronto)
- 🔵 Azul: Informação
- 🟣 Roxo: Ranking/Gamificação

### Ícones
- 📦 Entrega
- 📝 Novo pedido
- 🏆 Ranking
- ⏰ Check-in/out
- 🔔 Notificação

---

## 📱 Telas Mobile

### Dashboard do Garçom
```
┌─────────────────────────────────┐
│ 👤 Paulo Silva | 🟢 Ativo       │
├─────────────────────────────────┤
│ 📊 Hoje                         │
│ ✅ 23 entregas                  │
│ ⏱️ 8 min médio                  │
│ 🏆 #2 de 5                      │
├─────────────────────────────────┤
│ 🔔 PEDIDOS PRONTOS (3)          │
│ [Mesa 5] 2x Hambúrguer          │
│ [ENTREGAR]                      │
├─────────────────────────────────┤
│ [Novo Pedido] [Ver Ranking]    │
└─────────────────────────────────┘
```

---

## 🚀 Próximos Passos

1. **Revisar issues criadas**
2. **Ajustar estimativas se necessário**
3. **Criar issues no GitHub**
4. **Começar pela Issue #4**

---

## 📚 Documentação

Cada issue tem:
- ✅ Descrição clara
- ✅ Objetivos definidos
- ✅ Tarefas detalhadas
- ✅ Estrutura técnica
- ✅ Critérios de aceite
- ✅ Estimativa de tempo

---

**Status:** 📝 PLANEJADO  
**Data:** 04/11/2025  
**Próxima ação:** Criar issues no GitHub e começar desenvolvimento
