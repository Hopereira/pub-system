# 🧪 PLANO DE TESTES DE USABILIDADE - ISSUE #227

**Data:** 12/11/2025  
**Branch:** `feature/227-auditoria-usabilidade-completa`  
**Objetivo:** Auditoria completa de usabilidade e caça a bugs em todo o sistema  
**Status Sistema:** 98% Implementado

---

## 📋 RESUMO EXECUTIVO

### Contexto
Com base na análise de 70+ documentos de documentação, o sistema Pub System está **98% completo** com:
- ✅ Backend 100% (15 módulos)
- ✅ Frontend Core 100%
- ✅ Sistema Garçom 95%
- ✅ Rastreamento 100%
- ✅ Analytics 100%

### Objetivos dos Testes
1. **Validar usabilidade** em todos os fluxos principais
2. **Identificar bugs** não documentados
3. **Testar edge cases** e cenários extremos
4. **Verificar responsividade** mobile/desktop
5. **Validar acessibilidade** e controle de acesso por role
6. **Testar performance** sob carga
7. **Verificar integrações** WebSocket, API, banco de dados

---

## 🎯 ÁREAS DE TESTE

### 1. AUTENTICAÇÃO E AUTORIZAÇÃO

#### 1.1 Login e Logout
**Fluxos:**
- [ ] Login com credenciais válidas (cada role)
- [ ] Login com credenciais inválidas
- [ ] Login com campos vazios
- [ ] Logout e verificar sessão
- [ ] Token expirado - redirecionamento
- [ ] Refresh automático de token

**Roles a testar:**
- [ ] ADMIN - Acesso total
- [ ] GERENTE - Gestão operacional
- [ ] CAIXA - Terminal de caixa
- [ ] GARCOM - Área do garçom
- [ ] COZINHA - Painel de preparo

**Redirecionamentos:**
- [ ] Admin → /dashboard
- [ ] Gerente → /dashboard
- [ ] Caixa → /caixa
- [ ] Garçom → /garcom
- [ ] Cozinha → /cozinha

#### 1.2 Controle de Acesso (RoleGuard)
**Testar bloqueios:**
- [ ] Garçom tentando acessar /dashboard (deve bloquear)
- [ ] Garçom tentando acessar /dashboard/operacional/mesas (deve bloquear)
- [ ] Caixa tentando acessar /garcom (deve bloquear)
- [ ] Cozinha acessando /dashboard/gestaopedidos (deve permitir)
- [ ] Tela "Acesso Negado" com botão de redirecionamento

---

### 2. SISTEMA DO GARÇOM (95% - CRÍTICO)

#### 2.1 Dashboard do Garçom (/garcom)
**Elementos:**
- [ ] Saudação personalizada aparece
- [ ] Card de check-in/check-out funciona
- [ ] Status ativo/inativo visual correto
- [ ] Tempo trabalhado atualiza em tempo real
- [ ] Cards de navegação clicáveis
- [ ] Estatísticas do dia carregam

#### 2.2 Check-in/Check-out
**Fluxos:**
- [ ] Check-in quando inativo
- [ ] Tempo trabalhado calcula corretamente
- [ ] Check-out solicita confirmação
- [ ] Check-out registra horário no banco
- [ ] Não permite check-in duplo
- [ ] Valida turno antes de retirar pedido
- [ ] ⚠️ **BUG CONHECIDO:** Validação de turno na entrega está faltando

**Arquivo:** `frontend/src/components/turno/CardCheckIn.tsx`

#### 2.3 Mapa Visual (/dashboard/mapa/visualizar)
**Funcionalidades:**
- [ ] Mesas aparecem nas posições corretas
- [ ] Cores por status funcionam:
  - Verde = LIVRE
  - Vermelho = OCUPADA
  - Amarelo = RESERVADA
  - Azul = Ponto de Entrega
- [ ] Nome do cliente visível em mesas ocupadas
- [ ] Tempo de ocupação calcula corretamente
- [ ] Click em mesa abre Sheet com ações
- [ ] Ações por status da mesa funcionam
- [ ] Pontos de entrega aparecem
- [ ] Modal de comandas por ponto funciona
- [ ] Filtro "Apenas com pedidos prontos" funciona
- [ ] Zoom in/out funciona
- [ ] Atualização a cada 30s funciona

**Interatividade Mobile:**
- [ ] Sheet tem altura 85vh
- [ ] Botões têm tamanho 64px (mobile-friendly)
- [ ] Touch funciona corretamente
- [ ] Scroll do sheet funciona

#### 2.4 Pedido Rápido via Mapa
**Fluxo completo:**
1. [ ] Click em mesa ocupada no mapa
2. [ ] Click em "Adicionar Pedido"
3. [ ] Página /garcom/novo-pedido abre
4. [ ] Mesa já vem selecionada (via URL mesaId)
5. [ ] Cliente já vem selecionado
6. [ ] Garçom só seleciona produtos
7. [ ] Envio do pedido funciona
8. [ ] **Validar:** Economia de 42% no tempo (2min → 30seg)

**Edge cases:**
- [ ] Mesa sem cliente
- [ ] URL sem mesaId
- [ ] Mesa inválida

#### 2.5 Gestão de Pedidos (/garcom/gestao-pedidos)
**Elementos:**
- [ ] Lista de pedidos carrega
- [ ] Nome do cliente em DESTAQUE (primeiro)
- [ ] Local exibido (mesa/ponto/balcão)
- [ ] Tempo decorrido atualiza em tempo real
- [ ] Som de notificação toca para novos prontos 🔔
- [ ] Toast visual aparece
- [ ] Botão "Localizar Cliente" sempre visível
- [ ] Filtros por ambiente funcionam
- [ ] Filtros por status funcionam
- [ ] WebSocket atualiza em tempo real

**Notificações:**
- [ ] Som toca apenas para NOVOS pedidos prontos
- [ ] Som NÃO toca ao carregar a página
- [ ] Permissão de áudio solicitada
- [ ] Fallback para tons sintéticos funciona

#### 2.6 Novo Pedido (/garcom/novo-pedido)
**Fluxo:**
- [ ] Busca de cliente por nome funciona
- [ ] Busca de cliente por CPF funciona
- [ ] Criar cliente rápido funciona
- [ ] Seleção de mesa funciona
- [ ] Seleção de ponto de entrega funciona
- [ ] Grid de produtos 2 colunas (mobile)
- [ ] Adicionar item ao carrinho
- [ ] Remover item do carrinho
- [ ] Alterar quantidade
- [ ] Campo observação funciona
- [ ] Enviar pedido funciona
- [ ] Validações impedem envio vazio

---

### 3. MAPA DE MESAS (3 ROTAS DIFERENTES)

#### 3.1 Operacional (/dashboard/operacional/mesas)
**Acesso:**
- [ ] ADMIN, GERENTE, GARCOM podem acessar
- [ ] Cards de mesas por ambiente
- [ ] Clique abre/continua comanda
- [ ] Não depende de posições configuradas

#### 3.2 Configurador (/dashboard/mapa/configurar)
**Acesso:**
- [ ] Apenas ADMIN e GERENTE
- [ ] Garçom é bloqueado

**Funcionalidades:**
- [ ] Drag & drop de mesas funciona
- [ ] Drag & drop de pontos de entrega funciona
- [ ] Rotação de elementos funciona
- [ ] Salvar posições no banco funciona
- [ ] Botão "Ver Mapa Operacional" redireciona

#### 3.3 Visualização Espacial (/garcom/mapa)
**Acesso:**
- [ ] GARCOM, ADMIN, GERENTE
- [ ] Redirecionamento correto para /dashboard/mapa/visualizar

---

### 4. FLUXO DE PEDIDOS (CRÍTICO)

#### 4.1 Criação de Pedido
**Fluxos:**
- [ ] Pedido por garçom (via interface)
- [ ] Pedido por cliente (via QR Code)
- [ ] Múltiplos itens de ambientes diferentes
- [ ] Validação de quantidade máxima (100 unidades)
- [ ] Cálculo de preço correto (Decimal.js)

#### 4.2 Gestão de Status
**Transições:**
- [ ] FEITO → EM_PREPARO (cozinha inicia)
- [ ] EM_PREPARO → QUASE_PRONTO (automático 70% tempo)
- [ ] QUASE_PRONTO → PRONTO (cozinha marca)
- [ ] PRONTO → RETIRADO (garçom retira)
- [ ] RETIRADO → ENTREGUE (garçom entrega)
- [ ] PRONTO → DEIXADO_NO_AMBIENTE (cliente não encontrado)

**Validações:**
- [ ] Apenas status válidos permitem transição
- [ ] Turno ativo validado ao retirar
- [ ] ⚠️ **TESTAR BUG:** Validação de turno na entrega

#### 4.3 Pedidos Pendentes (/dashboard/operacional/pedidos-pendentes)
**Funcionalidades:**
- [ ] Página carrega sem erro de data
- [ ] Cliente e mesa destacados
- [ ] Local de preparo exibido
- [ ] Validação de datas inválidas funciona
- [ ] ✅ **CORRIGIDO:** RangeError: Invalid time value (sessão 12/11)

#### 4.4 Pedidos Prontos (/dashboard/operacional/pedidos-prontos)
**Funcionalidades:**
- [ ] Botões "Entregar" e "Deixar no Ambiente" visíveis
- [ ] Botão verde "Entregar" funciona
- [ ] Botão laranja "Deixar no Ambiente" funciona
- [ ] Duplo clique não causa erro 400
- [ ] Erro de retirada duplicada tratado
- [ ] Item sai da lista após entrega
- [ ] ✅ **CORRIGIDO:** Botões invisíveis (sessão 12/11)
- [ ] ✅ **CORRIGIDO:** Erro retirada duplicada (sessão 12/11)

---

### 5. SISTEMA DE RASTREAMENTO (100%)

#### 5.1 Rastreamento de Comandas
**Campos:**
- [ ] criadoPorId registrado
- [ ] criadoPorTipo correto (GARCOM/CLIENTE)
- [ ] dataAbertura registrada
- [ ] Relação com Funcionario carrega

#### 5.2 Rastreamento de Pedidos
**Campos:**
- [ ] criadoPorId registrado
- [ ] entreguePorId registrado
- [ ] entregueEm registrado
- [ ] tempoTotalMinutos calculado

#### 5.3 Rastreamento de Itens
**Campos:**
- [ ] iniciadoEm registrado
- [ ] prontoEm registrado
- [ ] entregueEm registrado
- [ ] garcomEntregaId registrado
- [ ] tempoPreparoMinutos calculado
- [ ] tempoEntregaMinutos calculado
- [ ] ⚠️ **BUG CONHECIDO:** ambienteRetiradaId não preenchido no fluxo normal

**Testar Solução:**
- [ ] Implementar registro de ambiente na retirada
- [ ] Validar turno na entrega
- [ ] Verificar dados completos após correção

---

### 6. ANALYTICS E RELATÓRIOS (/dashboard/relatorios)

#### 6.1 Relatório Geral
**Métricas:**
- [ ] Total de pedidos correto
- [ ] Total de itens correto
- [ ] Valor total em vendas correto
- [ ] Tempo médio de preparo calculado
- [ ] Tempo médio de entrega calculado

#### 6.2 Performance de Garçons
**Dados:**
- [ ] Ranking de garçons carrega
- [ ] Entregas por garçom corretas
- [ ] Tempo médio por garçom correto
- [ ] Ordenação funciona

#### 6.3 Performance de Ambientes
**Dados:**
- [ ] Ranking de ambientes carrega
- [ ] Volume por ambiente correto
- [ ] Eficiência calculada
- [ ] Tempo médio por ambiente

#### 6.4 Produtos
**Dados:**
- [ ] Top 10 mais vendidos correto
- [ ] Bottom 5 menos vendidos correto
- [ ] Gráficos renderizam
- [ ] Auto-refresh funciona

---

### 7. WEBSOCKET E NOTIFICAÇÕES

#### 7.1 Conexão WebSocket
**Funcionalidades:**
- [ ] Conexão estabelecida ao abrir página
- [ ] Reconexão automática após desconexão
- [ ] Polling ativado apenas se WebSocket desconectado
- [ ] CORS restrito para FRONTEND_URL

#### 7.2 Eventos Emitidos
**Testar cada evento:**
- [ ] novo_pedido
- [ ] novo_pedido_ambiente:{id}
- [ ] status_atualizado
- [ ] status_atualizado_ambiente:{id}
- [ ] comanda_atualizada
- [ ] item_deixado_no_ambiente
- [ ] item_quase_pronto
- [ ] item_pronto
- [ ] item_retirado
- [ ] item_entregue

#### 7.3 Notificações por Ambiente
**Validar:**
- [ ] Som toca apenas no ambiente relevante
- [ ] Notificação não toca em outros ambientes
- [ ] Destaque visual por 5 segundos
- [ ] Toast aparece e desaparece

---

### 8. PONTOS DE ENTREGA

#### 8.1 Backend
**Endpoints:**
- [ ] GET /pontos-entrega lista todos
- [ ] POST /pontos-entrega cria novo
- [ ] PUT /pontos-entrega/:id atualiza
- [ ] DELETE /pontos-entrega/:id remove

#### 8.2 Frontend
**Funcionalidades:**
- [ ] Lista de pontos carrega
- [ ] CRUD completo funciona
- [ ] Pontos aparecem no mapa visual
- [ ] Modal de comandas por ponto funciona
- [ ] Cores e ícones corretos

---

### 9. SISTEMA DE MEDALHAS (90%)

#### 9.1 Medalhas Implementadas
**Testar detecção:**
- [ ] ROOKIE - Primeira entrega
- [ ] VELOCISTA - 10 entregas rápidas
- [ ] MARATONISTA - 100 entregas no mês

#### 9.2 Medalhas Pendentes
**Implementar lógica:**
- [ ] PONTUAL - Check-in no horário
- [ ] MVP - Mais entregas do mês
- [ ] CONSISTENTE - 30 dias consecutivos

#### 9.3 Interface de Ranking
**Funcionalidades:**
- [ ] Ranking de garçons carrega
- [ ] Medalhas aparecem
- [ ] Ordenação funciona
- [ ] ⏳ **PENDENTE:** Animações de subida/descida
- [ ] ⏳ **PENDENTE:** Confete ao ganhar medalha
- [ ] ⏳ **PENDENTE:** WebSocket tempo real

---

### 10. COMANDAS E AGREGADOS

#### 10.1 Abertura de Comanda
**Fluxos:**
- [ ] Comanda por mesa
- [ ] Comanda por ponto de entrega
- [ ] Comanda balcão (sem mesa/ponto)
- [ ] Múltiplos clientes (agregados)
- [ ] Cliente principal definido

#### 10.2 Gestão de Agregados
**Funcionalidades:**
- [ ] Adicionar agregado funciona
- [ ] Remover agregado funciona
- [ ] Pedidos de agregados rastreados
- [ ] Total calculado corretamente

#### 10.3 Fechamento de Comanda
**Validações:**
- [ ] Não permite fechar com pedidos pendentes
- [ ] Calcula total correto
- [ ] Registra fechamento no banco
- [ ] Bloqueia acesso após fechamento
- [ ] QR Code desativado após fechar

---

### 11. INTERFACE PÚBLICA (QR CODE)

#### 11.1 Visualização de Comanda (/comanda/:id)
**Funcionalidades:**
- [ ] Página carrega sem login
- [ ] Lista de pedidos aparece
- [ ] Status de cada item correto
- [ ] Cores por status funcionam
- [ ] Tempo decorrido atualiza
- [ ] WebSocket atualiza em tempo real
- [ ] Design mobile-friendly

#### 11.2 Eventos e Landing Pages
**Funcionalidades:**
- [ ] Landing pages carregam (/evento/:slug)
- [ ] Imagens aparecem
- [ ] Informações corretas
- [ ] Links funcionam
- [ ] Formulários funcionam

---

### 12. RESPONSIVIDADE E MOBILE

#### 12.1 Breakpoints
**Testar em:**
- [ ] Mobile (320px - 767px)
- [ ] Tablet (768px - 1023px)
- [ ] Desktop (1024px+)
- [ ] Wide (1920px+)

#### 12.2 Componentes Críticos
**Mobile:**
- [ ] Sidebar colapsável
- [ ] Grid de produtos 2 colunas
- [ ] Botões tamanho 64px (touch-friendly)
- [ ] Sheets 85vh altura
- [ ] Modais responsivos
- [ ] Tabelas com scroll horizontal

---

### 13. PERFORMANCE

#### 13.1 Carregamento
**Métricas:**
- [ ] Tempo de primeira renderização < 2s
- [ ] Imagens otimizadas
- [ ] Code splitting funciona
- [ ] Lazy loading de componentes

#### 13.2 Consultas ao Banco
**Otimizações:**
- [ ] Índices criados nas colunas certas
- [ ] Queries N+1 evitadas
- [ ] Eager loading usado corretamente
- [ ] Paginação implementada

#### 13.3 WebSocket
**Performance:**
- [ ] Latência < 100ms
- [ ] Reconexão rápida
- [ ] Não sobrecarrega servidor
- [ ] Throttling de eventos

---

### 14. EDGE CASES E CENÁRIOS EXTREMOS

#### 14.1 Dados Inválidos
- [ ] Campos vazios
- [ ] Campos com caracteres especiais
- [ ] Números negativos
- [ ] Datas inválidas
- [ ] IDs inexistentes
- [ ] Relações quebradas

#### 14.2 Cenários de Negócio
- [ ] Mesa ocupada mas sem comanda
- [ ] Comanda sem pedidos
- [ ] Pedido sem itens
- [ ] Item de ambiente desativado
- [ ] Garçom sem turno ativo tentando retirar
- [ ] Múltiplos garçons no mesmo pedido

#### 14.3 Concorrência
- [ ] Dois garçons retirando mesmo item
- [ ] Dois garçoms entregando mesmo item
- [ ] Cliente fechando comanda enquanto garçom adiciona pedido
- [ ] Mesa sendo configurada durante uso

---

## 🐛 BUGS CONHECIDOS (DOCUMENTADOS)

### Bugs Corrigidos Recentemente
- [x] ✅ Data inválida em pedidos pendentes (12/11)
- [x] ✅ Erro de retirada duplicada (12/11)
- [x] ✅ Botões de ação invisíveis (12/11)

### Bugs Pendentes
- [ ] ⚠️ Validação de turno na entrega (fácil - 15min)
- [ ] ⚠️ ambienteRetiradaId não preenchido (fácil - 30min)
- [ ] ⚠️ Detecção de 3 tipos de medalhas (médio - 2-3 dias)
- [ ] ⚠️ Animações ranking (baixo - 1-2 dias)

---

## 📊 CRITÉRIOS DE SUCESSO

### Nível 1: CRÍTICO (Bloqueador)
✅ Todos os fluxos principais funcionam sem erros
✅ Controle de acesso por role funciona 100%
✅ WebSocket conecta e atualiza em tempo real
✅ Rastreamento completo registra todos os dados

### Nível 2: IMPORTANTE (Alta Prioridade)
✅ Responsividade mobile perfeita
✅ Performance aceitável (< 2s carregamento)
✅ Notificações sonoras funcionam
✅ Validações impedem dados inválidos

### Nível 3: DESEJÁVEL (Melhorias)
✅ Animações suaves
✅ Feedback visual em todas as ações
✅ Loading states durante operações
✅ Mensagens de erro claras

---

## 📝 TEMPLATE DE RELATÓRIO DE BUG

```markdown
### 🐛 BUG #XXX: [Título Descritivo]

**Severidade:** 🔴 CRÍTICA / 🟠 ALTA / 🟡 MÉDIA / 🟢 BAIXA

**Área:** [Sistema do Garçom / Pedidos / Mapa / etc.]

**Descrição:**
[Descrição clara do problema]

**Passos para Reproduzir:**
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

**Resultado Esperado:**
[O que deveria acontecer]

**Resultado Atual:**
[O que está acontecendo]

**Logs/Screenshots:**
```
[Logs ou prints relevantes]
```

**Ambiente:**
- Browser: [Chrome/Firefox/Safari]
- Versão: [versão]
- Device: [Desktop/Mobile/Tablet]
- Role: [ADMIN/GARENTE/GARCOM/etc.]

**Possível Solução:**
[Se souber, sugerir solução]

**Prioridade:**
[Alta/Média/Baixa] - [Justificativa]
```

---

## 🎯 METODOLOGIA DE TESTE

### 1. Testes Exploratórios
- Explorar livremente o sistema
- Testar fluxos não documentados
- Procurar comportamentos inesperados

### 2. Testes de Regressão
- Verificar funcionalidades documentadas
- Confirmar correções de bugs anteriores
- Garantir que nada quebrou

### 3. Testes de Carga
- Múltiplos usuários simultâneos
- Muitos pedidos ao mesmo tempo
- WebSocket com muitas conexões

### 4. Testes de Usabilidade
- Facilidade de uso
- Clareza das interfaces
- Feedback ao usuário
- Fluxos intuitivos

---

## 📅 CRONOGRAMA SUGERIDO

### Dia 1: Autenticação e Garçom
- [ ] Testes de login/logout (1h)
- [ ] Controle de acesso (1h)
- [ ] Dashboard do garçom (1h)
- [ ] Check-in/check-out (1h)
- [ ] Mapa visual (2h)

### Dia 2: Pedidos e Fluxos
- [ ] Criação de pedidos (2h)
- [ ] Gestão de status (2h)
- [ ] Pedidos pendentes/prontos (2h)

### Dia 3: Rastreamento e Analytics
- [ ] Rastreamento completo (2h)
- [ ] Relatórios (2h)
- [ ] WebSocket e notificações (2h)

### Dia 4: Extras e Edge Cases
- [ ] Pontos de entrega (1h)
- [ ] Medalhas (1h)
- [ ] Comandas e agregados (2h)
- [ ] Edge cases (2h)

### Dia 5: Responsividade e Performance
- [ ] Testes mobile (2h)
- [ ] Testes performance (2h)
- [ ] Consolidação de bugs (2h)

---

## 🏁 ENTREGA FINAL

### Documentos a Criar
1. **RELATORIO_BUGS_227.md** - Lista completa de bugs encontrados
2. **PLANO_CORRECOES_227.md** - Plano de correção priorizado
3. **CHECKLIST_TESTES_227.md** - Checklist com status de cada teste
4. **RESUMO_AUDITORIA_227.md** - Resumo executivo da auditoria

### Métricas a Reportar
- Total de testes executados
- Total de bugs encontrados (por severidade)
- Áreas com mais problemas
- Taxa de sucesso por módulo
- Tempo estimado para correções

---

**🎯 Meta: Sistema 100% funcional, testado e pronto para produção!**
