# 🎯 TESTE MANUAL - Fluxo QUASE_PRONTO

## Status do Sistema ✅

### Banco de Dados
- **Total de itens**: 51 pedidos
- **Status atual**: Todos ENTREGUE
- **Itens que passaram por QUASE_PRONTO**: 3
  - Chopp Pilsen 300ml (16:09 hoje)
  - Frango a Passarinho (15:41 hoje)
  - Batata Rústica (13:34 hoje)

### Docker
- ✅ Backend rodando sem erros
- ✅ Frontend compilando com sucesso
- ✅ Banco de dados saudável
- ✅ WebSocket ativo

---

## 🧪 Teste Passo a Passo

### FASE 1: Criar Novo Pedido

1. **Acesse**: http://localhost:3000/garcom/mapa-visual
2. **Login**: garçom ativo (pereira_hebert@msn.com)
3. **Selecione** uma mesa (ex: Mesa 1)
4. **Clique** "Novo Pedido"
5. **Adicione** 1 item: Chopp Pilsen 300ml
6. **Crie** o pedido

**Resultado Esperado**:
- ✅ Toast "Pedido criado com sucesso"
- ✅ Item com status FEITO

---

### FASE 2: Iniciar Preparo (Operacional)

1. **Acesse**: http://localhost:3000/dashboard/operacional/bar-principal
2. **Login**: admin ou operador bar
3. **Localize** o pedido na coluna "A Fazer"
4. **Clique** botão "Iniciar"

**Resultado Esperado**:
- ✅ Item move para coluna "Em Preparo"
- ✅ Badge **laranja** "EM_PREPARO"
- ✅ Campo `iniciado_em` preenchido no banco

**Como Verificar no Banco**:
```sql
docker exec pub_system_db psql -U postgres -d pub_system_db -c "SELECT id, status, iniciado_em FROM itens_pedido WHERE status = 'EM_PREPARO' ORDER BY id DESC LIMIT 1;"
```

---

### FASE 3: Aguardar QUASE_PRONTO (Automático)

**Opção A: Aguardar 4 minutos** (tempo fallback do scheduler)

**Opção B: Verificar job rodando**
```bash
docker logs pub_system_backend --tail 100 | grep "QuaseProntoScheduler"
```

**Resultado Esperado após job rodar**:
- ✅ Item **automaticamente** move para coluna "Quase Pronto"
- ✅ Badge **amarelo** "QUASE_PRONTO"
- ✅ Botão **laranja** "✅ Finalizar" aparece
- ✅ Campo `quase_pronto_em` preenchido

**Logs Esperados**:
```
[QuaseProntoScheduler] 🔍 Verificando itens para marcar como quase pronto...
✨ 1 itens marcados como QUASE_PRONTO
```

**Como Verificar**:
```sql
docker exec pub_system_db psql -U postgres -d pub_system_db -c "SELECT id, status, quase_pronto_em FROM itens_pedido WHERE status = 'QUASE_PRONTO' LIMIT 1;"
```

---

### FASE 4: Finalizar Item (Manual)

1. Na coluna "**Quase Pronto**", clique botão **"✅ Finalizar"**

**Resultado Esperado**:
- ✅ Item move para coluna "Pronto"
- ✅ Badge **verde** "PRONTO"
- ✅ Som **forte** toca (se garçom tiver página aberta)
- ✅ Botão "Retirar" aparece
- ✅ Campo `pronto_em` preenchido

---

### FASE 5: Retirar (Garçom)

1. **Login** como garçom com turno ativo
2. **Acesse**: http://localhost:3000/dashboard/gestaopedidos
3. **Clique** botão "Retirar" no item pronto

**Resultado Esperado**:
- ✅ Item move para coluna "Retirados"
- ✅ Badge **roxo** "RETIRADO"
- ✅ Botão "Entregar" aparece
- ✅ Campos preenchidos:
  - `retirado_em`
  - `retirado_por_garcom_id`
  - `tempo_reacao_minutos` (calculado)

---

### FASE 6: Entregar

1. **Clique** botão "Entregar"

**Resultado Esperado**:
- ✅ Badge **cinza** "ENTREGUE"
- ✅ Métricas aparecem no card
- ✅ Campos preenchidos:
  - `entregue_em`
  - `garcom_entrega_id`
  - `tempo_entrega_final_minutos`

---

## 📊 Checklist de Interfaces

### 1. Painéis Operacionais (Todos os ambientes)
**URL**: http://localhost:3000/dashboard/operacional/bar-principal

- [ ] 5 colunas visíveis
- [ ] Coluna "Quase Pronto" com fundo amarelo
- [ ] Itens QUASE_PRONTO aparecem
- [ ] Botão "Finalizar" laranja presente
- [ ] Clicar Finalizar → item vai para "Pronto"

### 2. Dashboard Gestão - Preparo (Kanban)
**URL**: http://localhost:3000/dashboard/gestaopedidos

- [ ] 4 colunas: Aguardando, Em Preparo, Quase Pronto, Prontos
- [ ] Grid responsivo (4 cols desktop)
- [ ] Coluna "Quase Pronto" amarela
- [ ] Cards QUASE_PRONTO com badge amarelo
- [ ] Botão "Finalizar" com CheckCircle2

### 3. Supervisão Admin (Métricas)
**URL**: http://localhost:3000/dashboard/gestaopedidos (rolarpara cima)

- [ ] 6 cards de métricas visíveis
- [ ] Card "Quase Pronto" com:
  - [ ] Ícone Clock ⏰
  - [ ] Número em amarelo
  - [ ] Borda amarela ao clicar
- [ ] Filtro select tem "Quase Pronto"
- [ ] Clicar card filtra apenas QUASE_PRONTO

### 4. Mapa Pedidos (Garçom)
**URL**: http://localhost:3000/dashboard/gestaopedidos (login garçom)

- [ ] 6 cards de métricas iguais ao admin
- [ ] Grid `md:grid-cols-3 lg:grid-cols-6`
- [ ] Card "Quase Pronto" amarelo
- [ ] Notificação sonora para QUASE_PRONTO

---

## 🐛 Testes de Erro

### Cenário 1: Sem Turno Ativo
1. Garçom sem turno ativo tenta retirar item
2. **Esperado**: Erro 403 "Nenhum turno ativo"

### Cenário 2: Item Já Retirado
1. Tentar retirar item com status RETIRADO
2. **Esperado**: Erro 409 "Item já foi retirado"

### Cenário 3: Item Não Pronto
1. Tentar retirar item EM_PREPARO ou QUASE_PRONTO
2. **Esperado**: Erro 400 "Item não está pronto"

---

## 📝 Queries Úteis

### Ver item específico
```sql
docker exec pub_system_db psql -U postgres -d pub_system_db -c "SELECT * FROM itens_pedido WHERE id = 'COLE_ID_AQUI';"
```

### Ver todos status
```sql
docker exec pub_system_db psql -U postgres -d pub_system_db -c "SELECT status, COUNT(*) FROM itens_pedido GROUP BY status;"
```

### Ver últimos 5 pedidos
```sql
docker exec pub_system_db psql -U postgres -d pub_system_db -c "SELECT ip.id, p.nome, ip.status, ip.quase_pronto_em FROM itens_pedido ip LEFT JOIN produtos p ON ip.\"produtoId\" = p.id ORDER BY ip.id DESC LIMIT 5;"
```

---

## ✅ Resumo das Implementações

### Backend
- ✅ Query inclui QUASE_PRONTO e RETIRADO
- ✅ Debug logs ativos
- ✅ QuaseProntoScheduler rodando

### Frontend (9 arquivos modificados)
1. ✅ OperacionalClientPage.tsx - 5 colunas
2. ✅ PedidoCard.tsx (operacional) - Botão Finalizar
3. ✅ PreparoPedidos.tsx - Kanban 4 colunas
4. ✅ SupervisaoPedidos.tsx - 6 cards
5. ✅ PedidoCard.tsx (cozinha) - Botão Finalizar
6. ✅ MapaPedidos.tsx - 6 cards garçom
7. ✅ Sidebar.tsx - Link atualizado
8. ✅ mapa-visual/page.tsx - Redirect correto
9. ❌ gestao-pedidos/page.tsx - REMOVIDO

### Git
- ✅ 5 commits na branch feature/fluxo-garcom-completo
- ✅ Pronto para merge

---

## 🎯 Próximos Passos

1. [ ] Executar teste manual completo (criar pedido novo)
2. [ ] Validar todas as 4 interfaces
3. [ ] Testar cenários de erro
4. [ ] Fazer merge para main
5. [ ] Deploy em staging
