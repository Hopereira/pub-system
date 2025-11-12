# ✅ CHECKLIST DE TESTES - ISSUE #227

**Branch:** `feature/227-auditoria-usabilidade-completa`  
**Data Início:** 12/11/2025

---

## 🎯 TESTES PRIORITÁRIOS (CRÍTICOS)

### 1. AUTENTICAÇÃO (30 min)
- [ ] Login ADMIN → /dashboard
- [ ] Login GERENTE → /dashboard
- [ ] Login CAIXA → /caixa
- [ ] Login GARCOM → /garcom
- [ ] Login COZINHA → /cozinha
- [ ] Garçom bloqueado em /dashboard
- [ ] Token expirado redireciona para login

### 2. CHECK-IN/CHECK-OUT GARÇOM (30 min)
- [ ] Check-in quando inativo
- [ ] Tempo trabalhado atualiza
- [ ] Check-out com confirmação
- [ ] Validação de turno ao retirar pedido
- [ ] **TESTAR BUG:** Validação de turno ao entregar (falta implementar)

### 3. MAPA VISUAL (1h)
- [ ] Mesas nas posições corretas
- [ ] Cores por status (verde/vermelho/amarelo/azul)
- [ ] Nome do cliente em mesas ocupadas
- [ ] Tempo de ocupação correto
- [ ] Sheet com ações abre ao clicar
- [ ] Botões 64px mobile-friendly
- [ ] Pontos de entrega aparecem
- [ ] Modal de comandas por ponto funciona
- [ ] Zoom in/out funciona
- [ ] Atualização 30s funciona

### 4. PEDIDO RÁPIDO VIA MAPA (30 min)
- [ ] Click mesa → "Adicionar Pedido"
- [ ] URL com mesaId
- [ ] Mesa pré-selecionada
- [ ] Cliente pré-selecionado
- [ ] Envio funciona
- [ ] Economia de tempo (30seg vs 2min)

### 5. GESTÃO DE PEDIDOS GARÇOM (1h)
- [ ] Nome do cliente em DESTAQUE
- [ ] Local exibido correto
- [ ] Tempo decorrido atualiza
- [ ] Som toca para novos prontos 🔔
- [ ] Toast visual aparece
- [ ] Botão "Localizar Cliente" visível
- [ ] Filtros funcionam
- [ ] WebSocket atualiza em tempo real

### 6. FLUXO DE STATUS PEDIDOS (1h)
- [ ] FEITO → EM_PREPARO
- [ ] EM_PREPARO → QUASE_PRONTO (automático)
- [ ] QUASE_PRONTO → PRONTO
- [ ] PRONTO → RETIRADO (valida turno)
- [ ] RETIRADO → ENTREGUE
- [ ] PRONTO → DEIXADO_NO_AMBIENTE
- [ ] Duplo clique não causa erro 400
- [ ] Erro retirada duplicada tratado

### 7. PEDIDOS PENDENTES/PRONTOS (30 min)
- [ ] Página pendentes sem erro de data
- [ ] Cliente e mesa destacados
- [ ] Botões "Entregar" e "Deixar" visíveis
- [ ] Botão verde funciona
- [ ] Botão laranja funciona
- [ ] Item sai da lista após ação

### 8. RASTREAMENTO COMPLETO (1h)
- [ ] criadoPorId registrado (comandas)
- [ ] criadoPorId registrado (pedidos)
- [ ] entreguePorId registrado
- [ ] garcomEntregaId registrado
- [ ] Timestamps todos registrados
- [ ] Tempos calculados corretamente
- [ ] **TESTAR BUG:** ambienteRetiradaId vazio (falta implementar)

### 9. ANALYTICS E RELATÓRIOS (1h)
- [ ] Relatório geral carrega
- [ ] Métricas corretas (pedidos/itens/vendas)
- [ ] Ranking garçons funciona
- [ ] Ranking ambientes funciona
- [ ] Top 10 produtos correto
- [ ] Gráficos renderizam
- [ ] Auto-refresh funciona

### 10. WEBSOCKET (30 min)
- [ ] Conexão estabelecida
- [ ] Reconexão automática
- [ ] Eventos chegam em tempo real
- [ ] Som toca no ambiente correto
- [ ] Destaque visual 5 segundos
- [ ] Polling só se desconectado

---

## 🔍 TESTES EXPLORATÓRIOS (IMPORTANTE)

### 11. PONTOS DE ENTREGA (30 min)
- [ ] CRUD completo funciona
- [ ] Aparecem no mapa visual
- [ ] Modal de comandas funciona
- [ ] Cores e ícones corretos

### 12. COMANDAS E AGREGADOS (30 min)
- [ ] Criar comanda por mesa
- [ ] Criar comanda por ponto
- [ ] Adicionar agregados
- [ ] Remover agregados
- [ ] Fechar comanda valida pendentes
- [ ] Bloqueia acesso após fechamento

### 13. INTERFACE PÚBLICA QR CODE (30 min)
- [ ] Página carrega sem login
- [ ] Pedidos aparecem
- [ ] Status corretos
- [ ] WebSocket atualiza
- [ ] Mobile-friendly

### 14. MEDALHAS E RANKING (30 min)
- [ ] Ranking carrega
- [ ] Medalhas aparecem (ROOKIE, VELOCISTA, MARATONISTA)
- [ ] Ordenação funciona
- [ ] **PENDENTE:** PONTUAL, MVP, CONSISTENTE
- [ ] **PENDENTE:** Animações

---

## 📱 TESTES MOBILE (1h)

### 15. RESPONSIVIDADE
- [ ] Teste em 320px (mobile pequeno)
- [ ] Teste em 375px (mobile médio)
- [ ] Teste em 768px (tablet)
- [ ] Teste em 1024px (desktop)
- [ ] Sidebar colapsável
- [ ] Grid produtos 2 colunas
- [ ] Botões tamanho adequado
- [ ] Sheets altura correta
- [ ] Scroll funciona

---

## 🎭 EDGE CASES (1h)

### 16. CENÁRIOS EXTREMOS
- [ ] Campos vazios
- [ ] Caracteres especiais
- [ ] Números negativos
- [ ] Datas inválidas
- [ ] IDs inexistentes
- [ ] Mesa sem comanda
- [ ] Comanda sem pedidos
- [ ] Pedido sem itens
- [ ] Garçom sem turno tentando retirar
- [ ] Dois garçons no mesmo item (concorrência)

---

## 🐛 BUGS A VALIDAR

### Bugs Corrigidos (Confirmar Fix)
- [ ] ✅ Data inválida pedidos pendentes (corrigido 12/11)
- [ ] ✅ Erro retirada duplicada (corrigido 12/11)
- [ ] ✅ Botões invisíveis (corrigido 12/11)

### Bugs Conhecidos (Testar)
- [ ] ⚠️ Validação turno na entrega (falta implementar)
- [ ] ⚠️ ambienteRetiradaId não preenchido (falta implementar)
- [ ] ⚠️ Detecção medalhas PONTUAL, MVP, CONSISTENTE (pendente)

---

## 📊 RESUMO DE PROGRESSO

**Total de Testes:** ~180  
**Concluídos:** [ ] 0%  
**Bugs Encontrados:** 0  
**Bugs Críticos:** 0

**Tempo Estimado Total:** ~12 horas  
**Tempo Decorrido:** 0h

---

## 🏆 CRITÉRIOS DE APROVAÇÃO

### ✅ Sistema Aprovado Se:
- [ ] 100% dos testes críticos passam
- [ ] Nenhum bug crítico encontrado
- [ ] Bugs conhecidos documentados
- [ ] Responsividade mobile 100%
- [ ] WebSocket funciona em tempo real
- [ ] Rastreamento completo funciona

### ⚠️ Sistema Precisa Correções Se:
- Bugs críticos encontrados
- Testes críticos falhando
- Performance inaceitável
- Problemas de usabilidade graves

---

## 📝 ANOTAÇÕES

### Bugs Encontrados
```
[Adicionar bugs conforme encontrados]
```

### Melhorias Sugeridas
```
[Adicionar sugestões de melhorias]
```

### Observações
```
[Adicionar observações gerais]
```

---

**Início dos Testes:** [ ] Não iniciado  
**Status Atual:** Aguardando execução  
**Próximo Passo:** Executar testes críticos (seção 1-10)
