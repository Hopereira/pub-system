# 🗺️ Roadmap - Pub System

**Última Atualização:** Dezembro 2025  
**Status Atual:** 90% Single-Tenant | 50% Multi-Tenant

---

## 📊 Visão Geral

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ROADMAP PUB SYSTEM                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Q1 2025          Q2 2025          Q3 2025          Q4 2025        │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐    │
│  │  MVP    │ ──▶  │ ESCALA  │ ──▶  │EXPANSÃO │ ──▶  │ENTERPRISE│   │
│  │Comercial│      │         │      │         │      │         │    │
│  └─────────┘      └─────────┘      └─────────┘      └─────────┘    │
│                                                                     │
│  Multi-tenant     Performance      Integrações     White-label     │
│  Pagamentos       Estoque          NF-e            App Mobile      │
│  Segurança        Relatórios       Delivery        Multi-idioma    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Fase 1: MVP Comercializável (Q1 2025)

**Objetivo:** Sistema pronto para vender para primeiros clientes  
**Duração:** 10-12 semanas  
**Esforço:** ~256 horas

### 🔴 Prioridade Crítica

| Feature | Descrição | Esforço | Status |
|---------|-----------|---------|--------|
| Multi-tenancy | Suporte a múltiplas empresas | 60h | ⏳ Pendente |
| Pagamentos Online | Integração Mercado Pago (PIX, cartão) | 80h | ⏳ Pendente |
| Refresh Tokens | Renovação automática de sessão | 16h | ⏳ Pendente |
| Auditoria | Log de todas as ações críticas | 24h | ⏳ Pendente |
| LGPD/Termos | Termos de uso e privacidade | 16h | ⏳ Pendente |
| Testes | Cobertura mínima 70% | 60h | ⏳ Pendente |

### Entregas

**Sprint 1-2 (Semanas 1-4):** Multi-tenancy
- [ ] Migration para adicionar `empresa_id` em todas as tabelas
- [ ] Middleware de tenant
- [ ] Filtros automáticos por empresa
- [ ] Testes de isolamento

**Sprint 3-4 (Semanas 5-8):** Pagamentos
- [ ] Módulo de pagamento (backend)
- [ ] Integração Mercado Pago
- [ ] Webhook de confirmação
- [ ] Interface de pagamento (frontend)
- [ ] QR Code PIX dinâmico

**Sprint 5-6 (Semanas 9-12):** Segurança e Testes
- [ ] Refresh tokens
- [ ] Auditoria de ações
- [ ] Termos de uso
- [ ] Testes unitários
- [ ] Testes de integração

### Critérios de Sucesso
- [ ] 3+ empresas usando em paralelo sem vazamento de dados
- [ ] Pagamento PIX funcionando end-to-end
- [ ] Cobertura de testes > 70%
- [ ] Zero vulnerabilidades críticas

---

## 📈 Fase 2: Escala e Otimização (Q2 2025)

**Objetivo:** Sistema robusto para múltiplos clientes  
**Duração:** 6-8 semanas  
**Esforço:** ~130 horas

### 🟡 Prioridade Alta

| Feature | Descrição | Esforço | Status |
|---------|-----------|---------|--------|
| Controle de Estoque | Entrada/saída, alertas, inventário | 50h | ⏳ Pendente |
| Relatórios Avançados | Exportação PDF/Excel | 30h | ⏳ Pendente |
| Cache Redis | Performance de queries | 20h | ⏳ Pendente |
| Performance | Otimização de queries, índices | 30h | ⏳ Pendente |

### Entregas

**Sprint 7-8 (Semanas 13-16):** Estoque
- [ ] Entidade de estoque
- [ ] Movimentações (entrada/saída)
- [ ] Alertas de estoque baixo
- [ ] Inventário
- [ ] Custo de produto (margem)

**Sprint 9-10 (Semanas 17-20):** Performance
- [ ] Implementar Redis
- [ ] Cache de produtos/cardápio
- [ ] Otimização de queries N+1
- [ ] Índices no banco
- [ ] Paginação em listagens

### Critérios de Sucesso
- [ ] Suporte a 100+ usuários simultâneos
- [ ] Tempo de resposta < 200ms (P95)
- [ ] Relatórios exportáveis em PDF/Excel
- [ ] Controle de estoque funcional

---

## 🚀 Fase 3: Expansão (Q3 2025)

**Objetivo:** Sistema completo com integrações  
**Duração:** 10-12 semanas  
**Esforço:** ~340 horas

### 🟢 Prioridade Média

| Feature | Descrição | Esforço | Status |
|---------|-----------|---------|--------|
| Nota Fiscal (NF-e) | Emissão de NFC-e | 80h | ⏳ Pendente |
| Integração iFood | Receber pedidos do iFood | 60h | ⏳ Pendente |
| App Mobile | React Native (iOS/Android) | 160h | ⏳ Pendente |
| WhatsApp Business | Notificações via WhatsApp | 40h | ⏳ Pendente |

### Entregas

**Sprint 11-14 (Semanas 21-28):** Integrações
- [ ] Módulo de NF-e
- [ ] Certificado digital A1
- [ ] Integração com SEFAZ
- [ ] API iFood
- [ ] Sincronização de cardápio
- [ ] Recebimento de pedidos

**Sprint 15-18 (Semanas 29-36):** Mobile
- [ ] Setup React Native
- [ ] Telas principais (garçom)
- [ ] Notificações push
- [ ] Offline-first
- [ ] Publicação nas lojas

### Critérios de Sucesso
- [ ] NFC-e emitida e validada
- [ ] Pedidos do iFood integrados
- [ ] App nas lojas (iOS/Android)
- [ ] Notificações WhatsApp funcionando

---

## 🏢 Fase 4: Enterprise (Q4 2025)

**Objetivo:** Funcionalidades enterprise e white-label  
**Duração:** 12+ semanas  
**Esforço:** ~400 horas

### 🔵 Prioridade Baixa

| Feature | Descrição | Esforço | Status |
|---------|-----------|---------|--------|
| White-label | Customização por cliente | 80h | ⏳ Pendente |
| Multi-idioma | i18n (PT, EN, ES) | 40h | ⏳ Pendente |
| BI/Analytics | Dashboard avançado | 80h | ⏳ Pendente |
| Integração ERP | SAP, TOTVS, etc | 120h | ⏳ Pendente |
| Franquias | Gestão de múltiplas unidades | 80h | ⏳ Pendente |

### Entregas

- [ ] Sistema de temas customizáveis
- [ ] Domínio próprio por cliente
- [ ] Suporte a múltiplos idiomas
- [ ] Dashboard de BI com gráficos avançados
- [ ] Conectores para ERPs
- [ ] Consolidação de dados de franquias

---

## 📋 Backlog Futuro

### Funcionalidades Desejadas
- [ ] Reservas online
- [ ] Fila de espera digital
- [ ] Programa de fidelidade
- [ ] Cupons e promoções
- [ ] Split de pagamento (dividir conta)
- [ ] Gorjeta digital
- [ ] Integração com Rappi/Uber Eats
- [ ] Cardápio com IA (recomendações)
- [ ] Reconhecimento facial (clientes VIP)
- [ ] IoT (sensores de mesa)

### Melhorias Técnicas
- [ ] Kubernetes para orquestração
- [ ] CI/CD completo (GitHub Actions)
- [ ] Testes E2E automatizados
- [ ] Monitoramento APM (Datadog/New Relic)
- [ ] Feature flags
- [ ] A/B testing

---

## 📊 Métricas de Progresso

### Status Atual (Dezembro 2025)

```
Funcionalidades Core     ████████████████████░░░░░ 90%
Multi-Tenancy           ░░░░░░░░░░░░░░░░░░░░░░░░░  0%
Pagamentos              ░░░░░░░░░░░░░░░░░░░░░░░░░  0%
Segurança               ████████████████░░░░░░░░░ 65%
Testes                  ███░░░░░░░░░░░░░░░░░░░░░░ 15%
Documentação            █████████████████████░░░░ 85%
```

### Meta Q1 2025

```
Funcionalidades Core     █████████████████████████ 100%
Multi-Tenancy           █████████████████████████ 100%
Pagamentos              █████████████████████████ 100%
Segurança               █████████████████████████ 100%
Testes                  █████████████████░░░░░░░░  70%
Documentação            █████████████████████████ 100%
```

---

## 💰 Modelo de Negócio

### Planos de Assinatura

| Plano | Preço | Comandas/mês | Usuários | Features |
|-------|-------|--------------|----------|----------|
| **TRIAL** | R$ 0 | 50 | 1 | Básico (30 dias) |
| **BÁSICO** | R$ 199 | 500 | 5 | Core + Caixa |
| **PRO** | R$ 399 | Ilimitado | 15 | + Estoque + Relatórios |
| **ENTERPRISE** | R$ 799 | Ilimitado | Ilimitado | + NF-e + Integrações |

### Projeção de Receita

| Mês | Clientes | MRR |
|-----|----------|-----|
| M1 | 5 | R$ 1.500 |
| M3 | 15 | R$ 5.000 |
| M6 | 40 | R$ 15.000 |
| M12 | 100 | R$ 40.000 |

---

## 🎯 OKRs Q1 2025

### Objetivo 1: Lançar MVP Comercializável
- KR1: Multi-tenancy funcionando com 3+ empresas
- KR2: Pagamento PIX com taxa de sucesso > 95%
- KR3: Zero vulnerabilidades críticas

### Objetivo 2: Primeiros Clientes Pagantes
- KR1: 5 clientes no plano Básico
- KR2: NPS > 8
- KR3: Churn < 10%

### Objetivo 3: Qualidade de Software
- KR1: Cobertura de testes > 70%
- KR2: Uptime > 99.5%
- KR3: Tempo de resposta P95 < 500ms

---

## 📞 Contato

**Product Owner:** [Nome]  
**Tech Lead:** [Nome]  
**Email:** roadmap@pubsystem.com.br

---

*Roadmap sujeito a alterações conforme feedback de clientes e prioridades de negócio.*

*Última atualização: Dezembro 2025*
