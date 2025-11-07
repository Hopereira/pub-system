# 🧪 Guia de Teste - Fluxo Completo do Garçom

## Pré-requisitos

### 1. Verificar se Docker está rodando
```powershell
docker ps
```

### 2. Subir o ambiente completo
```powershell
# Na raiz do projeto
docker-compose up -d
```

Aguarde ~30 segundos para tudo inicializar.

---

## 🔧 Passo 1: Aplicar Migration

```powershell
# Entrar no container do backend
docker exec -it pub-system-backend-1 sh

# Dentro do container, rodar migration
npm run migration:run

# Sair do container
exit
```

**Verificação:** Deve aparecer mensagem `Migration AddFluxoGarcomCompleto1730990000000 has been executed successfully.`

---

## 👤 Passo 2: Preparar Usuário Garçom

### Opção A: Usar garçom existente (se já tiver)
1. Acesse http://localhost:3000/login
2. Login com credenciais de GARÇOM

### Opção B: Criar novo garçom
1. Acesse http://localhost:3000/login
2. Login como ADMIN (verificar credenciais no seeder)
3. Ir em **Funcionários** → **Novo Funcionário**
4. Preencher:
   - Nome: `João da Silva`
   - Email: `joao.garcom@pub.com`
   - Senha: `senha123`
   - Cargo: **GARÇOM**
   - Estabelecimento: (selecionar)
5. Salvar

**Anotar:** Email e senha do garçom para próximos passos

---

## 🎯 Passo 3: Fazer Check-In (Ativar Turno)

> **IMPORTANTE:** O garçom SÓ pode retirar pedidos se tiver turno ativo!

1. **Logout** do admin (se estiver logado)
2. **Login** como garçom (`joao.garcom@pub.com`)
3. Ir para `/garcom` (página inicial do garçom)
4. Procurar card **"Check-In"**
5. Clicar em **"Fazer Check-In"**

**Verificação:** 
- Card muda para "Turno Ativo" com timer
- Botão "Check-Out" aparece

---

## 🍔 Passo 4: Criar Pedido de Teste

### Opção A: Via Interface do Garçom
1. Na página `/garcom`, clicar **"Novo Pedido"**
2. Ou ir direto: http://localhost:3000/garcom/novo-pedido
3. Preencher:
   - **Mesa:** Selecionar uma mesa disponível (ex: Mesa 5)
   - **Produtos:** Adicionar 2-3 itens (ex: Hambúrguer, Batata Frita, Refrigerante)
   - Quantidade de cada
4. Clicar **"Criar Pedido"**

### Opção B: Via API (Thunder Client / Postman)
```http
POST http://localhost:3001/pedidos/garcom
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json

{
  "mesaId": "UUID_DA_MESA",
  "itens": [
    {
      "produtoId": "UUID_PRODUTO_1",
      "quantidade": 2,
      "observacao": "Sem cebola"
    },
    {
      "produtoId": "UUID_PRODUTO_2",
      "quantidade": 1
    }
  ]
}
```

**Verificação:**
- Toast de sucesso aparece
- Pedido criado com status `FEITO`

**Anotar:** ID do pedido para rastreamento

---

## 🍳 Passo 5: Marcar Item como EM_PREPARO (Cozinha)

> Simula a cozinha iniciando o preparo

### Via Interface Operacional
1. **Logout** do garçom
2. **Login** como ADMIN ou COZINHA
3. Ir para `/dashboard/operacional/cozinha` (ou similar)
4. Encontrar o pedido criado
5. Clicar em **"Iniciar Preparo"** para cada item

### Via API Direta (Mais Rápido)
```http
PATCH http://localhost:3001/pedidos/item/STATUS
Authorization: Bearer TOKEN_ADMIN
Content-Type: application/json

{
  "status": "EM_PREPARO"
}
```

Substituir `STATUS` pelo ID de cada item do pedido.

**Verificação:**
- Status do item muda para `EM_PREPARO`
- Campo `iniciadoEm` é preenchido com timestamp atual

---

## ⏳ Passo 6: Aguardar Job QUASE_PRONTO (15-30 segundos)

> O job roda automaticamente a cada 15 segundos

### O que acontece:
1. Job `QuaseProntoScheduler` verifica itens `EM_PREPARO`
2. Calcula se já atingiu 70% do tempo médio
3. Como é produto novo (sem histórico), usa fallback: 80% de 5min = 4min
4. Se passou 4min → marca `QUASE_PRONTO`
5. Emite evento WebSocket `item_quase_pronto`

### Acelerar para Teste (Opcional)
Se não quiser esperar 4 minutos, **temporariamente** edite o arquivo:

```typescript
// backend/src/modulos/pedido/quase-pronto.scheduler.ts
// Linha ~30
private readonly TEMPO_FALLBACK_MINUTOS = 0.5; // 30 segundos ao invés de 5 min
```

Reinicie o backend:
```powershell
docker-compose restart backend
```

### Monitorar Logs
```powershell
docker logs -f pub-system-backend-1
```

Procurar por:
```
✨ X itens marcados como QUASE_PRONTO
⏳ Item quase pronto | Produto: Hambúrguer | ETA: 30s
```

**Verificação:**
- Status muda para `QUASE_PRONTO`
- Campo `quaseProntoEm` preenchido
- **Som leve** toca no frontend (se garçom estiver com página aberta)

---

## 🟢 Passo 7: Marcar Item como PRONTO (Cozinha Finaliza)

### Via Interface
1. Na tela da cozinha, clicar **"Marcar Pronto"** no item
2. Ou atualizar status para `PRONTO`

### Via API
```http
PATCH http://localhost:3001/pedidos/item/ITEM_ID/status
Authorization: Bearer TOKEN_COZINHA
Content-Type: application/json

{
  "status": "PRONTO"
}
```

**Verificação:**
- Status muda para `PRONTO`
- Campo `prontoEm` preenchido
- **Som FORTE** toca no frontend do garçom 🔊
- Toast aparece: "Item Pronto!"
- Evento `item_pronto` emitido via WebSocket

---

## 🎯 Passo 8: RETIRAR Item (Garçom Pega no Ambiente)

> **AÇÃO PRINCIPAL DO FLUXO NOVO**

1. **Login** como garçom (se não estiver)
2. Ir para `/garcom` ou `/garcom/gestao-pedidos`
3. Na coluna **"Prontos"**, encontrar o item
4. Clicar no botão **"Retirar"** (verde, ícone Package)

### O que acontece no backend:
1. Valida se item está `PRONTO` ✅
2. Verifica se garçom tem turno ativo ✅
3. Marca status como `RETIRADO`
4. Preenche `retiradoEm` com timestamp
5. Preenche `retiradoPorGarcomId` com ID do garçom
6. **Calcula `tempoReacaoMinutos`** = `retiradoEm - prontoEm`
7. Emite evento `item_retirado` via WebSocket

**Verificação:**
- Item move para coluna **"Retirados"**
- Badge muda para "Retirado" (roxo)
- Botão "Retirar" desaparece
- Botão **"Entregar"** (azul) aparece
- Toast: "Item retirado com sucesso"
- Logs backend:
  ```
  🎯 Item retirado | Produto: Hambúrguer | Garçom: João Silva | Tempo reação: 2 min
  ```

---

## 🚚 Passo 9: ENTREGAR Item (Garçom Entrega ao Cliente)

1. Na mesma tela, encontrar item na coluna **"Retirados"**
2. Clicar no botão **"Entregar"** (azul, ícone Truck)

### O que acontece:
1. Marca status como `ENTREGUE`
2. Preenche `entregueEm` com timestamp
3. Confirma `garcomEntregaId`
4. **Calcula `tempoEntregaFinalMinutos`** = `entregueEm - retiradoEm`
5. Emite evento `item_entregue`

**Verificação:**
- Item move para coluna **"Entregues"** (ou desaparece)
- Badge muda para "Entregue" (cinza)
- **Métricas aparecem no card:**
  ```
  Preparo: 5min | Reação: 2min | Entrega: 3min
  ```
- Toast: "Item entregue com sucesso"

---

## 📊 Passo 10: Verificar Métricas no Banco

### Via pgAdmin
1. Acesse http://localhost:5050
2. Login: `admin@admin.com` / `admin`
3. Conectar ao servidor PostgreSQL
4. Executar query:

```sql
SELECT 
  ip.id,
  p.nome as produto,
  ip.status,
  ip.iniciado_em,
  ip.quase_pronto_em,
  ip.pronto_em,
  ip.retirado_em,
  ip.entregue_em,
  ip.tempo_preparo_minutos,
  ip.tempo_reacao_minutos,
  ip.tempo_entrega_final_minutos,
  f_retirou.nome as garcom_retirou,
  f_entregou.nome as garcom_entregou
FROM itens_pedido ip
LEFT JOIN produtos p ON ip."produtoId" = p.id
LEFT JOIN usuarios f_retirou ON ip.retirado_por_garcom_id = f_retirou.id
LEFT JOIN usuarios f_entregou ON ip.garcom_entrega_id = f_entregou.id
WHERE ip.status IN ('QUASE_PRONTO', 'PRONTO', 'RETIRADO', 'ENTREGUE')
ORDER BY ip.pronto_em DESC
LIMIT 10;
```

**Deve mostrar:**
- Todos os timestamps preenchidos
- Tempos calculados corretamente
- Nomes dos garçons

---

## 🔊 Passo 11: Testar Sons e Mute

### Testar Sons
1. Na página do garçom, abrir console do navegador (F12)
2. Digitar:
```javascript
// Importar hook (se disponível globalmente, ou testar via UI)
// Quando evento chegar, som toca automaticamente
```

### Testar Mute Temporário
1. Na página do garçom, procurar botão **"Silenciar 5 min"** (ícone 🔇)
2. Clicar
3. Criar novo pedido e marcar pronto
4. **Som NÃO deve tocar**
5. Após 5 minutos, som volta automaticamente

### Testar Toggle Manual
1. Clicar no ícone de som (🔊/🔇)
2. Alterna entre ligado/desligado imediatamente

---

## 🌐 Passo 12: Testar WebSocket em Tempo Real

### Preparação
1. Abrir **2 abas** do navegador:
   - Aba 1: Login como GARÇOM → `/garcom`
   - Aba 2: Login como ADMIN/COZINHA → `/dashboard/operacional`

### Teste de Eventos
1. Na **Aba 2** (admin), marcar item como `PRONTO`
2. Na **Aba 1** (garçom), verificar:
   - Toast aparece instantaneamente
   - Som forte toca
   - Card do item atualiza status
   - Badge fica verde "Pronto"

3. Na **Aba 1** (garçom), clicar **"Retirar"**
4. Na **Aba 2** (admin), verificar:
   - Status atualiza em tempo real
   - Dashboard mostra item retirado

---

## ⚠️ Passo 13: Testar Validações de Erro

### 13.1: Tentar Retirar sem Turno Ativo
1. Fazer **Check-Out** (finalizar turno)
2. Tentar clicar **"Retirar"** em item PRONTO
3. **Deve retornar erro 403:** "Garçom não possui turno ativo"

### 13.2: Tentar Retirar Item Já Retirado
1. Retirar item normalmente
2. Via API, tentar retirar novamente:
```http
PATCH http://localhost:3001/pedidos/item/ITEM_ID/retirar
```
3. **Deve retornar erro 409:** "Item já foi retirado"

### 13.3: Tentar Retirar Item EM_PREPARO
1. Tentar retirar item que ainda está em preparo
2. **Deve retornar erro 400:** "Apenas itens com status PRONTO podem ser retirados"

---

## 📈 Passo 14: Verificar Analytics (Futuro)

> Ainda não implementado, mas já coleta dados

### Dados Disponíveis
Query para calcular métricas manualmente:

```sql
-- Tempo médio de reação por garçom (últimos 7 dias)
SELECT 
  u.nome as garcom,
  COUNT(*) as total_retiradas,
  ROUND(AVG(ip.tempo_reacao_minutos), 2) as tempo_reacao_medio,
  ROUND(AVG(ip.tempo_entrega_final_minutos), 2) as tempo_entrega_medio,
  ROUND(
    (COUNT(*) FILTER (WHERE ip.tempo_reacao_minutos <= 2)::numeric / COUNT(*)::numeric) * 100, 
    2
  ) as percentual_sla
FROM itens_pedido ip
JOIN usuarios u ON ip.retirado_por_garcom_id = u.id
WHERE ip.retirado_em >= NOW() - INTERVAL '7 days'
  AND ip.tempo_reacao_minutos IS NOT NULL
GROUP BY u.id, u.nome
ORDER BY tempo_reacao_medio ASC;
```

---

## 🐛 Troubleshooting

### Som não toca
- Verificar permissões do navegador (Allow Audio)
- Abrir console e procurar erros `AudioContext`
- Tentar clicar na página primeiro (alguns browsers bloqueiam autoplay)

### Job não marca QUASE_PRONTO
- Verificar logs: `docker logs -f pub-system-backend-1`
- Confirmar que `ScheduleModule` foi importado no `app.module.ts`
- Reiniciar backend: `docker-compose restart backend`

### Erro "Turno não ativo"
- Fazer check-in novamente
- Verificar na tabela `turnos_funcionario` se `ativo = true` e `checkOut IS NULL`

### WebSocket não atualiza
- Verificar conexão: console do navegador deve mostrar `Socket connected`
- Backend logs deve mostrar eventos sendo emitidos
- Porta 3001 deve estar acessível

### Migration não roda
- Verificar se está na branch correta: `git branch`
- Confirmar arquivo existe: `ls backend/src/database/migrations/`
- Rodar com output verbose: `npm run migration:run -- -v`

---

## ✅ Checklist de Validação Final

- [ ] Migration aplicada com sucesso
- [ ] Garçom consegue fazer check-in
- [ ] Pedido criado via interface do garçom
- [ ] Item marcado EM_PREPARO
- [ ] Job marca QUASE_PRONTO (aguardar ou acelerar)
- [ ] Item marcado PRONTO
- [ ] Som forte toca no frontend
- [ ] Botão "Retirar" aparece
- [ ] Clicar "Retirar" funciona (valida turno)
- [ ] Status muda para RETIRADO
- [ ] Botão "Entregar" aparece
- [ ] Clicar "Entregar" funciona
- [ ] Status muda para ENTREGUE
- [ ] Métricas (preparo, reação, entrega) aparecem
- [ ] Banco tem todos os timestamps e tempos calculados
- [ ] Eventos WebSocket chegam em tempo real
- [ ] Validações de erro funcionam (sem turno, já retirado)

---

## 🎯 Cenário de Teste Completo (Resumo)

**Tempo estimado:** 10-15 minutos (ou 2 minutos se acelerar o job)

1. ✅ Aplicar migration
2. ✅ Criar/logar garçom
3. ✅ Fazer check-in (turno ativo)
4. ✅ Criar pedido (2-3 itens)
5. ✅ Marcar EM_PREPARO
6. ⏳ Aguardar job → QUASE_PRONTO (ou acelerar)
7. ✅ Marcar PRONTO → 🔊 som forte
8. ✅ Clicar "Retirar" → RETIRADO
9. ✅ Clicar "Entregar" → ENTREGUE
10. 📊 Verificar métricas no banco

**Resultado esperado:** Fluxo completo funciona end-to-end, com todos os timestamps, métricas e eventos corretos! 🎉

---

## 📞 Próximo Passo

Após validar tudo funcionando:
1. Fazer merge da branch `feature/fluxo-garcom-completo` → `main`
2. Implementar Fase 3: Integração UI garçom (usar `ItemPedidoCard`, escutar eventos)
3. Implementar Fase 4: Analytics e Dashboard gestão

**Dúvidas ou erros?** Verificar logs detalhados e consultar `IMPLEMENTACAO_FLUXO_GARCOM.md`
