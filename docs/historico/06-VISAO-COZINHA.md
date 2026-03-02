# 👨‍🍳 Visão da Cozinha/Bar

**Público-alvo:** Cozinheiros, bartenders, equipe de preparo  
**Data:** 04/12/2024  
**Status:** ✅ 95% Funcional

---

## 🎯 Objetivo

Este documento descreve como usar o sistema na cozinha/bar para:

1. **Visualizar pedidos** em tempo real (Kanban)
2. **Iniciar preparo** de itens
3. **Marcar itens como prontos**
4. **Filtrar por ambiente** (Cozinha, Bar, etc)
5. **Acompanhar métricas** de performance

---

## 🔐 Acesso ao Sistema

### **Login**

1. Acesse: `https://seudominio.com/login`
2. Digite seu **email** e **senha** (fornecidos pelo gerente)
3. Clique em **Entrar**

**Seu cargo:** COZINHA

**Redirecionamento:** Após login, você será levado para `/dashboard/gestaopedidos` ou `/cozinha`

---

## 📋 Kanban de Pedidos

**Rotas:**
- `/dashboard/gestaopedidos` - Kanban completo
- `/cozinha` - Dashboard da cozinha

### **Visão Geral**

O Kanban mostra todos os pedidos em **4 colunas:**

```
┌─────────┐  ┌──────────────┐  ┌─────────┐  ┌───────────┐
│  FEITO  │  │ EM PREPARO   │  │ PRONTO  │  │ ENTREGUE  │
│  (Novo) │  │ (Preparando) │  │ (Buscar)│  │ (Fim)     │
└─────────┘  └──────────────┘  └─────────┘  └───────────┘
```

### **Cada Card Mostra**

**Informações:**
- 🪑 Mesa ou 👤 Cliente
- 📝 Lista de itens
- ⏱️ Tempo decorrido
- 👨‍🍳 Ambiente (Cozinha, Bar)
- 👤 Garçom responsável

**Cores por Tempo:**
- 🟢 Verde - < 5 minutos (no prazo)
- 🟡 Amarelo - 5-10 minutos (atenção)
- 🔴 Vermelho - > 10 minutos (atrasado)

---

## 🔄 Fluxo de Trabalho

### **1. Novo Pedido Chega (FEITO)**

**O que acontece:**
- 🔔 Notificação sonora (opcional)
- Card aparece na coluna "FEITO"
- Tempo começa a contar

**O que fazer:**
1. Ler o pedido
2. Verificar observações
3. Separar ingredientes
4. Clicar em **"Iniciar Preparo"**

### **2. Iniciar Preparo**

**Ação:**
- Clique no botão **"Iniciar Preparo"** no card
- Ou arraste o card para coluna "EM PREPARO"

**Sistema registra:**
- Horário de início
- Quem iniciou
- Muda status para EM_PREPARO

**Card move para coluna "EM PREPARO"**

### **3. Preparando (EM PREPARO)**

**Durante o preparo:**
- Card fica na coluna "EM PREPARO"
- Tempo continua contando
- Cor muda conforme tempo

**Dicas:**
- Priorize pedidos mais antigos (vermelho)
- Leia observações com atenção
- Prepare com qualidade

### **4. Marcar como Pronto**

**Quando terminar:**
1. Clique em **"Marcar como Pronto"**
2. Ou arraste para coluna "PRONTO"

**Sistema:**
- Registra horário
- Calcula tempo de preparo
- Notifica garçom via WebSocket
- Muda status para PRONTO

**Card move para coluna "PRONTO"**

### **5. Aguardando Retirada (PRONTO)**

**O que acontece:**
- Garçom recebe notificação
- Item fica aguardando retirada
- Tempo de espera começa a contar

**⚠️ Meta:** Garçom deve retirar em < 2 minutos

### **6. Retirado e Entregue**

**Garçom:**
1. Retira item
2. Leva até cliente
3. Marca como entregue

**Card move para coluna "ENTREGUE"**

---

## 🔍 Filtros

### **Filtrar por Ambiente**

**Ambientes disponíveis:**
- 🍳 Cozinha - Pratos quentes
- 🍹 Bar - Bebidas
- 🥗 Saladas - Pratos frios
- 🍰 Confeitaria - Sobremesas
- (Conforme configuração)

**Como usar:**
1. Clique no dropdown "Ambiente"
2. Selecione seu ambiente
3. Veja apenas seus pedidos

**Vantagem:**
- Cozinha vê apenas pratos
- Bar vê apenas bebidas
- Não há confusão

### **Filtrar por Status**

**Opções:**
- Todos
- Apenas FEITO
- Apenas EM PREPARO
- Apenas PRONTO

### **Filtrar por Garçom**

**Uso:**
- Ver pedidos de um garçom específico
- Útil para priorizar

---

## 🔔 Notificações em Tempo Real

### **WebSocket Ativo**

**Você recebe notificação quando:**
- 🔔 Novo pedido criado
- 🔔 Pedido cancelado
- 🔔 Observação adicionada

**Configurações:**
- Som ativado/desativado
- Volume do alerta
- Tipo de som

**Status da Conexão:**
- ✅ Conectado - Atualizações em tempo real
- 🔴 Desconectado - Recarregue a página

**Atualização Automática:**
- Cards movem sozinhos entre colunas
- Não precisa recarregar página
- Tempo atualiza automaticamente

---

## 📊 Métricas de Performance

### **Tempo Médio de Preparo**

**Meta:** < 15 minutos

**Cálculo:**
```
Tempo = Horário Pronto - Horário Início
```

**Visualização:**
- Dashboard mostra média do dia
- Gerente acompanha
- Influencia avaliação

### **Taxa de Pedidos no Prazo**

**Meta:** > 90%

**No prazo:** < 15 minutos  
**Atrasado:** > 15 minutos

**Cálculo:**
```
Taxa = (Pedidos no Prazo / Total) × 100
```

### **Quantidade de Pedidos**

**Métricas:**
- Total do dia
- Por hora
- Por ambiente
- Por cozinheiro (se rastreado)

---

## 💡 Dicas para Melhor Performance

### **1. Organize sua Estação**

- Ingredientes à mão
- Utensílios limpos
- Espaço organizado
- Mise en place

### **2. Priorize Corretamente**

**Ordem de prioridade:**
1. 🔴 Pedidos atrasados (> 10min)
2. 🟡 Pedidos em atenção (5-10min)
3. 🟢 Pedidos novos (< 5min)

### **3. Leia Observações**

**Sempre verifique:**
- Ponto da carne
- Alergias
- Restrições
- Preferências

**Exemplos:**
- "Sem cebola"
- "Mal passado"
- "Alérgico a amendoim"
- "Vegano"

### **4. Comunique-se**

**Com garçom:**
- Avise se vai atrasar
- Pergunte dúvidas
- Informe problemas

**Com gerente:**
- Reporte falta de ingrediente
- Avise se equipamento quebrou
- Sugira melhorias

### **5. Mantenha Qualidade**

**Sempre:**
- Apresentação impecável
- Temperatura correta
- Porção adequada
- Higiene total

**Lembre-se:**
- Cliente avalia o prato
- Avaliação afeta restaurante
- Qualidade > Velocidade

### **6. Use o Sistema**

**Marque status corretamente:**
- Inicie quando começar
- Marque pronto quando terminar
- Não deixe card parado

**Benefícios:**
- Garçom sabe quando retirar
- Gerente acompanha tempo
- Você ganha reconhecimento

---

## 🚨 Problemas Comuns e Soluções

### **1. Pedido não aparece**

**Possíveis causas:**
- Filtro de ambiente errado
- WebSocket desconectado
- Pedido já foi preparado

**Solução:**
- Verifique filtros
- Recarregue página
- Veja em "Todos os status"

### **2. Não consigo marcar como pronto**

**Possíveis causas:**
- Pedido não foi iniciado
- Conexão perdida
- Erro no sistema

**Solução:**
- Verifique se iniciou preparo
- Recarregue página
- Avise gerente

### **3. Notificações não funcionam**

**Solução:**
- Verifique conexão WebSocket
- Ative som nas configurações
- Teste conexão de internet
- Recarregue página

### **4. Tempo está errado**

**Possíveis causas:**
- Horário do servidor errado
- Fuso horário diferente

**Solução:**
- Avise gerente
- Ele deve ajustar servidor

### **5. Pedido duplicado**

**O que fazer:**
- Verifique se é mesmo duplicado
- Avise garçom
- Não prepare duas vezes
- Gerente pode cancelar

---

## 📱 Acesso Mobile

**Responsivo:** ✅ Sim

O Kanban funciona em tablets:
- iPad recomendado
- Mínimo 10 polegadas
- Modo paisagem melhor

**Dicas:**
- Fixe tablet na cozinha
- Proteja de respingos
- Mantenha carregado

---

## ⚙️ Configurações

### **Som de Notificação**

**Opções:**
- Ativado/Desativado
- Volume (baixo, médio, alto)
- Tipo de som

**Recomendado:**
- Ativado em horário de pico
- Volume médio
- Som discreto

### **Atualização Automática**

**Padrão:** A cada 5 segundos via WebSocket

**Se desconectar:**
- Atualização manual (botão refresh)
- Ou recarregue página

---

## 📋 Checklist do Turno

### **Início do Turno**
- [ ] Fazer login
- [ ] Verificar filtro de ambiente
- [ ] Testar notificações
- [ ] Verificar pedidos pendentes
- [ ] Organizar estação

### **Durante o Turno**
- [ ] Marcar status corretamente
- [ ] Priorizar pedidos atrasados
- [ ] Ler observações
- [ ] Manter qualidade
- [ ] Comunicar problemas

### **Fim do Turno**
- [ ] Finalizar pedidos pendentes
- [ ] Limpar estação
- [ ] Fazer logout

---

## 🎯 Conclusão

**Como cozinheiro/bartender, você tem:**
- ✅ Kanban visual e intuitivo
- ✅ Notificações em tempo real
- ✅ Filtros por ambiente
- ✅ Métricas de performance
- ✅ Atualização automática

**Sistema está 95% pronto para cozinha!**

**O que falta:**
- ⚠️ Impressão automática de pedidos
- ⚠️ Display de cozinha (KDS)
- ⚠️ Chat com garçom

**Mas tudo essencial já funciona!** 🚀

---

**Próximo Documento:** [07-VISAO-CLIENTE.md](./07-VISAO-CLIENTE.md)
