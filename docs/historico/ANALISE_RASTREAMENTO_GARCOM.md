# 🔍 ANÁLISE COMPLETA: RASTREAMENTO DE GARÇOM E AMBIENTE

**Data:** 11/11/2025 19:16  
**Objetivo:** Verificar como o sistema rastreia garçom, ambiente e horários

---

## ✅ O QUE O SISTEMA JÁ RASTREIA

### 1. **Qual Garçom Pegou o Pedido** ✅

**Tabela:** `itens_pedido`  
**Campos:**
```sql
retirado_por_garcom_id    UUID       -- ID do garçom que retirou
retirado_em               TIMESTAMP  -- Quando retirou
tempo_reacao_minutos      INTEGER    -- Tempo entre PRONTO e RETIRADO
```

**Relação:**
```typescript
@ManyToOne(() => Funcionario)
@JoinColumn({ name: 'retirado_por_garcom_id' })
retiradoPorGarcom: Funcionario;
```

**Como funciona:**
- Garçom clica "Retirar" no item PRONTO
- Sistema registra `retiradoPorGarcomId` e `retiradoEm`
- Calcula `tempoReacaoMinutos` (PRONTO → RETIRADO)
- Valida se garçom tem turno ativo

**Código:** `pedido.service.ts` linhas 455-556

---

### 2. **Qual Garçom Entregou o Pedido** ✅

**Tabela:** `itens_pedido`  
**Campos:**
```sql
garcom_entrega_id              UUID       -- ID do garçom que entregou
entregue_em                    TIMESTAMP  -- Quando entregou
tempo_entrega_minutos          INTEGER    -- Tempo total (PRONTO → ENTREGUE)
tempo_entrega_final_minutos    INTEGER    -- Última milha (RETIRADO → ENTREGUE)
```

**Relação:**
```typescript
@ManyToOne(() => Funcionario)
@JoinColumn({ name: 'garcom_entrega_id' })
garcomEntrega: Funcionario;
```

**Como funciona:**
- Garçom clica "Entregar" no item RETIRADO
- Sistema registra `garcomEntregaId` e `entregueEm`
- Calcula 2 tempos:
  - `tempoEntregaMinutos`: PRONTO → ENTREGUE (tempo total)
  - `tempoEntregaFinalMinutos`: RETIRADO → ENTREGUE (última milha)

**Código:** `pedido.service.ts` linhas 561-645

---

### 3. **Qual Ambiente de Preparo** ✅

**Tabela:** `produtos`  
**Campo:**
```sql
ambiente_id    UUID    -- Ambiente onde o produto é preparado
```

**Relação:**
```typescript
@ManyToOne(() => Ambiente)
@JoinColumn({ name: 'ambiente_id' })
ambiente: Ambiente;
```

**Como funciona:**
- Cada produto pertence a um ambiente (Cozinha, Bar, etc)
- Quando item é criado, herda o ambiente do produto
- Sistema filtra pedidos por `produto.ambiente.id`

**Tipos de ambiente:**
```typescript
enum TipoAmbiente {
  PREPARO = 'PREPARO',        // Cozinha, Bar
  ATENDIMENTO = 'ATENDIMENTO' // Salão, Varanda
}
```

---

### 4. **Qual Ambiente de Retirada** ⚠️ PARCIAL

**Tabela:** `itens_pedido`  
**Campo:**
```sql
ambiente_retirada_id    UUID    -- Onde item foi deixado (se cliente não encontrado)
```

**Relação:**
```typescript
@ManyToOne(() => Ambiente)
@JoinColumn({ name: 'ambiente_retirada_id' })
ambienteRetirada: Ambiente;
```

**Status:** Implementado mas **NÃO usado no fluxo principal**

**Quando é usado:**
- Apenas quando garçom clica "Deixar no Ambiente" (cliente não encontrado)
- Não registra ambiente quando entrega normalmente

**Código:** `pedido.service.ts` linhas 389-450

---

### 5. **Horários Completos** ✅

**Tabela:** `itens_pedido`  
**Campos:**
```sql
iniciado_em         TIMESTAMP  -- Quando começou preparo
quase_pronto_em     TIMESTAMP  -- 70% do tempo médio (automático)
pronto_em           TIMESTAMP  -- Quando ficou pronto
retirado_em         TIMESTAMP  -- Quando garçom pegou
entregue_em         TIMESTAMP  -- Quando cliente recebeu
```

**Tempos calculados:**
```sql
tempo_preparo_minutos           -- iniciadoEm → prontoEm
tempo_reacao_minutos            -- prontoEm → retiradoEm
tempo_entrega_final_minutos     -- retiradoEm → entregueEm
tempo_entrega_minutos           -- prontoEm → entregueEm (total)
```

---

## ❌ O QUE ESTÁ FALTANDO

### 1. **Ambiente de Retirada no Fluxo Normal** ⚠️ CRÍTICO

**Problema:**
- Campo `ambiente_retirada_id` existe mas não é preenchido
- Só é usado quando cliente não é encontrado
- Não sabemos de qual ambiente o garçom retirou o pedido

**Impacto:**
- Não conseguimos saber se garçom pegou da Cozinha ou do Bar
- Relatórios de performance por ambiente ficam incompletos
- Não dá para calcular distância/tempo por ambiente

**Exemplo do problema:**
```
Pedido: 1x Hambúrguer (Cozinha) + 1x Cerveja (Bar)

Quando garçom clica "Retirar":
✅ Registra: retiradoPorGarcomId, retiradoEm
❌ NÃO registra: De qual ambiente pegou (Cozinha ou Bar?)
```

---

### 2. **Rastreamento de Múltiplos Ambientes** ⚠️ CRÍTICO

**Problema:**
- Um pedido pode ter itens de vários ambientes
- Garçom precisa ir em múltiplos locais
- Sistema não rastreia cada retirada separadamente

**Cenário real:**
```
Mesa 5 pediu:
- 2x Hambúrguer (Cozinha)
- 3x Cerveja (Bar)
- 1x Sobremesa (Cozinha)

Garçom precisa:
1. Ir na Cozinha pegar hambúrguer
2. Ir no Bar pegar cerveja
3. Voltar na Cozinha pegar sobremesa
4. Entregar tudo na Mesa 5

Sistema atual:
❌ Não rastreia cada ida
❌ Não sabe quantas viagens fez
❌ Não calcula tempo por ambiente
```

---

### 3. **Validação de Turno Ativo** ⚠️ MÉDIA

**Problema:**
- Sistema valida turno ao RETIRAR
- Mas não valida ao ENTREGAR

**Código atual:**
```typescript
// retirarItem() - TEM validação ✅
const turnoAtivo = await this.turnoRepository.findOne({
  where: { 
    funcionarioId: dto.garcomId,
    ativo: true,
    checkOut: null,
  },
});

if (!turnoAtivo) {
  throw new BadRequestException('Sem turno ativo');
}

// marcarComoEntregue() - NÃO TEM validação ❌
// Garçom pode entregar mesmo sem turno ativo!
```

---

### 4. **Histórico de Localização** ⚠️ BAIXA

**O que falta:**
- Não rastreia posição do garçom
- Não sabe qual mesa/ponto está atendendo
- Não calcula distância percorrida
- Não otimiza rotas

---

## 💡 SOLUÇÕES PROPOSTAS

### Solução 1: Registrar Ambiente na Retirada ⭐ RECOMENDADO

**Modificar:** `pedido.service.ts` método `retirarItem()`

**Adicionar:**
```typescript
async retirarItem(itemPedidoId: string, dto: RetirarItemDto): Promise<ItemPedido> {
  // ... código existente ...
  
  // ✅ NOVO: Buscar ambiente de preparo do produto
  const ambientePreparo = item.produto?.ambiente;
  
  if (ambientePreparo) {
    item.ambienteRetiradaId = ambientePreparo.id;
    item.ambienteRetirada = ambientePreparo;
  }
  
  // ... resto do código ...
}
```

**Benefícios:**
- ✅ Sabe de qual ambiente pegou
- ✅ Pode calcular performance por ambiente
- ✅ Pode otimizar rotas futuras
- ✅ Relatórios mais precisos

**Tempo:** 30 minutos

---

### Solução 2: Tabela de Retiradas Separada ⭐⭐ IDEAL

**Criar nova tabela:** `retiradas_itens`

```sql
CREATE TABLE retiradas_itens (
  id                  UUID PRIMARY KEY,
  item_pedido_id      UUID NOT NULL,
  garcom_id           UUID NOT NULL,
  ambiente_id         UUID NOT NULL,
  retirado_em         TIMESTAMP NOT NULL,
  tempo_reacao_min    INTEGER,
  observacao          TEXT,
  
  FOREIGN KEY (item_pedido_id) REFERENCES itens_pedido(id),
  FOREIGN KEY (garcom_id) REFERENCES funcionarios(id),
  FOREIGN KEY (ambiente_id) REFERENCES ambientes(id)
);
```

**Benefícios:**
- ✅ Histórico completo de retiradas
- ✅ Suporta múltiplas retiradas do mesmo item
- ✅ Rastreia cada ida ao ambiente
- ✅ Permite análise detalhada

**Desvantagens:**
- ⏳ Mais complexo (2-3 dias)
- ⏳ Precisa migration
- ⏳ Altera lógica existente

---

### Solução 3: Validar Turno na Entrega ⭐ SIMPLES

**Modificar:** `pedido.service.ts` método `marcarComoEntregue()`

**Adicionar:**
```typescript
async marcarComoEntregue(itemPedidoId: string, dto: MarcarEntregueDto): Promise<ItemPedido> {
  // ... código existente ...
  
  // ✅ NOVO: Validar turno ativo
  const turnoAtivo = await this.turnoRepository.findOne({
    where: { 
      funcionarioId: dto.garcomId,
      ativo: true,
      checkOut: null,
    },
  });

  if (!turnoAtivo) {
    throw new BadRequestException(
      `Garçom ${garcom.nome} não possui turno ativo.`
    );
  }
  
  // ... resto do código ...
}
```

**Benefícios:**
- ✅ Consistência nas validações
- ✅ Evita entregas sem turno
- ✅ Dados mais confiáveis

**Tempo:** 15 minutos

---

### Solução 4: Dashboard de Rastreamento ⭐⭐⭐ FUTURO

**Criar página:** `/dashboard/rastreamento`

**Funcionalidades:**
- Mapa de calor (quais ambientes mais visitados)
- Timeline de cada garçom
- Rotas percorridas
- Tempo médio por ambiente
- Gargalos identificados

**Tempo:** 3-5 dias

---

## 📊 COMPARAÇÃO DE SOLUÇÕES

| Solução | Complexidade | Tempo | Impacto | Prioridade |
|---------|--------------|-------|---------|------------|
| 1. Registrar ambiente na retirada | Baixa | 30min | Alto | ⭐⭐⭐ ALTA |
| 2. Tabela de retiradas | Alta | 2-3 dias | Muito Alto | ⭐⭐ MÉDIA |
| 3. Validar turno na entrega | Baixa | 15min | Médio | ⭐⭐ MÉDIA |
| 4. Dashboard rastreamento | Muito Alta | 3-5 dias | Alto | ⭐ BAIXA |

---

## 🎯 RECOMENDAÇÃO FINAL

### Para Implementar AGORA (45 minutos):

1. **Solução 1** - Registrar ambiente na retirada (30min)
2. **Solução 3** - Validar turno na entrega (15min)

**Resultado:**
- ✅ Sistema rastreia ambiente de retirada
- ✅ Validações consistentes
- ✅ Dados completos para relatórios
- ✅ Sem quebrar código existente

### Para Implementar DEPOIS:

3. **Solução 2** - Tabela de retiradas (quando precisar histórico detalhado)
4. **Solução 4** - Dashboard (quando tiver dados suficientes)

---

## 📝 EXEMPLO DE DADOS APÓS CORREÇÃO

### Antes (Atual):
```json
{
  "id": "abc-123",
  "produto": { "nome": "Hambúrguer", "ambiente": { "nome": "Cozinha" } },
  "status": "ENTREGUE",
  "retiradoPorGarcomId": "garcom-1",
  "retiradoEm": "2025-11-11T19:00:00Z",
  "ambienteRetiradaId": null,  // ❌ VAZIO!
  "garcomEntregaId": "garcom-1",
  "entregueEm": "2025-11-11T19:05:00Z"
}
```

### Depois (Corrigido):
```json
{
  "id": "abc-123",
  "produto": { "nome": "Hambúrguer", "ambiente": { "nome": "Cozinha" } },
  "status": "ENTREGUE",
  "retiradoPorGarcomId": "garcom-1",
  "retiradoEm": "2025-11-11T19:00:00Z",
  "ambienteRetiradaId": "ambiente-cozinha",  // ✅ PREENCHIDO!
  "ambienteRetirada": { "nome": "Cozinha", "tipo": "PREPARO" },
  "garcomEntregaId": "garcom-1",
  "entregueEm": "2025-11-11T19:05:00Z",
  "tempoReacaoMinutos": 2,
  "tempoEntregaFinalMinutos": 5
}
```

---

## ✅ CONCLUSÃO

**O sistema JÁ rastreia:**
- ✅ Qual garçom retirou
- ✅ Qual garçom entregou
- ✅ Todos os horários
- ✅ Tempos calculados
- ✅ Ambiente de preparo (via produto)

**O que FALTA:**
- ❌ Registrar ambiente na retirada normal
- ❌ Validar turno na entrega
- ❌ Histórico de múltiplas retiradas

**Implementando as Soluções 1 e 3, o sistema fica 100% completo para rastreamento!**
