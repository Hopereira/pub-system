# 🔄 Fluxo de Invalidação Automática de Cache

**Sprint:** 2-2  
**Data:** 17 de Dezembro de 2025  
**Status:** ✅ Implementado e Documentado

---

## 📋 Visão Geral

Este documento descreve o fluxo completo de invalidação automática de cache implementado na Sprint 2-2, incluindo exemplos práticos, logs esperados e mapa de dependências.

---

## 🔄 Fluxo Completo: CREATE Produto

### **1. Request do Cliente**
```http
POST /produtos HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "nome": "Cerveja IPA Artesanal",
  "descricao": "Cerveja artesanal com lúpulo americano",
  "preco": 15.00,
  "ambienteId": "abc123-def456-ghi789",
  "ativo": true
}
```

### **2. Backend: ProdutoService**
```typescript
async create(createProdutoDto: CreateProdutoDto): Promise<Produto> {
  // 1. Validar dados
  const { ambienteId, ...restoDoDto } = createProdutoDto;
  
  // 2. Buscar ambiente
  const ambiente = await this.ambienteRepository.findOne({
    where: { id: ambienteId },
  });
  
  // 3. Criar produto
  const produto = this.produtoRepository.create({
    ...restoDoDto,
    ambiente,
  });
  
  // 4. Salvar no banco de dados
  const savedProduto = await this.produtoRepository.save(produto);
  
  // 5. ✨ INVALIDAR CACHE AUTOMATICAMENTE ✨
  await this.cacheInvalidationService.invalidateProdutos();
  
  // 6. Retornar produto criado
  return savedProduto;
}
```

### **3. CacheInvalidationService**
```typescript
async invalidateProdutos(): Promise<void> {
  this.logger.log('🔄 Invalidando cache de produtos...');
  await this.invalidatePattern('produtos:*');
}

async invalidatePattern(pattern: string): Promise<number> {
  const store = this.cacheManager.store as any;
  
  // Buscar todas as chaves que correspondem ao padrão
  const keys = await store.keys(pattern);
  // Resultado: ['produtos:page:1:limit:20:sort:nome:ASC', 
  //             'produtos:page:2:limit:20:sort:nome:ASC',
  //             'produtos:page:1:limit:5:sort:preco:DESC']
  
  // Deletar cada chave
  let deletedCount = 0;
  for (const key of keys) {
    await this.cacheManager.del(key);
    this.logger.debug(`🗑️ Cache invalidado: ${key}`);
    deletedCount++;
  }
  
  this.logger.log(`✅ Total de chaves invalidadas (${pattern}): ${deletedCount}`);
  return deletedCount;
}
```

### **4. Redis: Operações**
```bash
# Antes da invalidação
127.0.0.1:6379> KEYS produtos:*
1) "produtos:page:1:limit:20:sort:nome:ASC"
2) "produtos:page:2:limit:20:sort:nome:ASC"
3) "produtos:page:1:limit:5:sort:preco:DESC"

# Invalidação
127.0.0.1:6379> DEL "produtos:page:1:limit:20:sort:nome:ASC"
(integer) 1
127.0.0.1:6379> DEL "produtos:page:2:limit:20:sort:nome:ASC"
(integer) 1
127.0.0.1:6379> DEL "produtos:page:1:limit:5:sort:preco:DESC"
(integer) 1

# Depois da invalidação
127.0.0.1:6379> KEYS produtos:*
(empty array)
```

### **5. Logs do Backend**
```
[Nest] 51  - 12/18/2025, 01:15:23 AM     LOG [ProdutoService] Criando produto: Cerveja IPA Artesanal
[Nest] 51  - 12/18/2025, 01:15:23 AM     LOG [CacheInvalidationService] 🔄 Invalidando cache de produtos...
[Nest] 51  - 12/18/2025, 01:15:23 AM   DEBUG [CacheInvalidationService] 🗑️ Cache invalidado: produtos:page:1:limit:20:sort:nome:ASC
[Nest] 51  - 12/18/2025, 01:15:23 AM   DEBUG [CacheInvalidationService] 🗑️ Cache invalidado: produtos:page:2:limit:20:sort:nome:ASC
[Nest] 51  - 12/18/2025, 01:15:23 AM   DEBUG [CacheInvalidationService] 🗑️ Cache invalidado: produtos:page:1:limit:5:sort:preco:DESC
[Nest] 51  - 12/18/2025, 01:15:23 AM     LOG [CacheInvalidationService] ✅ Total de chaves invalidadas (produtos:*): 3
[Nest] 51  - 12/18/2025, 01:15:23 AM     LOG [ProdutoService] ✅ Produto criado com sucesso: Cerveja IPA Artesanal
```

### **6. Próxima Consulta**
```http
GET /produtos?page=1&limit=20 HTTP/1.1
```

**Fluxo:**
```
1. ProdutoService.findAll()
   ├─ Verificar cache: produtos:page:1:limit:20:sort:nome:ASC
   ├─ Cache MISS (chave foi deletada!)
   ├─ Buscar do banco de dados (com produto novo!)
   ├─ Salvar no cache novamente
   └─ Retornar dados atualizados
```

**Logs:**
```
[Nest] 51  - 12/18/2025, 01:15:30 AM   DEBUG [ProdutoService] ❌ Cache MISS: produtos:page:1:limit:20:sort:nome:ASC
[Nest] 51  - 12/18/2025, 01:15:30 AM     LOG [ProdutoService] 📋 Listando produtos | Página: 1/2 | Total: 38
```

---

## 🔗 Fluxo de Invalidação em Cascata: FECHAR Comanda

### **1. Request do Cliente**
```http
POST /comandas/abc123-def456/fechar HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "formaPagamento": "DINHEIRO",
  "valorPago": 100.00
}
```

### **2. Backend: ComandaService**
```typescript
async fecharComanda(id: string, dto: FecharComandaDto): Promise<Comanda> {
  // 1. Buscar comanda
  const comanda = await this.comandaRepository.findOne({
    where: { id },
    relations: ['mesa', 'pedidos'],
  });
  
  // 2. Validar e calcular total
  const total = calcularTotal(comanda.pedidos);
  
  // 3. Registrar venda no caixa
  await this.caixaService.registrarVenda({...});
  
  // 4. Fechar comanda
  comanda.status = ComandaStatus.FECHADA;
  
  // 5. Liberar mesa
  if (comanda.mesa) {
    comanda.mesa.status = MesaStatus.LIVRE;
    await this.mesaRepository.save(comanda.mesa);
  }
  
  // 6. Salvar comanda
  const comandaFechada = await this.comandaRepository.save(comanda);
  
  // 7. ✨ INVALIDAR CACHE EM CASCATA ✨
  await this.cacheInvalidationService.invalidateComandas();
  // Isso invalida COMANDAS + MESAS automaticamente!
  
  // 8. Emitir evento WebSocket
  this.pedidosGateway.emitComandaAtualizada(comandaFechada);
  
  return comandaFechada;
}
```

### **3. CacheInvalidationService (Cascata)**
```typescript
async invalidateComandas(): Promise<void> {
  this.logger.log('🔄 Invalidando cache de comandas e mesas...');
  
  // Invalidar comandas
  await this.invalidatePattern('comandas:*');
  
  // Invalidar mesas (CASCATA!)
  await this.invalidatePattern('mesas:*');
  
  // Motivo: Status da mesa depende da comanda
  // - Comanda ABERTA → Mesa OCUPADA
  // - Comanda FECHADA → Mesa LIVRE
}
```

### **4. Redis: Operações em Cascata**
```bash
# Antes da invalidação
127.0.0.1:6379> KEYS comandas:*
1) "comandas:page:1:limit:20:sort:criadoEm:DESC"

127.0.0.1:6379> KEYS mesas:*
1) "mesas:all"

# Invalidação (CASCATA!)
127.0.0.1:6379> DEL "comandas:page:1:limit:20:sort:criadoEm:DESC"
(integer) 1
127.0.0.1:6379> DEL "mesas:all"
(integer) 1

# Depois da invalidação
127.0.0.1:6379> KEYS comandas:*
(empty array)
127.0.0.1:6379> KEYS mesas:*
(empty array)
```

### **5. Logs do Backend (Cascata)**
```
[Nest] 51  - 12/18/2025, 01:20:15 AM     LOG [ComandaService] 🔒 Iniciando fechamento da comanda abc123-def456
[Nest] 51  - 12/18/2025, 01:20:15 AM     LOG [ComandaService] 💰 Total da comanda: R$ 85.50
[Nest] 51  - 12/18/2025, 01:20:15 AM     LOG [CaixaService] ✅ Venda registrada no caixa
[Nest] 51  - 12/18/2025, 01:20:15 AM     LOG [ComandaService] 🪑 Mesa 5 liberada
[Nest] 51  - 12/18/2025, 01:20:15 AM     LOG [CacheInvalidationService] 🔄 Invalidando cache de comandas e mesas...
[Nest] 51  - 12/18/2025, 01:20:15 AM   DEBUG [CacheInvalidationService] 🗑️ Cache invalidado: comandas:page:1:limit:20:sort:criadoEm:DESC
[Nest] 51  - 12/18/2025, 01:20:15 AM     LOG [CacheInvalidationService] ✅ Total de chaves invalidadas (comandas:*): 1
[Nest] 51  - 12/18/2025, 01:20:15 AM   DEBUG [CacheInvalidationService] 🗑️ Cache invalidado: mesas:all
[Nest] 51  - 12/18/2025, 01:20:15 AM     LOG [CacheInvalidationService] ✅ Total de chaves invalidadas (mesas:*): 1
[Nest] 51  - 12/18/2025, 01:20:15 AM     LOG [ComandaService] ✅ Comanda abc123-def456 fechada com sucesso
```

### **6. Resultado**
```
Próxima consulta GET /mesas:
├─ Cache MISS (chave foi deletada)
├─ Busca do banco de dados
├─ Mesa 5 agora está LIVRE (antes estava OCUPADA)
└─ Dados atualizados retornados
```

---

## 🗺️ Mapa Completo de Invalidação

### **Invalidação Direta**

```
┌─────────────────────────────────────────────────────────────┐
│                    INVALIDAÇÃO DIRETA                       │
└─────────────────────────────────────────────────────────────┘

1. PRODUTOS
   Operações: create, update, remove
   Invalida: produtos:*
   
   Código:
   await this.cacheInvalidationService.invalidateProdutos();

2. PEDIDOS
   Operações: create, updateItemStatus
   Invalida: pedidos:*
   
   Código:
   await this.cacheInvalidationService.invalidatePedidos();

3. MESAS
   Operações: create, update, remove
   Invalida: mesas:*
   
   Código:
   await this.cacheInvalidationService.invalidateMesas();
```

### **Invalidação em Cascata**

```
┌─────────────────────────────────────────────────────────────┐
│                  INVALIDAÇÃO EM CASCATA                     │
└─────────────────────────────────────────────────────────────┘

1. COMANDAS → MESAS
   Operações: create, update, fecharComanda
   Invalida: comandas:* + mesas:*
   
   Motivo: Status da mesa depende da comanda
   - Comanda ABERTA → Mesa OCUPADA
   - Comanda FECHADA → Mesa LIVRE
   
   Código:
   await this.cacheInvalidationService.invalidateComandas();
   // Invalida comandas:* E mesas:* automaticamente

2. AMBIENTES → PRODUTOS
   Operações: create, update, remove
   Invalida: ambientes:* + produtos:*
   
   Motivo: Produtos exibem informações do ambiente
   - Listagem de produtos inclui nome do ambiente
   - Alterar ambiente afeta exibição de produtos
   
   Código:
   await this.cacheInvalidationService.invalidateAmbientes();
   // Invalida ambientes:* E produtos:* automaticamente
```

### **Diagrama de Dependências**

```
                    ┌─────────────┐
                    │  AMBIENTES  │
                    └──────┬──────┘
                           │
                           │ (afeta)
                           ▼
                    ┌─────────────┐
                    │  PRODUTOS   │
                    └─────────────┘


                    ┌─────────────┐
                    │  COMANDAS   │
                    └──────┬──────┘
                           │
                ┌──────────┴──────────┐
                │                     │
           (afeta)                (afeta)
                │                     │
                ▼                     ▼
         ┌─────────────┐       ┌─────────────┐
         │    MESAS    │       │   PEDIDOS   │
         └─────────────┘       └─────────────┘
```

---

## 📊 Tabela de Operações e Invalidações

| Operação | Endpoint | Invalida Diretamente | Invalida em Cascata | Total |
|----------|----------|---------------------|---------------------|-------|
| **Criar Produto** | `POST /produtos` | `produtos:*` | - | 1 padrão |
| **Atualizar Produto** | `PATCH /produtos/:id` | `produtos:*` | - | 1 padrão |
| **Deletar Produto** | `DELETE /produtos/:id` | `produtos:*` | - | 1 padrão |
| **Criar Comanda** | `POST /comandas` | `comandas:*` | `mesas:*` | 2 padrões |
| **Atualizar Comanda** | `PATCH /comandas/:id` | `comandas:*` | `mesas:*` | 2 padrões |
| **Fechar Comanda** | `POST /comandas/:id/fechar` | `comandas:*` | `mesas:*` | 2 padrões |
| **Criar Pedido** | `POST /pedidos` | `pedidos:*` | - | 1 padrão |
| **Atualizar Status Item** | `PATCH /pedidos/item/:id/status` | `pedidos:*` | - | 1 padrão |
| **Criar Ambiente** | `POST /ambientes` | `ambientes:*` | `produtos:*` | 2 padrões |
| **Atualizar Ambiente** | `PATCH /ambientes/:id` | `ambientes:*` | `produtos:*` | 2 padrões |
| **Deletar Ambiente** | `DELETE /ambientes/:id` | `ambientes:*` | `produtos:*` | 2 padrões |
| **Criar Mesa** | `POST /mesas` | `mesas:*` | - | 1 padrão |
| **Atualizar Mesa** | `PATCH /mesas/:id` | `mesas:*` | - | 1 padrão |
| **Deletar Mesa** | `DELETE /mesas/:id` | `mesas:*` | - | 1 padrão |

---

## 🧪 Como Testar em Produção

### **1. Preparação**
```powershell
# Abrir terminal para monitorar logs
docker-compose logs backend -f | Select-String "CacheInvalidation|Invalidando|invalidado"
```

### **2. Obter Token de Autenticação**
```powershell
$loginBody = @{
    email = "admin@pub.com"
    senha = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/auth/login" `
    -Method POST `
    -Body $loginBody `
    -ContentType "application/json"

$token = $response.access_token
```

### **3. Criar Produto (Testar Invalidação)**
```powershell
$produtoBody = @{
    nome = "Cerveja Teste Cache"
    descricao = "Teste de invalidação de cache"
    preco = 12.50
    ambienteId = "ID_DO_AMBIENTE_AQUI"
    ativo = $true
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:3000/produtos" `
    -Method POST `
    -Headers $headers `
    -Body $produtoBody
```

### **4. Verificar Logs**
```
Logs esperados:
[CacheInvalidationService] 🔄 Invalidando cache de produtos...
[CacheInvalidationService] 🗑️ Cache invalidado: produtos:page:1:limit:20:sort:nome:ASC
[CacheInvalidationService] ✅ Total de chaves invalidadas (produtos:*): X
```

### **5. Validar Invalidação**
```powershell
# Consultar produtos novamente
curl "http://localhost:3000/produtos?page=1&limit=20"

# Verificar logs - deve mostrar Cache MISS
# [ProdutoService] ❌ Cache MISS: produtos:page:1:limit:20:sort:nome:ASC
```

---

## ✅ Checklist de Validação

- [ ] Logs de invalidação aparecem ao criar produto
- [ ] Logs de invalidação aparecem ao atualizar produto
- [ ] Logs de invalidação aparecem ao deletar produto
- [ ] Logs de invalidação em cascata (comandas → mesas)
- [ ] Logs de invalidação em cascata (ambientes → produtos)
- [ ] Cache é recriado após invalidação (Cache MISS)
- [ ] Dados atualizados aparecem na próxima consulta
- [ ] Performance mantida (Cache HIT após recriação)

---

## 📚 Documentação Relacionada

- [Sprint 2-2: Implementação](./2025-12-17-SPRINT-2-2-IMPLEMENTACAO.md)
- [Sprint 2-2: Planejamento](./2025-12-17-SPRINT-2-2-PLANEJAMENTO.md)
- [Relatório de Validação de Cache](../RELATORIO-VALIDACAO-CACHE-SPRINT-2-2.md)

---

**Documento criado em:** 18 de Dezembro de 2025  
**Última atualização:** 18 de Dezembro de 2025  
**Status:** ✅ Completo e Validado
