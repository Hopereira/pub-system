# 📊 Análise Completa - Issues do Sistema de Garçom

**Data:** 06/11/2025  
**Status:** Análise Pré-Implementação

---

## 🎯 Visão Geral das Issues

### Issue #1: Sistema de Entrega de Pedidos ⭐⭐⭐
**Status:** ❌ NÃO INICIADA  
**Prioridade:** ALTA  
**Estimativa:** 5 dias

### Issue #2: Pedido Direto pelo Garçom ⭐⭐⭐
**Status:** 🟡 PARCIALMENTE IMPLEMENTADA  
**Prioridade:** ALTA  
**Estimativa:** 8 dias → ~3 dias restantes

### Issue #3: Ranking de Garçons ⭐⭐
**Status:** ❌ NÃO INICIADA  
**Prioridade:** MÉDIA  
**Estimativa:** 5 dias

### Issue #4: Check-in/Check-out ⏰
**Status:** ✅ 90% COMPLETA  
**Prioridade:** MÉDIA  
**Estimativa:** 3 dias → CONCLUÍDA

---

## ✅ Issue #4: Check-in/Check-out (90% COMPLETO)

### Backend - 100% ✅
- [x] Entidade `TurnoFuncionario`
- [x] Migration criada e executada
- [x] DTOs (CheckIn, CheckOut, Response, Estatísticas)
- [x] Service completo
- [x] Controller com 5 endpoints
- [x] Validações (check-in duplicado, funcionário existe)
- [x] Cálculo automático de horas
- [x] Fechamento automático após 12h
- [x] Logs estruturados

**Endpoints:**
```
POST /turnos/check-in
POST /turnos/check-out
GET /turnos/ativos
GET /turnos/funcionario/:id
GET /turnos/funcionario/:id/estatisticas
```

### Frontend Mobile - 100% ✅
- [x] Componente `CardCheckIn.tsx`
- [x] Hook `useTurno.ts`
- [x] Service `turnoService.ts`
- [x] Integração na página `/garcom`
- [x] Status ativo/inativo visual
- [x] Tempo trabalhado em tempo real
- [x] Lista de colegas ativos
- [x] Estatísticas do mês
- [x] Toast notifications
- [x] Loading states

### Frontend Desktop - 0% ⏳
- [ ] Dashboard de presença
- [ ] Relatórios de horas
- [ ] Exportação (Excel/PDF)

**Conclusão:** Backend e Mobile 100% prontos. Desktop será Issue #219 separada.

---

## 🟡 Issue #2: Pedido Direto pelo Garçom (PARCIAL)

### Backend - 30% ✅

#### ✅ Já Implementado:
1. **Busca de Clientes**
   - [x] `GET /clientes/by-cpf?cpf=...` (público)
   - [x] Service `findByCpf()`
   
2. **Criação de Cliente**
   - [x] `POST /clientes` (público)
   - [x] DTO `CreateClienteDto`

3. **Sistema de Pedidos**
   - [x] `POST /pedidos` (protegido)
   - [x] `POST /pedidos/cliente` (público)
   - [x] Service completo
   - [x] WebSocket integrado

#### ❌ Falta Implementar:
1. **Busca Flexível**
   - [ ] `GET /clientes/buscar?q={termo}` (busca por nome)
   - [ ] Busca case-insensitive
   - [ ] Busca parcial (LIKE %termo%)

2. **Cliente Rápido**
   - [ ] `POST /clientes/rapido` (campos mínimos)
   - [ ] DTO simplificado

3. **Pedido pelo Garçom**
   - [ ] `POST /pedidos/garcom` (endpoint específico)
   - [ ] Validar garçom ativo (check-in)
   - [ ] Criar/abrir comanda automaticamente
   - [ ] Vincular pedido ao garçom

### Frontend Mobile - 0% ❌
- [ ] Tela "Novo Pedido"
- [ ] Campo de busca de cliente
- [ ] Formulário rápido de cliente
- [ ] Seleção de produtos
- [ ] Carrinho de itens
- [ ] Botão "Enviar para Cozinha"

**Estimativa Restante:** ~3 dias

---

## ❌ Issue #1: Sistema de Entrega (NÃO INICIADA)

### Backend - 0%
- [ ] Adicionar campo `garcomEntregaId` em `ItemPedido`
- [ ] Adicionar campo `dataEntrega` em `ItemPedido`
- [ ] Adicionar campo `tempoEntrega` (minutos)
- [ ] Endpoint `PATCH /pedidos/item/:id/entregar`
- [ ] Service `marcarComoEntregue()`
- [ ] Validar garçom ativo
- [ ] Calcular tempo de entrega
- [ ] WebSocket para notificar entrega

### Frontend Mobile - 0%
- [ ] Botão "Marcar como Entregue"
- [ ] Confirmação de entrega
- [ ] Histórico de entregas
- [ ] Estatísticas de entregas

**Estimativa:** 5 dias

---

## ❌ Issue #3: Ranking de Garçons (NÃO INICIADA)

### Backend - 0%
- [ ] Entidade `RankingGarcom`
- [ ] Migration
- [ ] Service `RankingService`
- [ ] Job para calcular ranking diário
- [ ] Endpoint `GET /garcom/ranking/hoje`
- [ ] Endpoint `GET /garcom/ranking/evento/:id`
- [ ] Endpoint `GET /garcom/:id/estatisticas`
- [ ] Fórmula de pontuação

### Frontend Mobile - 0%
- [ ] Card de ranking no dashboard
- [ ] Tela completa de ranking
- [ ] Estatísticas pessoais
- [ ] Gráfico de evolução
- [ ] Comparação com outros
- [ ] Medalhas top 3 🥇🥈🥉

**Estimativa:** 5 dias

**Dependências:** Issue #1 (precisa de dados de entregas)

---

## 📊 Resumo Geral

### Progresso Total
```
Issue #4: ████████████████████░ 90% (Backend + Mobile prontos)
Issue #2: ██████░░░░░░░░░░░░░░ 30% (Busca CPF pronta)
Issue #1: ░░░░░░░░░░░░░░░░░░░░  0% (Não iniciada)
Issue #3: ░░░░░░░░░░░░░░░░░░░░  0% (Não iniciada)
```

### Tempo Estimado
- **Issue #4:** ~1h (só frontend desktop - opcional)
- **Issue #2:** ~3 dias (backend + frontend)
- **Issue #1:** ~5 dias (backend + frontend)
- **Issue #3:** ~5 dias (backend + frontend)

**Total:** ~13 dias de trabalho

---

## 🎯 Ordem de Implementação Recomendada

### Opção 1: Seguir Dependências (Recomendado)
```
1. Issue #4 ✅ (já pronta)
2. Issue #2 (3 dias) - Pedido pelo Garçom
3. Issue #1 (5 dias) - Sistema de Entrega
4. Issue #3 (5 dias) - Ranking
```

### Opção 2: Por Prioridade
```
1. Issue #4 ✅ (já pronta)
2. Issue #2 (3 dias) - Pedido pelo Garçom
3. Issue #1 (5 dias) - Sistema de Entrega
4. Issue #3 (5 dias) - Ranking
```

**Ambas as opções são iguais!** A ordem natural já segue prioridade e dependências.

---

## 📋 Checklist de Implementação

### Issue #2: Pedido pelo Garçom (Próxima)

#### Backend (2 dias)
- [ ] Criar endpoint `GET /clientes/buscar?q={termo}`
- [ ] Implementar busca por nome (case-insensitive)
- [ ] Implementar busca parcial (LIKE)
- [ ] Criar endpoint `POST /clientes/rapido`
- [ ] Criar DTO `CreateClienteRapidoDto`
- [ ] Criar endpoint `POST /pedidos/garcom`
- [ ] Validar garçom ativo (check-in)
- [ ] Criar/abrir comanda automaticamente
- [ ] Vincular pedido ao garçom
- [ ] Adicionar logs
- [ ] Documentar no Swagger

#### Frontend (1 dia)
- [ ] Criar página `/garcom/novo-pedido`
- [ ] Componente de busca de cliente
- [ ] Componente de formulário rápido
- [ ] Componente de seleção de produtos
- [ ] Componente de carrinho
- [ ] Integrar com API
- [ ] Toast notifications
- [ ] Loading states

### Issue #1: Sistema de Entrega (Depois)

#### Backend (3 dias)
- [ ] Migration: adicionar campos em `ItemPedido`
- [ ] Atualizar entidade `ItemPedido`
- [ ] Criar DTO `EntregarItemDto`
- [ ] Implementar `marcarComoEntregue()`
- [ ] Validar garçom ativo
- [ ] Calcular tempo de entrega
- [ ] WebSocket para notificar
- [ ] Endpoint de histórico
- [ ] Logs estruturados

#### Frontend (2 dias)
- [ ] Botão "Entregar" nos pedidos prontos
- [ ] Modal de confirmação
- [ ] Página de histórico
- [ ] Estatísticas de entregas
- [ ] Integração WebSocket

### Issue #3: Ranking (Por último)

#### Backend (3 dias)
- [ ] Criar entidade `RankingGarcom`
- [ ] Migration
- [ ] Implementar `RankingService`
- [ ] Fórmula de pontuação
- [ ] Job diário (cron)
- [ ] Endpoints de ranking
- [ ] Endpoints de estatísticas

#### Frontend (2 dias)
- [ ] Card de ranking no dashboard
- [ ] Tela completa de ranking
- [ ] Gráficos
- [ ] Medalhas
- [ ] Animações

---

## 🚀 Plano de Ação Imediato

### Hoje (6 Nov)
1. ✅ Análise completa (este documento)
2. ⏳ Implementar Issue #2 - Backend
   - Busca de clientes por nome
   - Cliente rápido
   - Pedido pelo garçom

### Amanhã (7 Nov)
3. ⏳ Implementar Issue #2 - Frontend
   - Tela de novo pedido
   - Busca e seleção
   - Carrinho

### Próximos Dias
4. ⏳ Implementar Issue #1 - Sistema de Entrega
5. ⏳ Implementar Issue #3 - Ranking

---

## 📝 Notas Importantes

### Arquitetura Atual
- ✅ Sistema de autenticação funcionando
- ✅ WebSocket configurado
- ✅ Pedidos com status individual por item
- ✅ Comandas com clientes
- ✅ Check-in/Check-out funcionando

### Integrações Necessárias
- Issue #2 precisa de check-in (Issue #4) ✅
- Issue #1 precisa de check-in (Issue #4) ✅
- Issue #3 precisa de entregas (Issue #1) ❌

### Decisões Técnicas
1. **Pedido pelo Garçom:**
   - Usar endpoint separado `/pedidos/garcom`
   - Criar comanda automaticamente se não existir
   - Vincular garçom ao pedido

2. **Sistema de Entrega:**
   - Adicionar campos em `ItemPedido` (não criar tabela nova)
   - Calcular tempo desde `data` do pedido
   - WebSocket para notificar em tempo real

3. **Ranking:**
   - Tabela separada com snapshot diário
   - Job cron para calcular (00:00)
   - Cache para performance

---

## ✅ Conclusão

### Pronto para Implementar
- ✅ Issue #4 está 90% pronta (só falta desktop opcional)
- ✅ Issue #2 tem base pronta (busca CPF, criação cliente, pedidos)
- ✅ Arquitetura suporta todas as features
- ✅ Documentação completa disponível

### Próximos Passos
1. **Implementar Issue #2** (3 dias)
2. **Implementar Issue #1** (5 dias)
3. **Implementar Issue #3** (5 dias)

**Total:** ~13 dias para sistema completo de garçom

---

**Status:** 📋 ANÁLISE COMPLETA  
**Próxima Ação:** Começar implementação da Issue #2
