# 🍽️ Visão do Garçom

**Público-alvo:** Garçons e atendentes  
**Data:** 04/12/2024  
**Status:** ✅ 95% Funcional

---

## 🎯 Objetivo

Este documento descreve como usar o sistema como garçom para:

1. **Fazer check-in/check-out** do turno
2. **Criar pedidos** para mesas e clientes
3. **Retirar itens** prontos na cozinha/bar
4. **Entregar pedidos** aos clientes
5. **Acompanhar ranking** e ganhar medalhas
6. **Gerar QR Code** para clientes

---

## 🔐 Acesso ao Sistema

### **Login**

1. Acesse: `https://seudominio.com/login`
2. Digite seu **email** e **senha** (fornecidos pelo gerente)
3. Clique em **Entrar**

**Seu cargo:** GARCOM

**Redirecionamento:** Após login, você será levado automaticamente para `/garcom` (Área do Garçom)

---

## 🏠 Área do Garçom (Dashboard)

**Rota:** `/garcom`

### **Primeira Ação: Check-in**

Ao chegar para trabalhar, você DEVE fazer check-in:

1. Clique no botão **"Fazer Check-in"**
2. Sistema registra horário de entrada
3. Seu turno é iniciado

**⚠️ Importante:** Sempre faça check-in ao começar o turno!

### **Visão Geral do Dashboard**

#### **Informações Exibidas**

**Hora e Data:**
- Relógio em tempo real
- Data completa (ex: quarta-feira, 04 de dezembro de 2024)

**Status do Turno:**
- ✅ Check-in feito
- ⏱️ Tempo trabalhado
- 🔴 Sem check-in (alerta)

**Pedidos Prontos:**
- Lista de pedidos aguardando retirada
- Mesa/Cliente
- Itens prontos
- Tempo de espera
- Botão "Retirar"

**Notificações em Tempo Real:**
- 🔔 Novo pedido pronto
- Som de alerta (opcional)
- Atualização automática

---

## 📋 Criar Novo Pedido

**Rota:** `/garcom/novo-pedido`

### **Passo 1: Selecionar Mesa ou Cliente**

**Opção A: Mesa**
1. Clique em **"Selecionar Mesa"**
2. Escolha a mesa na lista
3. Sistema verifica se há comanda aberta
   - Se sim: adiciona à comanda existente
   - Se não: cria nova comanda

**Opção B: Cliente (Balcão/Delivery)**
1. Clique em **"Buscar Cliente"**
2. Digite CPF ou nome
3. Selecione o cliente
4. Escolha ponto de entrega (Balcão, etc)

**Opção C: Novo Cliente**
1. Clique em **"Novo Cliente"**
2. Preencha:
   - Nome
   - CPF (opcional)
   - Celular (opcional)
3. Escolha ponto de entrega

### **Passo 2: Adicionar Itens**

1. **Buscar produto:**
   - Digite nome do produto
   - Ou navegue por categoria

2. **Adicionar ao pedido:**
   - Clique no produto
   - Defina quantidade
   - Adicione observação (opcional)
   - Ex: "Sem cebola", "Mal passado"

3. **Repetir** para todos os itens

### **Passo 3: Revisar e Enviar**

**Revisar:**
- Lista de itens
- Quantidades
- Observações
- Total do pedido

**Enviar:**
1. Clique em **"Enviar Pedido"**
2. Sistema:
   - Cria pedido no banco
   - Envia para cozinha/bar via WebSocket
   - Atualiza comanda
   - Mostra confirmação

**Confirmação:**
- ✅ "Pedido enviado com sucesso!"
- Número do pedido
- Tempo estimado

---

## 🗺️ Mapa de Mesas

**Rotas:**
- `/garcom/mapa` - Mapa operacional
- `/garcom/mapa-visual` - Mapa visual com layout

### **Mapa Operacional**

**Funcionalidades:**
- Ver todas as mesas agrupadas por ambiente
- Status de cada mesa (cores)
- Comandas abertas
- Total da comanda
- Ações rápidas

**Cores:**
- 🟢 Verde - LIVRE
- 🟡 Amarelo - OCUPADA
- 🔴 Vermelho - AGUARDANDO_PAGAMENTO

**Ações:**
- Clicar na mesa para ver detalhes
- Criar pedido para a mesa
- Ver comanda completa

### **Mapa Visual**

**Funcionalidades:**
- Layout visual do estabelecimento
- Mesas posicionadas como na realidade
- Cores por status
- Filtro "Apenas com pedidos prontos"
- Zoom in/out
- Atualização a cada 30 segundos

**Uso:**
1. Abrir mapa visual
2. Ver mesas com pedidos prontos (vermelho)
3. Ir até a cozinha/bar
4. Retirar itens
5. Entregar na mesa

---

## 📦 Retirar Itens Prontos

### **Fluxo Completo**

#### **1. Notificação**
- 🔔 Sistema notifica quando item fica pronto
- Som de alerta (se ativado)
- Badge no menu "Pedidos Prontos"

#### **2. Ver Pedidos Prontos**
- Dashboard mostra lista
- Ou acesse `/garcom` e veja seção "Pedidos Prontos"

**Informações:**
- Mesa/Cliente
- Itens prontos
- Tempo de espera
- Ambiente (Cozinha, Bar)

#### **3. Ir até o Ambiente**
- Cozinha para pratos
- Bar para bebidas
- Balcão para retirada

#### **4. Retirar Item**
1. Clique em **"Retirar"** no item
2. Sistema registra:
   - Quem retirou (você)
   - Horário exato
   - Muda status para RETIRADO

**⚠️ Importante:** 
- Não é possível retirar o mesmo item duas vezes
- Sistema previne duplicação

#### **5. Levar até o Cliente**
- Vá até a mesa/ponto de entrega
- Entregue os itens

#### **6. Marcar como Entregue**
1. No app, clique em **"Entregar"**
2. Sistema registra:
   - Horário de entrega
   - Muda status para ENTREGUE
   - Calcula tempo total

---

## 🏆 Ranking e Medalhas

**Rota:** `/garcom/ranking`

### **Ranking de Garçons**

**Critérios:**
- Total de entregas
- Entregas rápidas (< 2min)
- Tempo médio de entrega
- Pontuação total

**Pontuação:**
- Entrega rápida (< 2min): +10 pontos
- Entrega no SLA (< 5min): +5 pontos
- Avaliação positiva (4-5★): +3 pontos
- Entrega normal: +1 ponto

**Visualização:**
- Sua posição no ranking
- Top 10 garçons
- Suas estatísticas
- Medalhas conquistadas

### **Sistema de Medalhas**

**Tipos de Medalha:**

1. **🏃 VELOCISTA**
   - Bronze: 10 entregas rápidas
   - Prata: 50 entregas rápidas
   - Ouro: 100 entregas rápidas

2. **🏃‍♂️ MARATONISTA**
   - Bronze: 30 entregas em um dia
   - Prata: 50 entregas em um dia
   - Ouro: 100 entregas em um dia

3. **⏰ PONTUAL**
   - Bronze: 90% no SLA por 3 dias
   - Prata: 95% no SLA por 7 dias
   - Ouro: 98% no SLA por 15 dias

4. **🏆 MVP**
   - Ouro: 1º lugar no ranking

5. **⭐ CONSISTENTE**
   - Prata: Top 3 por 7 dias
   - Ouro: Top 3 por 30 dias

**Visualizar Medalhas:**
- No ranking
- No seu perfil
- Dashboard mostra próximas medalhas

---

## 📱 QR Code para Clientes

**Rota:** `/garcom/qrcode-comanda`

### **Gerar QR Code**

**Uso:**
1. Cliente pede para ver cardápio no celular
2. Você acessa "Gerar QR Code"
3. Seleciona a mesa
4. Sistema gera QR Code
5. Cliente escaneia
6. Cliente acessa cardápio digital

**Funcionalidades do Cliente:**
- Ver cardápio completo
- Fazer pedidos direto do celular
- Ver total da comanda
- Acompanhar status dos pedidos
- Avaliar atendimento

**Vantagens:**
- Cliente faz pedido sozinho
- Você tem mais tempo para outras mesas
- Menos erro de comunicação
- Cliente vê fotos dos produtos

---

## 🔔 Notificações em Tempo Real

### **WebSocket Ativo**

**Você recebe notificação quando:**
- 🔔 Pedido ficou pronto
- 🔔 Cliente fez pedido pelo QR Code
- 🔔 Gerente enviou mensagem (futuro)

**Configurações:**
- Som ativado/desativado
- Volume do alerta
- Tipo de notificação

**Status da Conexão:**
- ✅ Conectado - Notificações funcionando
- 🔴 Desconectado - Recarregue a página

---

## ⏱️ Gestão de Turno

### **Check-in**
- Fazer ao chegar
- Registra horário de entrada
- Habilita todas as funções

### **Durante o Turno**
- Sistema conta tempo trabalhado
- Mostra no dashboard
- Registra todas as ações

### **Check-out**
- Fazer ao sair
- Registra horário de saída
- Calcula horas trabalhadas
- Gera relatório do turno

**⚠️ Importante:** 
- Sempre fazer check-out ao sair
- Sistema alerta se esquecer
- Gerente pode ver quem não fez

---

## 💡 Dicas para Melhor Desempenho

### **1. Seja Rápido na Retirada**
- Retire itens assim que ficarem prontos
- Meta: < 2 minutos
- Ganha mais pontos
- Cliente fica satisfeito

### **2. Use o Mapa Visual**
- Veja quais mesas têm pedidos prontos
- Otimize seu trajeto
- Retire vários itens de uma vez

### **3. Confira os Itens**
- Antes de sair da cozinha
- Verifique se está tudo certo
- Evite voltar

### **4. Seja Atencioso**
- Pergunte se está tudo bem
- Ofereça mais bebidas
- Cliente satisfeito = boa avaliação

### **5. Use Observações**
- Anote preferências do cliente
- Ex: "Sem gelo", "Bem passado"
- Cozinha agradece

### **6. Acompanhe seu Ranking**
- Veja suas estatísticas
- Compare com outros garçons
- Tente melhorar sempre

---

## 🚨 Problemas Comuns e Soluções

### **1. Não consigo fazer check-in**

**Solução:**
- Recarregue a página (F5)
- Verifique se já não fez check-in
- Peça ajuda ao gerente

### **2. Pedido não aparece na cozinha**

**Solução:**
- Verifique se enviou corretamente
- Veja em "Gestão de Pedidos"
- Avise a cozinha manualmente
- Reporte ao gerente

### **3. Não consigo retirar item**

**Possíveis causas:**
- Item já foi retirado
- Outro garçom retirou
- Item ainda não está pronto

**Solução:**
- Atualize a página
- Verifique status do item
- Pergunte na cozinha

### **4. Cliente não consegue escanear QR Code**

**Solução:**
- Gere novo QR Code
- Verifique se mesa está correta
- Cliente pode acessar digitando URL
- Use "Recuperar Comanda" se necessário

### **5. Notificações não funcionam**

**Solução:**
- Verifique conexão WebSocket (ícone no topo)
- Recarregue a página
- Verifique se som está ativado
- Teste conexão de internet

---

## 📚 Treinamento

### **Primeiro Dia**

**Manhã:**
1. Login e check-in
2. Conhecer dashboard
3. Ver mapa de mesas
4. Praticar criar pedido (teste)

**Tarde:**
5. Retirar itens prontos
6. Marcar como entregue
7. Ver ranking
8. Gerar QR Code

### **Primeira Semana**

- Praticar todos os dias
- Acompanhar ranking
- Tentar ganhar primeira medalha
- Pedir feedback ao gerente

### **Metas**

- **Semana 1:** Aprender básico
- **Semana 2:** Tempo médio < 5min
- **Semana 3:** Top 10 no ranking
- **Mês 1:** Primeira medalha

---

## ✅ Checklist do Turno

### **Início do Turno**
- [ ] Fazer login
- [ ] Fazer check-in
- [ ] Verificar pedidos pendentes
- [ ] Verificar mesas ocupadas
- [ ] Testar notificações

### **Durante o Turno**
- [ ] Retirar itens rapidamente
- [ ] Marcar como entregue
- [ ] Criar pedidos corretamente
- [ ] Ser atencioso com clientes
- [ ] Acompanhar ranking

### **Fim do Turno**
- [ ] Verificar se entregou tudo
- [ ] Fazer check-out
- [ ] Ver estatísticas do dia
- [ ] Fazer logout

---

## 🎯 Conclusão

**Como garçom, você tem:**
- ✅ Área própria no sistema
- ✅ Check-in/check-out automático
- ✅ Criação fácil de pedidos
- ✅ Notificações em tempo real
- ✅ Rastreamento de entregas
- ✅ Ranking e medalhas
- ✅ QR Code para clientes

**Sistema está 95% pronto para garçons!**

**O que falta:**
- ⚠️ Histórico detalhado de turnos
- ⚠️ Chat com cozinha
- ⚠️ Notificações push no celular

**Mas tudo que você precisa já funciona!** 🚀

---

**Próximo Documento:** [06-VISAO-COZINHA.md](./06-VISAO-COZINHA.md)
