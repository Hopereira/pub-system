# 👤 Visão do Cliente

**Público-alvo:** Clientes do estabelecimento  
**Data:** 04/12/2024  
**Status:** ✅ 90% Funcional

---

## 🎯 Objetivo

Este documento descreve como o cliente usa o sistema para:

1. **Acessar cardápio digital** via QR Code
2. **Fazer pedidos** pelo celular
3. **Acompanhar status** dos pedidos em tempo real
4. **Ver total da comanda**
5. **Avaliar atendimento**
6. **Recuperar comanda** perdida

---

## 📱 Como Acessar

### **Opção 1: QR Code na Mesa** (Recomendado)

1. **Escanear QR Code** na mesa com câmera do celular
2. Sistema abre automaticamente
3. Você vê o cardápio digital

**Vantagens:**
- Acesso instantâneo
- Já vinculado à sua mesa
- Não precisa chamar garçom

### **Opção 2: Primeiro Acesso (Balcão/Delivery)**

**Rota:** `/primeiro-acesso`

1. Acesse o site do estabelecimento
2. Clique em "Primeiro Acesso"
3. Informe:
   - Nome
   - CPF (opcional)
   - Celular (opcional)
4. Escolha ponto de entrega
5. Sistema cria sua comanda

### **Opção 3: Recuperar Comanda**

**Rota:** `/recuperar-comanda`

**Se você:**
- Fechou o navegador acidentalmente
- Perdeu o link
- Quer acessar de outro celular

**Como fazer:**
1. Acesse "Recuperar Comanda"
2. Digite:
   - Número da mesa, OU
   - Seu CPF, OU
   - Número da comanda (ex: CMD-001)
3. Sistema encontra sua comanda
4. Você acessa novamente

---

## 🍽️ Cardápio Digital

**Rota:** `/acesso-cliente/[comandaId]`

### **Visualização**

**O cardápio mostra:**
- 📸 Foto de cada produto
- 📝 Nome e descrição
- 💰 Preço
- 🏷️ Categoria
- ⭐ Avaliações (futuro)

**Categorias:**
- 🍹 Bebidas
- 🍖 Petiscos
- 🍽️ Pratos
- 🍰 Sobremesas

### **Buscar Produto**

**Como usar:**
1. Digite nome do produto
2. Resultados aparecem instantaneamente
3. Clique para ver detalhes

**Exemplo:**
- Digite "cerveja"
- Vê todas as cervejas
- Escolha a sua

### **Filtrar por Categoria**

**Como usar:**
1. Clique na categoria desejada
2. Vê apenas produtos daquela categoria
3. Navegue facilmente

---

## 🛒 Fazer Pedido

### **Passo 1: Escolher Produto**

1. Navegue pelo cardápio
2. Clique no produto desejado
3. Modal abre com detalhes

### **Passo 2: Personalizar**

**Opções:**
- **Quantidade:** Escolha quantos quer
- **Observações:** Adicione preferências
  - Ex: "Sem cebola"
  - Ex: "Mal passado"
  - Ex: "Sem gelo"

### **Passo 3: Adicionar ao Carrinho**

1. Clique em **"Adicionar"**
2. Produto vai para o carrinho
3. Continue escolhendo ou finalize

### **Passo 4: Revisar Carrinho**

**Carrinho mostra:**
- Lista de itens
- Quantidades
- Observações
- Subtotal de cada item
- **Total do pedido**

**Ações:**
- Editar quantidade
- Remover item
- Adicionar observação

### **Passo 5: Enviar Pedido**

1. Revise tudo
2. Clique em **"Enviar Pedido"**
3. Confirmação aparece
4. Pedido vai para cozinha/bar

**Confirmação:**
- ✅ "Pedido enviado!"
- Número do pedido
- Tempo estimado

---

## 📊 Portal do Cliente

**Rota:** `/acesso-cliente/[comandaId]/resumo`

### **Resumo da Comanda**

**Informações exibidas:**
- 🪑 Mesa ou 📍 Ponto de entrega
- 📝 Todos os pedidos feitos
- 💰 Total da comanda
- ⏱️ Tempo na mesa

### **Lista de Pedidos**

**Cada pedido mostra:**
- Itens
- Quantidades
- Status (Feito, Preparando, Pronto, Entregue)
- Horário
- Valor

**Status em Tempo Real:**
- 🔵 FEITO - Pedido enviado
- 🟡 EM PREPARO - Cozinha preparando
- 🟢 PRONTO - Aguardando entrega
- ⚪ ENTREGUE - Chegou na mesa

---

## 🔄 Acompanhar Pedidos em Tempo Real

### **Atualização Automática**

**Sistema atualiza sozinho:**
- Quando cozinha inicia preparo
- Quando pedido fica pronto
- Quando garçom entrega

**Você vê:**
- Status atual
- Tempo decorrido
- Estimativa de entrega

### **Notificações**

**Você recebe alerta quando:**
- 🔔 Pedido ficou pronto
- 🔔 Garçom está levando
- 🔔 Pedido foi entregue

**Tipos de notificação:**
- Visual (na tela)
- Sonora (opcional)
- Vibração (mobile)

---

## ⭐ Avaliar Atendimento

### **Quando Avaliar**

**Momento ideal:**
- Após receber todos os pedidos
- Antes de pedir a conta
- Ao final da experiência

### **Como Avaliar**

**Rota:** Aparece automaticamente no portal

**Avaliação inclui:**
1. **Nota (1-5 estrelas)**
   - ⭐ Péssimo
   - ⭐⭐ Ruim
   - ⭐⭐⭐ Regular
   - ⭐⭐⭐⭐ Bom
   - ⭐⭐⭐⭐⭐ Excelente

2. **Comentário (opcional)**
   - O que gostou
   - O que pode melhorar
   - Sugestões

3. **Dados adicionais (automático)**
   - Tempo de estadia
   - Valor gasto
   - Itens consumidos

**Enviar:**
1. Escolha estrelas
2. Escreva comentário (opcional)
3. Clique em **"Enviar Avaliação"**
4. Agradecimento aparece

**Importância:**
- Ajuda o estabelecimento a melhorar
- Reconhece bom atendimento
- Influencia ranking de garçons

---

## 🎉 Eventos Especiais

### **Acessar Evento**

**Rota:** `/entrada/[eventoSlug]`

**Como funciona:**
1. Estabelecimento divulga link do evento
2. Você acessa o link
3. Vê informações do evento:
   - Nome
   - Data e hora
   - Descrição
   - Valor (se couvert)
   - Imagem

4. Clique em **"Entrar"**
5. Informe seus dados
6. Sistema cria comanda vinculada ao evento

**Vantagens:**
- Entrada controlada
- Comanda já vinculada
- Acesso ao cardápio
- Pedidos facilitados

---

## 💡 Dicas para Melhor Experiência

### **1. Salve o Link**

**Como:**
- Adicione aos favoritos
- Ou salve na tela inicial (mobile)

**Vantagem:**
- Acesso rápido
- Não precisa escanear QR Code toda vez

### **2. Ative Notificações**

**Como:**
- Permita notificações no navegador
- Você será avisado quando pedido ficar pronto

### **3. Use Observações**

**Exemplos:**
- "Sem cebola"
- "Bem passado"
- "Pouco sal"
- "Alérgico a amendoim"

**Benefício:**
- Pedido vem do jeito que você gosta
- Evita erro

### **4. Confira Antes de Enviar**

**Sempre revise:**
- Itens corretos
- Quantidades certas
- Observações claras
- Total do pedido

### **5. Avalie o Atendimento**

**Por quê:**
- Ajuda o estabelecimento
- Reconhece bom garçom
- Melhora serviço para todos

### **6. Peça a Conta pelo App** (Futuro)

⚠️ **Ainda não implementado**

**Quando estiver:**
- Clique em "Pedir Conta"
- Garçom é notificado
- Vem mais rápido

---

## 🚨 Problemas Comuns e Soluções

### **1. QR Code não funciona**

**Solução:**
- Limpe câmera do celular
- Aproxime mais do QR Code
- Use app de QR Code se necessário
- Peça ajuda ao garçom

### **2. Perdi o acesso**

**Solução:**
- Use "Recuperar Comanda"
- Digite número da mesa ou CPF
- Ou peça novo QR Code ao garçom

### **3. Pedido não aparece**

**Possíveis causas:**
- Não clicou em "Enviar"
- Conexão caiu
- Erro no sistema

**Solução:**
- Verifique se está no carrinho
- Recarregue página
- Tente enviar novamente
- Chame garçom se persistir

### **4. Preço está errado**

**Solução:**
- Confira no cardápio físico
- Avise garçom
- Gerente pode corrigir

### **5. Não consigo fazer pedido**

**Possíveis causas:**
- Comanda já foi fechada
- Cozinha fechou
- Produto esgotou

**Solução:**
- Verifique status da comanda
- Pergunte ao garçom
- Escolha outro produto

---

## 📱 Compatibilidade

### **Navegadores Suportados**

**Mobile:**
- ✅ Chrome (Android)
- ✅ Safari (iOS)
- ✅ Firefox
- ✅ Edge

**Desktop:**
- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge

**Versões:**
- Últimas 2 versões

### **Dispositivos**

**Smartphones:**
- ✅ iPhone 6 ou superior
- ✅ Android 8 ou superior

**Tablets:**
- ✅ iPad
- ✅ Android tablets

**Conexão:**
- Wi-Fi recomendado
- 3G/4G/5G funciona

---

## 🔒 Privacidade e Segurança

### **Dados Coletados**

**Obrigatórios:**
- Nome (para identificação)

**Opcionais:**
- CPF (para recuperar comanda)
- Celular (para contato)
- Email (para promoções)

### **Uso dos Dados**

**Seus dados são usados para:**
- Identificar sua comanda
- Processar pedidos
- Enviar notificações
- Melhorar serviço

**Não são usados para:**
- ❌ Vender para terceiros
- ❌ Spam
- ❌ Propaganda não solicitada

### **Segurança**

**Sistema usa:**
- ✅ HTTPS (conexão segura)
- ✅ Dados criptografados
- ✅ Acesso restrito

**Você pode:**
- Ver seus dados
- Solicitar exclusão
- Revogar permissões

---

## ❓ Perguntas Frequentes (FAQ)

### **1. Preciso criar conta?**

**Não!** Acesso é direto via QR Code ou primeiro acesso.

### **2. Posso fazer pedido sem internet?**

**Não.** É necessário conexão para enviar pedidos.

### **3. Quanto tempo demora o pedido?**

**Depende:**
- Bebidas: 5-10 minutos
- Petiscos: 10-20 minutos
- Pratos: 20-30 minutos

Você acompanha em tempo real!

### **4. Posso cancelar pedido?**

**Depende:**
- Se ainda não iniciou preparo: SIM (chame garçom)
- Se já está preparando: NÃO

### **5. Como pago?**

**No caixa:**
- Peça a conta ao garçom
- Vá até o caixa
- Pague (dinheiro, cartão, PIX)

⚠️ **Pagamento pelo app:** Não disponível ainda

### **6. Posso dividir a conta?**

**Sim!** Peça ao caixa para dividir.

⚠️ **Divisão automática:** Não disponível ainda

### **7. Preciso dar gorjeta?**

**Opcional!** Mas é apreciado se o atendimento foi bom.

**Sugestão:** 10% do valor

### **8. Posso ver pedidos de outras mesas?**

**Não!** Você só vê sua comanda.

---

## 🎯 Conclusão

**Como cliente, você tem:**
- ✅ Cardápio digital com fotos
- ✅ Pedidos pelo celular
- ✅ Acompanhamento em tempo real
- ✅ Resumo da comanda
- ✅ Avaliação de atendimento
- ✅ Recuperação de comanda

**Sistema está 90% pronto para clientes!**

**O que falta:**
- ⚠️ Pagamento pelo app
- ⚠️ Divisão de conta automática
- ⚠️ Programa de fidelidade
- ⚠️ Cupons de desconto

**Mas a experiência já é excelente!** 🚀

---

**Fim da Documentação por Perfil**

**Voltar ao Índice:** [INDICE.md](./INDICE.md)
