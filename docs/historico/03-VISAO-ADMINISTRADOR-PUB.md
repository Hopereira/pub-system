# 👔 Visão do Administrador do Pub (Gerente/Proprietário)

**Público-alvo:** Proprietários, Gerentes, Administradores do estabelecimento  
**Data:** 04/12/2024  
**Status:** ✅ 90% Funcional

---

## 🎯 Objetivo

Este documento descreve como gerenciar o estabelecimento usando o **Pub System**, incluindo:

1. **Gestão de funcionários** e turnos
2. **Gestão de produtos** e cardápio
3. **Gestão de mesas** e ambientes
4. **Acompanhamento de pedidos** em tempo real
5. **Relatórios** e analytics
6. **Configurações** do sistema

---

## 🔐 Acesso ao Sistema

### **Login**

1. Acesse: `https://seudominio.com/login`
2. Digite seu **email** e **senha**
3. Clique em **Entrar**

**Seu cargo:** ADMIN ou GERENTE

**Redirecionamento:** Após login, você será levado para `/dashboard`

---

## 🏠 Dashboard Principal

**Rota:** `/dashboard`

### **Visão Geral**

O dashboard mostra métricas em tempo real:

#### **Métricas Principais**
- 💰 **Vendas do Dia** - Total em R$
- 🪑 **Mesas Ocupadas** - X de Y mesas
- ⏱️ **Tempo Médio de Preparo** - Minutos
- 📋 **Pedidos Pendentes** - Quantidade
- 📝 **Comandas Abertas** - Quantidade
- ⭐ **Taxa de Satisfação** - Média de avaliações

#### **Gráficos**
- Vendas por hora
- Produtos mais vendidos
- Performance por garçom

---

## 👥 Gestão de Funcionários

**Rota:** `/dashboard/admin/funcionarios`

### **Listar Funcionários**

**Informações exibidas:**
- Nome
- Email
- Cargo (ADMIN, GERENTE, GARCOM, CAIXA, COZINHA)
- Status (ATIVO, INATIVO)
- Ações (Editar, Desativar)

### **Criar Novo Funcionário**

1. Clique em **"Novo Funcionário"**
2. Preencha o formulário:
   - Nome completo
   - Email (será o login)
   - Senha inicial
   - Cargo
   - Ambiente (se COZINHA)
3. Clique em **"Salvar"**

**Cargos Disponíveis:**
- **ADMIN** - Acesso total ao sistema
- **GERENTE** - Gestão operacional (sem empresa)
- **GARCOM** - Área do garçom
- **CAIXA** - Área do caixa
- **COZINHA** - Kanban de pedidos

### **Editar Funcionário**

1. Clique no ícone de edição
2. Altere os dados necessários
3. Clique em **"Atualizar"**

### **Desativar Funcionário**

1. Clique no ícone de desativar
2. Confirme a ação
3. Funcionário fica com status INATIVO (não pode fazer login)

⚠️ **Importante:** Não é possível deletar funcionários, apenas desativar (para manter histórico)

---

## 🍽️ Gestão de Produtos (Cardápio)

**Rota:** `/dashboard/admin/cardapio`

### **Listar Produtos**

**Informações exibidas:**
- Imagem
- Nome
- Categoria
- Preço
- Ambiente de preparo
- Status (Ativo/Inativo)

**Categorias:**
- Bebidas
- Petiscos
- Pratos
- Sobremesas
- Outros

### **Criar Novo Produto**

1. Clique em **"Novo Produto"**
2. Preencha o formulário:
   - Nome
   - Descrição
   - Preço (R$)
   - Categoria
   - Ambiente de preparo (Cozinha, Bar, etc)
   - Upload de imagem
3. Clique em **"Salvar"**

**Dicas:**
- Use imagens de boa qualidade (mínimo 800x600px)
- Descrição clara e apetitosa
- Preço sempre atualizado

### **Editar Produto**

1. Clique no produto
2. Altere os dados
3. Clique em **"Atualizar"**

### **Desativar Produto**

1. Toggle "Ativo/Inativo"
2. Produto desativado não aparece no cardápio

---

## 🪑 Gestão de Mesas

**Rota:** `/dashboard/operacional/mesas`

### **Visualização Operacional**

**Agrupado por Ambiente:**
- Salão Principal
- Varanda
- Área VIP
- Etc.

**Cada mesa mostra:**
- Número
- Status (LIVRE, OCUPADA, AGUARDANDO_PAGAMENTO)
- Comanda (se ocupada)
- Total da comanda
- Tempo de ocupação

**Ações:**
- Ver detalhes da comanda
- Fechar comanda (se CAIXA)

### **Criar Nova Mesa**

1. Clique em **"Nova Mesa"**
2. Preencha:
   - Número
   - Ambiente
   - Capacidade (pessoas)
3. Clique em **"Salvar"**

### **Editar Mesa**

1. Clique na mesa
2. Altere dados
3. Salvar

### **Configurar Mapa Visual**

**Rota:** `/dashboard/mapa/configurar`

**Funcionalidades:**
- Arrastar e soltar mesas
- Rotacionar mesas
- Adicionar pontos de entrega
- Salvar layout

**Uso:**
1. Arraste mesas para posição desejada
2. Clique e rotacione se necessário
3. Clique em **"Salvar Layout"**

**Visualizar Mapa:**
**Rota:** `/dashboard/mapa/visualizar`

- Mapa com cores por status
- Atualização em tempo real
- Filtro "Apenas com pedidos prontos"

---

## 🏢 Gestão de Ambientes

**Ambientes** são áreas físicas do estabelecimento.

**Tipos:**
- **PREPARO** - Cozinha, Bar (onde se prepara)
- **ATENDIMENTO** - Salão, Varanda (onde se serve)

**Criar Ambiente:**
1. Acesse configurações
2. Adicione novo ambiente
3. Defina tipo e nome
4. Marque se é ponto de retirada

**Uso:**
- Produtos são vinculados a ambientes de preparo
- Mesas são vinculadas a ambientes de atendimento
- Pedidos são direcionados automaticamente

---

## 📋 Gestão de Pedidos

**Rota:** `/dashboard/gestaopedidos`

### **Kanban de Pedidos**

**Colunas:**
1. **FEITO** - Pedidos novos
2. **EM PREPARO** - Cozinha preparando
3. **PRONTO** - Aguardando retirada
4. **ENTREGUE** - Finalizado

**Cada card mostra:**
- Mesa/Cliente
- Itens do pedido
- Tempo decorrido
- Garçom responsável
- Botões de ação

**Filtros:**
- Por ambiente (Cozinha, Bar)
- Por status
- Por garçom

**Atualização:**
- Tempo real via WebSocket
- Notificações sonoras (opcional)

### **Pedidos Pendentes**

**Rota:** `/dashboard/operacional/pedidos-pendentes`

Lista todos os pedidos que não foram entregues ainda.

---

## 📊 Relatórios e Analytics

**Rota:** `/dashboard/relatorios`

### **Relatórios Disponíveis**

#### **1. Vendas**
- Total por período
- Por forma de pagamento
- Por produto
- Por categoria
- Ticket médio

#### **2. Produtos**
- Mais vendidos
- Menos vendidos
- Receita por produto
- Quantidade vendida

#### **3. Funcionários**
- Ranking de garçons
- Entregas por garçom
- Tempo médio de entrega
- Performance

#### **4. Mesas**
- Taxa de ocupação
- Tempo médio de ocupação
- Faturamento por mesa

#### **5. Caixa**
- Movimentações
- Fechamentos
- Diferenças
- Sangrias

### **Filtros**
- Data início/fim
- Funcionário
- Produto
- Categoria

⚠️ **Limitação:** Exportação PDF/Excel não implementada ainda

---

## 🎉 Gestão de Eventos

**Rota:** `/dashboard/admin/agenda-eventos`

### **Criar Evento**

1. Clique em **"Novo Evento"**
2. Preencha:
   - Título
   - Descrição
   - Data e hora
   - Valor (se couvert)
   - Imagem
3. Clique em **"Salvar"**

### **Páginas de Evento**

**Rota:** `/dashboard/admin/paginas-evento`

**Funcionalidade:**
- Criar página personalizada para evento
- URL única: `/entrada/{slug}`
- Cliente acessa e cria comanda vinculada ao evento
- Controle de entrada

**Uso:**
1. Criar página de evento
2. Vincular evento
3. Gerar QR Code
4. Divulgar

---

## 🏆 Sistema de Medalhas

### **Medalhas Disponíveis**

**Tipos:**
- **VELOCISTA** - Entregas rápidas (< 2min)
- **MARATONISTA** - Muitas entregas em um dia
- **PONTUAL** - Entregas no SLA (< 5min)
- **MVP** - 1º lugar no ranking
- **CONSISTENTE** - Top 3 por vários dias

**Níveis:**
- 🥉 Bronze
- 🥈 Prata
- 🥇 Ouro

**Visualizar:**
- Ranking de garçons mostra medalhas
- Perfil do garçom mostra todas as medalhas

**Gamificação:**
- Motiva equipe
- Reconhece bom desempenho
- Cria competição saudável

---

## ⚙️ Configurações

### **Empresa**

**Rota:** `/dashboard/admin/empresa`

**Dados:**
- Nome fantasia
- Razão social
- CNPJ
- Endereço
- Telefone
- Email
- Logo

⚠️ **Limitação:** Sistema ainda não suporta múltiplas empresas (multi-tenancy)

### **Notificações**

**Configurar:**
- Som ao receber pedido
- Som ao pedido ficar pronto
- Notificações push (futuro)

### **Integrações**

⚠️ **Não implementado:**
- Delivery (iFood, Rappi)
- Nota Fiscal Eletrônica
- WhatsApp Business
- ERP/Contabilidade

---

## 🔔 Alertas e Notificações

### **Alertas Automáticos**

**Sistema alerta quando:**
- ⚠️ Pedido com mais de 10 minutos sem iniciar preparo
- ⚠️ Pedido pronto há mais de 5 minutos sem retirar
- ⚠️ Mesa ocupada há mais de 3 horas
- ⚠️ Diferença de caixa > R$ 50,00
- ⚠️ Funcionário sem check-out há mais de 12 horas

### **Notificações em Tempo Real**

**Via WebSocket:**
- Novo pedido criado
- Pedido ficou pronto
- Pedido entregue
- Comanda fechada

---

## 📱 Acesso Mobile

**Responsivo:** ✅ Sim

O sistema funciona em tablets e smartphones, mas:
- Interface otimizada para desktop
- Algumas funcionalidades limitadas em mobile
- Recomendado tablet (mínimo 10")

⚠️ **App nativo:** Não disponível (roadmap futuro)

---

## 📈 Monitoramento Diário

### **Checklist Diário do Gerente**

**Manhã (Abertura):**
- [ ] Verificar se todos os funcionários fizeram check-in
- [ ] Conferir estoque de produtos críticos
- [ ] Verificar se há pedidos pendentes do dia anterior
- [ ] Testar sistema (criar pedido teste)

**Durante o Dia:**
- [ ] Monitorar tempo médio de preparo
- [ ] Verificar taxa de ocupação de mesas
- [ ] Acompanhar ranking de garçons
- [ ] Resolver problemas reportados

**Noite (Fechamento):**
- [ ] Verificar se todos fizeram check-out
- [ ] Conferir fechamento de caixa
- [ ] Revisar vendas do dia
- [ ] Verificar avaliações de clientes
- [ ] Planejar dia seguinte

---

## 🚨 Problemas Comuns e Soluções

### **1. Garçom não consegue criar pedido**

**Possíveis causas:**
- Não fez check-in
- Produto desativado
- Mesa não existe
- Sem conexão

**Solução:**
- Verificar check-in do garçom
- Verificar se produto está ativo
- Recarregar página

### **2. Pedido não aparece na cozinha**

**Possíveis causas:**
- WebSocket desconectado
- Filtro de ambiente errado
- Pedido já foi preparado

**Solução:**
- Atualizar página da cozinha
- Verificar filtros
- Ver em "Gestão de Pedidos"

### **3. Diferença de caixa**

**Possíveis causas:**
- Sangria não registrada
- Erro de digitação
- Troco não contabilizado

**Solução:**
- Conferir sangrias
- Recontar dinheiro
- Verificar comprovantes de cartão

### **4. Cliente não consegue acessar comanda**

**Possíveis causas:**
- QR Code errado
- Comanda já fechada
- Link expirado

**Solução:**
- Gerar novo QR Code
- Verificar se comanda está aberta
- Cliente pode usar "Recuperar Comanda"

---

## 📚 Treinamento da Equipe

### **Novos Funcionários**

**Garçom:**
1. Mostrar área do garçom
2. Ensinar criar pedido
3. Explicar retirada de itens
4. Mostrar ranking e medalhas
5. Praticar com pedido teste

**Caixa:**
1. Mostrar área do caixa
2. Ensinar abertura/fechamento
3. Explicar formas de pagamento
4. Praticar fechamento de comanda
5. Ensinar registrar sangria

**Cozinha:**
1. Mostrar kanban
2. Explicar fluxo de status
3. Ensinar marcar como pronto
4. Mostrar filtros

### **Materiais de Apoio**

- Manual do Garçom (docs/04-VISAO-GARCOM.md)
- Manual do Caixa (docs/05-VISAO-CAIXA.md)
- Manual da Cozinha (docs/06-VISAO-COZINHA.md)
- Vídeos tutoriais (a criar)

---

## 💡 Dicas de Gestão

### **Para Aumentar Vendas**

1. **Cardápio atrativo** - Fotos de qualidade
2. **Produtos em destaque** - Marcar favoritos
3. **Combos e promoções** - Criar produtos combo
4. **Eventos temáticos** - Usar sistema de eventos

### **Para Melhorar Atendimento**

1. **Monitorar tempo de preparo** - Meta: < 15min
2. **Acompanhar ranking** - Reconhecer melhores
3. **Ler avaliações** - Agir em feedbacks negativos
4. **Treinar equipe** - Usar dados do sistema

### **Para Reduzir Perdas**

1. **Conferir caixa diariamente** - Diferença < R$ 10
2. **Controlar sangrias** - Sempre com autorização
3. **Monitorar estoque** - Evitar desperdício (futuro)
4. **Analisar produtos** - Remover os que não vendem

---

## 🎯 Conclusão

**O sistema oferece:**
- ✅ Gestão completa de funcionários
- ✅ Gestão de produtos e cardápio
- ✅ Gestão de mesas e ambientes
- ✅ Acompanhamento em tempo real
- ✅ Relatórios básicos
- ✅ Sistema de gamificação

**O que ainda falta:**
- ⚠️ Controle de estoque
- ⚠️ Relatórios avançados (PDF/Excel)
- ⚠️ Integrações externas
- ⚠️ App mobile nativo

**Mas o sistema está 90% pronto para uso!** 🚀

---

**Próximo Documento:** [04-VISAO-GARCOM.md](./04-VISAO-GARCOM.md)
