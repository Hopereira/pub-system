# 💰 PLANO DE GESTÃO FINANCEIRA DO CAIXA

**Data:** 12/11/2025  
**Issue:** #227 - Auditoria de Usabilidade  
**Objetivo:** Sistema completo de controle financeiro do caixa

---

## 📋 VISÃO GERAL

Sistema completo para gestão financeira do caixa, incluindo:
- ✅ Abertura de caixa com valor inicial
- ✅ Controle por forma de pagamento (Dinheiro, PIX, Débito, Crédito, Vales)
- ✅ Sangria com observações e autorização
- ✅ Fechamento com conferência de valores
- ✅ Relatórios por dia ou por turno
- ✅ Histórico completo de movimentações

---

## 🎯 FUNCIONALIDADES PRINCIPAIS

### 1️⃣ **ABERTURA DE CAIXA** 💵

**Quando:** Logo após check-in do turno  
**Quem:** Operador de caixa (CAIXA)

**Dados obrigatórios:**
- ✅ Valor inicial em dinheiro
- ✅ Observação (opcional)
- ✅ Vinculação com turno ativo

**Interface:**
```
┌────────────────────────────────────────┐
│ 💰 Abertura de Caixa                   │
├────────────────────────────────────────┤
│ Operador: João Silva                   │
│                                        │
│ Valor Inicial: R$ [______]             │
│                                        │
│ Sugestões: [50] [100] [200] [500]      │
│                                        │
│ Observação: ____________________       │
│             ____________________       │
│                                        │
│          [Cancelar] [Abrir Caixa]      │
└────────────────────────────────────────┘
```

---

### 2️⃣ **REGISTRO DE VENDAS** 🛒

**Quando:** Ao fechar uma comanda  
**Automático:** Sistema registra automaticamente  

**Dados registrados:**
- ✅ Valor total
- ✅ Forma de pagamento escolhida
- ✅ Número da comanda
- ✅ Horário da venda
- ✅ Operador responsável

**Formas de pagamento suportadas:**
1. 💵 **Dinheiro**
2. 📱 **PIX**
3. 💳 **Cartão de Débito**
4. 💳 **Cartão de Crédito**
5. 🎫 **Vale Refeição**
6. 🎫 **Vale Alimentação**

---

### 3️⃣ **SANGRIA** 💸

**Quando:** Durante o turno, quando necessário retirar dinheiro  
**Motivos comuns:** 
- Caixa muito cheio (segurança)
- Depositar em cofre
- Pagar fornecedor
- Retirada autorizada

**Dados obrigatórios:**
- ✅ Valor da sangria
- ✅ Motivo detalhado
- ✅ Observação
- 🔐 Autorizado por (gerente/admin)

**Interface:**
```
┌────────────────────────────────────────┐
│ 💸 Registrar Sangria                   │
├────────────────────────────────────────┤
│ Caixa: #001 - João Silva               │
│ Saldo atual: R$ 1.250,00               │
│                                        │
│ Valor: R$ [______] *                   │
│                                        │
│ Motivo: *                              │
│ ⦿ Depositar em cofre                   │
│ ○ Pagar fornecedor                     │
│ ○ Troca de valores                     │
│ ○ Outro: ____________________          │
│                                        │
│ Observação: ____________________       │
│             ____________________       │
│                                        │
│ Autorizado por: [Selecionar Gerente]  │
│                                        │
│       [Cancelar] [Registrar Sangria]   │
└────────────────────────────────────────┘
```

**Regras:**
- ⚠️ Sangria acima de R$ 500,00 requer autorização de gerente
- 📝 Motivo é obrigatório
- 🔒 Ação registrada no histórico do caixa

---

### 4️⃣ **SUPRIMENTO** 💰➕

**Quando:** Necessário adicionar dinheiro ao caixa  
**Motivos comuns:**
- Reforçar troco
- Devolver sangria
- Ajuste de valor

**Dados obrigatórios:**
- ✅ Valor do suprimento
- ✅ Motivo
- ✅ Observação

---

### 5️⃣ **FECHAMENTO DE CAIXA** 🔐

**Quando:** Ao final do turno, antes do checkout  
**Processo:**

1. **Conferência física de valores**
   - Contar dinheiro em espécie
   - Conferir comprovantes de PIX
   - Verificar comprovantes de cartão
   - Checar vales

2. **Informar valores contados**
   ```
   ┌─────────────────────────────────────────┐
   │ 🔐 Fechamento de Caixa                  │
   ├─────────────────────────────────────────┤
   │ Turno: João Silva - 08:00 às 16:00     │
   │                                         │
   │ VALORES ESPERADOS vs INFORMADOS         │
   │                                         │
   │ 💵 Dinheiro                             │
   │    Esperado: R$ 450,00                  │
   │    Contado:  R$ [______]                │
   │    Diferença: R$ 0,00 ✅                │
   │                                         │
   │ 📱 PIX                                  │
   │    Esperado: R$ 320,00                  │
   │    Conferido: R$ [______]               │
   │    Diferença: R$ 0,00 ✅                │
   │                                         │
   │ 💳 Débito                               │
   │    Esperado: R$ 180,00                  │
   │    Conferido: R$ [______]               │
   │    Diferença: R$ 0,00 ✅                │
   │                                         │
   │ 💳 Crédito                              │
   │    Esperado: R$ 520,00                  │
   │    Conferido: R$ [______]               │
   │    Diferença: R$ 0,00 ✅                │
   │                                         │
   │ 🎫 Vale Refeição                        │
   │    Esperado: R$ 80,00                   │
   │    Conferido: R$ [______]               │
   │    Diferença: R$ 0,00 ✅                │
   │                                         │
   │ 🎫 Vale Alimentação                     │
   │    Esperado: R$ 60,00                   │
   │    Conferido: R$ [______]               │
   │    Diferença: R$ 0,00 ✅                │
   │                                         │
   │ ────────────────────────────────────    │
   │ TOTAL ESPERADO:  R$ 1.610,00            │
   │ TOTAL INFORMADO: R$ [______]            │
   │ DIFERENÇA TOTAL: R$ 0,00 ✅             │
   │                                         │
   │ Observação: ____________________        │
   │             ____________________        │
   │                                         │
   │        [Cancelar] [Fechar Caixa]        │
   └─────────────────────────────────────────┘
   ```

3. **Cálculo de diferenças**
   - ✅ Verde: Valores conferem
   - ⚠️ Amarelo: Pequena diferença (< R$ 5,00)
   - ❌ Vermelho: Grande diferença (≥ R$ 5,00)

4. **Resumo do turno**
   - Total de vendas
   - Quantidade de comandas
   - Ticket médio
   - Total de sangrias
   - Horas trabalhadas

---

## 📊 RELATÓRIOS E CONSULTAS

### **Relatório por Turno** 🕒
- Abertura e fechamento
- Todas as movimentações
- Sangrias realizadas
- Resumo por forma de pagamento
- Diferenças encontradas

### **Relatório por Dia** 📅
- Soma de todos os turnos do dia
- Total de vendas gerais
- Total de sangrias
- Comparativo entre turnos

### **Histórico de Fechamentos** 📜
- Lista de todos os fechamentos
- Filtro por data
- Filtro por operador
- Status (Aberto, Fechado, Conferido)

---

## 🏗️ ARQUITETURA IMPLEMENTADA

### **Backend** (A implementar)

```
/backend/src/modulos/caixa/
├── entities/
│   ├── abertura-caixa.entity.ts
│   ├── fechamento-caixa.entity.ts
│   ├── sangria.entity.ts
│   ├── suprimento.entity.ts
│   └── movimentacao-caixa.entity.ts
├── dto/
│   ├── create-abertura-caixa.dto.ts
│   ├── create-fechamento-caixa.dto.ts
│   ├── create-sangria.dto.ts
│   └── create-suprimento.dto.ts
├── caixa.controller.ts
└── caixa.service.ts
```

### **Frontend** (✅ Estrutura criada)

```
✅ /frontend/src/types/caixa.ts
   - Types completos
   - Enums de formas de pagamento
   - Interfaces de domínio

✅ /frontend/src/services/caixaService.ts
   - Integração com API
   - Métodos CRUD completos

✅ /frontend/src/context/CaixaContext.tsx
   - Estado global do caixa
   - Hook useCaixa()
   - Integração com TurnoContext

✅ /frontend/src/components/caixa/
   ├── AberturaCaixaModal.tsx
   ├── FechamentoCaixaModal.tsx (A criar)
   ├── SangriaModal.tsx (A criar)
   ├── ResumoCaixaCard.tsx (A criar)
   └── HistoricoMovimentacoes.tsx (A criar)

✅ /frontend/src/app/(protected)/caixa/
   - Integração com contexto
   - Controle de acesso via check-in
```

---

## 🔄 FLUXO COMPLETO

```
1. Funcionário faz LOGIN
          ↓
2. Faz CHECK-IN (inicia turno)
          ↓
3. ABRE O CAIXA (valor inicial)
          ↓
4. Durante o turno:
   - Recebe pagamentos → Registra forma de pagamento
   - Realiza sangrias → Com autorização
   - Adiciona suprimentos → Se necessário
          ↓
5. Ao final do turno:
   - FECHA O CAIXA → Confere valores
   - Resolve diferenças → Se houver
   - Confirma fechamento
          ↓
6. Faz CHECK-OUT (finaliza turno)
          ↓
7. Sistema gera RELATÓRIO completo
```

---

## ⚠️ REGRAS DE NEGÓCIO

### **Segurança e Controle**
1. ✅ Só pode abrir caixa SE tiver check-in ativo
2. ✅ Só pode fechar caixa SE tiver caixa aberto
3. ✅ Não pode fazer checkout SE caixa estiver aberto
4. ⚠️ Sangria > R$ 500 requer autorização de gerente
5. ❌ Diferença > R$ 50 requer justificativa detalhada
6. 📝 Todas as ações são registradas (auditoria)

### **Validações**
- Valor inicial ≥ R$ 0,00
- Valores de sangria > R$ 0,00
- Motivo de sangria obrigatório
- Fechamento requer conferência de TODAS formas de pagamento

### **Alertas**
- 🔔 Caixa aberto há mais de 8 horas
- 🔔 Sangria sem autorização pendente
- 🔔 Diferença detectada no fechamento

---

## 📈 SUGESTÕES E MELHORIAS FUTURAS

### **Fase 1 - Básico** (Atual)
- ✅ Abertura e fechamento
- ✅ Controle por forma de pagamento
- ✅ Sangria básica
- ✅ Relatórios simples

### **Fase 2 - Avançado**
- 📊 Dashboard gerencial em tempo real
- 📈 Gráficos de vendas por período
- 🎯 Metas de vendas por operador
- 🔔 Notificações em tempo real
- 📱 App mobile para gerentes

### **Fase 3 - Inteligência**
- 🤖 IA para detecção de padrões suspeitos
- 📉 Análise preditiva de fluxo de caixa
- 🎯 Sugestão automática de sangria
- 📊 Comparativo de performance entre operadores

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. ✅ **Types criados** - caixa.ts
2. ✅ **Service criado** - caixaService.ts  
3. ✅ **Contexto criado** - CaixaContext.tsx
4. ✅ **Provider integrado** - layout.tsx
5. ✅ **Modal de abertura criado** - AberturaCaixaModal.tsx

**Próximo:**
6. ⏳ Criar FechamentoCaixaModal.tsx
7. ⏳ Criar SangriaModal.tsx
8. ⏳ Integrar na página /caixa
9. ⏳ Criar endpoints no backend
10. ⏳ Testar fluxo completo

---

## 💡 OBSERVAÇÕES IMPORTANTES

### **Aproveitamento de Código Existente** ✅
- Usando mesma estrutura de Services (turnoService como referência)
- Reutilizando TurnoContext pattern
- Aproveitando componentes UI já existentes (Dialog, Button, Input)
- Seguindo padrões já estabelecidos no projeto

### **Integração com Sistema Existente**
- ✅ Integrado com sistema de turnos
- ✅ Controle de acesso via RoleGuard
- ✅ Bloqueia ações sem check-in
- ✅ Alerta ao sair sem checkout
- ✅ Usa contextos globais (Auth, Turno, Caixa)

---

**Status:** 🟡 Em Desenvolvimento  
**Prioridade:** 🔴 Alta  
**Estimativa:** 4-6 horas para MVP completo

---

**Mantido por:** Cascade AI  
**Última atualização:** 12/11/2025 13:00
