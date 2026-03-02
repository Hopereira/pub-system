# 🔄 Auditoria de Tipos - Frontend vs Backend

**Data:** 11/12/2024  
**Branch:** `audit/tipos-frontend-backend`  
**Auditor:** Engenheiro Full-Stack

---

## 📊 Resumo Executivo

| Categoria | Status | Observações |
|-----------|--------|-------------|
| **DTOs de Entrada** | ✅ OK | Campos idênticos |
| **Enums** | ⚠️ DIFERENÇA | Ordem diferente (não afeta funcionalidade) |
| **Tipos de Resposta** | ⚠️ PARCIAL | Frontend falta alguns campos |
| **Campos Extras** | 🔴 PROBLEMA | Frontend envia campos não aceitos |

---

## 1. COMPARAÇÃO: CreatePedidoDto

### Backend (`backend/src/modulos/pedido/dto/create-pedido.dto.ts`)
```typescript
export class CreatePedidoDto {
  @IsUUID()
  @IsNotEmpty()
  comandaId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemPedidoDto)
  itens: CreateItemPedidoDto[];
}

export class CreateItemPedidoDto {
  @IsUUID()
  produtoId: string;

  @IsNumber()
  @IsPositive()
  @Max(100)
  quantidade: number;

  @IsString()
  @IsOptional()
  observacao?: string;
}
```

### Frontend (`frontend/src/types/pedido.dto.ts`)
```typescript
export interface CreatePedidoDto {
  comandaId: string;
  itens: CreateItemPedidoDto[];
}

export interface CreateItemPedidoDto {
  produtoId: string;
  quantidade: number;
  observacao?: string;
}
```

### ✅ Resultado: COMPATÍVEL

| Campo | Backend | Frontend | Status |
|-------|---------|----------|--------|
| `comandaId` | `string` (UUID) | `string` | ✅ OK |
| `itens` | `CreateItemPedidoDto[]` | `CreateItemPedidoDto[]` | ✅ OK |
| `itens[].produtoId` | `string` (UUID) | `string` | ✅ OK |
| `itens[].quantidade` | `number` (1-100) | `number` | ✅ OK |
| `itens[].observacao` | `string?` | `string?` | ✅ OK |

**Observação:** Frontend não valida `@Max(100)` - validação apenas no backend.

---

## 2. COMPARAÇÃO: UpdateItemPedidoStatusDto

### Backend (`backend/src/modulos/pedido/dto/update-item-pedido-status.dto.ts`)
```typescript
export class UpdateItemPedidoStatusDto {
  @IsEnum(PedidoStatus)
  status: PedidoStatus;

  @IsOptional()
  @IsString()
  motivoCancelamento?: string;
}
```

### Frontend (`frontend/src/types/pedido.dto.ts`)
```typescript
export interface UpdateItemPedidoStatusDto {
  status: PedidoStatus;
  motivoCancelamento?: string;
}
```

### ✅ Resultado: COMPATÍVEL

| Campo | Backend | Frontend | Status |
|-------|---------|----------|--------|
| `status` | `PedidoStatus` (enum) | `PedidoStatus` (enum) | ✅ OK |
| `motivoCancelamento` | `string?` | `string?` | ✅ OK |

---

## 3. COMPARAÇÃO: CreatePedidoGarcomDto

### Backend (`backend/src/modulos/pedido/dto/create-pedido-garcom.dto.ts`)
```typescript
export class CreatePedidoGarcomDto {
  @IsUUID()
  @IsNotEmpty()
  clienteId: string;

  @IsUUID()
  @IsNotEmpty()
  garcomId: string;

  @IsOptional()
  @IsUUID()
  mesaId?: string;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsArray()
  @ValidateNested({ each: true })
  itens: ItemPedidoGarcomDto[];
}
```

### Frontend (`frontend/src/services/pedidoService.ts` - inline type)
```typescript
export const criarPedidoGarcom = async (data: {
  clienteId: string;
  garcomId: string;
  mesaId?: string;
  observacao?: string;
  itens: Array<{
    produtoId: string;
    quantidade: number;
    observacao?: string;
  }>;
}): Promise<Pedido>
```

### ✅ Resultado: COMPATÍVEL

| Campo | Backend | Frontend | Status |
|-------|---------|----------|--------|
| `clienteId` | `string` (UUID) | `string` | ✅ OK |
| `garcomId` | `string` (UUID) | `string` | ✅ OK |
| `mesaId` | `string?` (UUID) | `string?` | ✅ OK |
| `observacao` | `string?` | `string?` | ✅ OK |
| `itens` | `ItemPedidoGarcomDto[]` | `Array<...>` | ✅ OK |

---

## 4. COMPARAÇÃO: DeixarNoAmbienteDto

### Backend (`backend/src/modulos/pedido/dto/deixar-no-ambiente.dto.ts`)
```typescript
export class DeixarNoAmbienteDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;
}
```

### Frontend (`frontend/src/types/ponto-entrega.dto.ts`)
```typescript
export interface DeixarNoAmbienteDto {
  motivo?: string;
}
```

### ✅ Resultado: COMPATÍVEL

| Campo | Backend | Frontend | Status |
|-------|---------|----------|--------|
| `motivo` | `string?` (max 255) | `string?` | ✅ OK |

**Observação:** Frontend não valida `@MaxLength(255)`.

---

## 5. COMPARAÇÃO: RetirarItemDto / MarcarEntregueDto

### Backend
```typescript
// RetirarItemDto
export class RetirarItemDto {
  @IsUUID()
  @IsNotEmpty()
  garcomId: string;
}

// MarcarEntregueDto
export class MarcarEntregueDto {
  @IsUUID()
  @IsNotEmpty()
  garcomId: string;
}
```

### Frontend (`frontend/src/services/pedidoService.ts`)
```typescript
// retirarItem - envia inline
const response = await api.patch(`/pedidos/item/${itemPedidoId}/retirar`, {
  garcomId
});

// marcarComoEntregue - envia inline
const response = await api.patch(`/pedidos/item/${itemPedidoId}/marcar-entregue`, {
  garcomId
});
```

### ✅ Resultado: COMPATÍVEL

| Campo | Backend | Frontend | Status |
|-------|---------|----------|--------|
| `garcomId` | `string` (UUID) | `string` | ✅ OK |

---

## 6. COMPARAÇÃO: PedidoStatus (Enum)

### Backend (`backend/src/modulos/pedido/enums/pedido-status.enum.ts`)
```typescript
export enum PedidoStatus {
  FEITO = 'FEITO',
  EM_PREPARO = 'EM_PREPARO',
  QUASE_PRONTO = 'QUASE_PRONTO',
  PRONTO = 'PRONTO',
  RETIRADO = 'RETIRADO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
  DEIXADO_NO_AMBIENTE = 'DEIXADO_NO_AMBIENTE',  // ← Posição diferente
}
```

### Frontend (`frontend/src/types/pedido-status.enum.ts`)
```typescript
export enum PedidoStatus {
  FEITO = 'FEITO',
  EM_PREPARO = 'EM_PREPARO',
  QUASE_PRONTO = 'QUASE_PRONTO',
  PRONTO = 'PRONTO',
  RETIRADO = 'RETIRADO',
  ENTREGUE = 'ENTREGUE',
  DEIXADO_NO_AMBIENTE = 'DEIXADO_NO_AMBIENTE',  // ← Posição diferente
  CANCELADO = 'CANCELADO',
}
```

### ⚠️ Resultado: DIFERENÇA DE ORDEM

| Valor | Backend | Frontend | Status |
|-------|---------|----------|--------|
| `FEITO` | ✅ | ✅ | ✅ OK |
| `EM_PREPARO` | ✅ | ✅ | ✅ OK |
| `QUASE_PRONTO` | ✅ | ✅ | ✅ OK |
| `PRONTO` | ✅ | ✅ | ✅ OK |
| `RETIRADO` | ✅ | ✅ | ✅ OK |
| `ENTREGUE` | ✅ | ✅ | ✅ OK |
| `CANCELADO` | Posição 7 | Posição 8 | ⚠️ Ordem diferente |
| `DEIXADO_NO_AMBIENTE` | Posição 8 | Posição 7 | ⚠️ Ordem diferente |

**Impacto:** Nenhum - valores string são idênticos, apenas ordem declarativa diferente.

---

## 7. COMPARAÇÃO: Tipos de Resposta (Entity vs Interface)

### Backend Entity: `Pedido`
```typescript
@Entity('pedidos')
export class Pedido {
  id: string;
  status: PedidoStatus;
  total: number;                    // decimal(10,2)
  data: Date;                       // ← Date no backend
  motivoCancelamento: string | null;
  comanda: Comanda;
  itens: ItemPedido[];
  criadoPorId: string;              // ← Não existe no frontend
  criadoPorTipo: 'GARCOM' | 'CLIENTE';  // ← Não existe no frontend
  criadoPor: Funcionario;           // ← Não existe no frontend
  entreguePorId: string;            // ← Não existe no frontend
  entreguePor: Funcionario;         // ← Não existe no frontend
  entregueEm: Date;                 // ← Não existe no frontend
  tempoTotalMinutos: number;        // ← Não existe no frontend
}
```

### Frontend Interface: `Pedido`
```typescript
export interface Pedido {
  id: string;
  status: PedidoStatus;
  total: number;
  data: string;                     // ← string no frontend (ISO date)
  motivoCancelamento: string | null;
  itens: ItemPedido[];
  comanda?: ComandaSimples;
}
```

### ⚠️ Resultado: CAMPOS FALTANDO NO FRONTEND

| Campo Backend | Existe no Frontend | Tipo Backend | Tipo Frontend |
|---------------|:------------------:|--------------|---------------|
| `id` | ✅ | `string` | `string` |
| `status` | ✅ | `PedidoStatus` | `PedidoStatus` |
| `total` | ✅ | `number` | `number` |
| `data` | ✅ | `Date` | `string` |
| `motivoCancelamento` | ✅ | `string \| null` | `string \| null` |
| `itens` | ✅ | `ItemPedido[]` | `ItemPedido[]` |
| `comanda` | ✅ | `Comanda` | `ComandaSimples?` |
| `criadoPorId` | ❌ | `string` | - |
| `criadoPorTipo` | ❌ | `'GARCOM' \| 'CLIENTE'` | - |
| `criadoPor` | ❌ | `Funcionario` | - |
| `entreguePorId` | ❌ | `string` | - |
| `entreguePor` | ❌ | `Funcionario` | - |
| `entregueEm` | ❌ | `Date` | - |
| `tempoTotalMinutos` | ❌ | `number` | - |

---

## 8. COMPARAÇÃO: ItemPedido

### Backend Entity
```typescript
@Entity('itens_pedido')
export class ItemPedido {
  id: string;
  pedido: Pedido;
  produto: Produto;
  quantidade: number;
  precoUnitario: number;
  observacao: string;
  status: PedidoStatus;
  motivoCancelamento: string;
  ambienteRetiradaId: string;
  ambienteRetirada: Ambiente;
  iniciadoEm: Date;
  prontoEm: Date;
  quaseProntoEm: Date;
  retiradoEm: Date;
  entregueEm: Date;
  retiradoPorGarcomId: string;
  retiradoPorGarcom: Funcionario;
  garcomEntregaId: string;
  garcomEntrega: Funcionario;
  tempoEntregaMinutos: number;      // ← Nome diferente no frontend
  tempoPreparoMinutos: number;
  tempoReacaoMinutos: number;
  tempoEntregaFinalMinutos: number;
}
```

### Frontend Interface
```typescript
export interface ItemPedido {
  id: string;
  quantidade: number;
  precoUnitario: number;
  observacao: string | null;
  status: PedidoStatus;
  motivoCancelamento?: string | null;
  produto: Produto;
  ambienteRetirada?: { id: string; nome: string; } | null;
  iniciadoEm?: string | null;
  prontoEm?: string | null;
  quaseProntoEm?: string | null;
  retiradoEm?: string | null;
  entregueEm?: string | null;
  retiradoPorGarcomId?: string | null;
  retiradoPorGarcom?: { id: string; nome: string; } | null;
  garcomEntregaId?: string | null;
  garcomEntrega?: { id: string; nome: string; } | null;
  tempoPreparoMinutos?: number | null;
  tempoReacaoMinutos?: number | null;
  tempoEntregaFinalMinutos?: number | null;
  // FALTANDO: tempoEntregaMinutos
  // FALTANDO: pedido (relação)
  // FALTANDO: ambienteRetiradaId
}
```

### ⚠️ Resultado: DIFERENÇAS

| Campo | Backend | Frontend | Status |
|-------|---------|----------|--------|
| `tempoEntregaMinutos` | ✅ Existe | ❌ Não existe | 🔴 FALTANDO |
| `ambienteRetiradaId` | ✅ Existe | ❌ Não existe | 🔴 FALTANDO |
| `pedido` | ✅ Existe | ❌ Não existe | ⚠️ OK (circular) |
| Timestamps | `Date` | `string` | ⚠️ Tipo diferente |

---

## 9. PROBLEMA: UpdatePedidoDto no Frontend

### Frontend (`frontend/src/types/pedido.dto.ts`)
```typescript
export interface UpdatePedidoDto {
  status?: PedidoStatus;           // ← Backend NÃO aceita
  motivoCancelamento?: string;     // ← Backend NÃO aceita
}
```

### Backend (`backend/src/modulos/pedido/dto/update-pedido.dto.ts`)
```typescript
export class UpdatePedidoDto extends PartialType(CreatePedidoDto) {}
// Herda: comandaId?, itens?
// NÃO TEM: status, motivoCancelamento
```

### 🔴 Resultado: INCOMPATÍVEL

O frontend define `UpdatePedidoDto` com campos que o backend **não aceita**:
- `status` - Backend não aceita (use `UpdateItemPedidoStatusDto`)
- `motivoCancelamento` - Backend não aceita

**Impacto:** Se o frontend tentar enviar esses campos, serão ignorados pelo backend.

---

## 📋 RESUMO DE PROBLEMAS

### 🔴 Críticos (Podem causar bugs)
1. **UpdatePedidoDto incompatível** - Frontend define campos que backend ignora

### ⚠️ Médios (Podem causar confusão)
2. **Campos faltando em Pedido** - `criadoPorId`, `criadoPorTipo`, `tempoTotalMinutos`, etc.
3. **Campo faltando em ItemPedido** - `tempoEntregaMinutos`, `ambienteRetiradaId`
4. **Tipos Date vs string** - Backend usa `Date`, frontend usa `string`

### ℹ️ Informativos
5. **Ordem do enum diferente** - Não afeta funcionalidade
6. **Validações só no backend** - `@Max(100)`, `@MaxLength(255)`

---

## 🔧 CORREÇÕES RECOMENDADAS

### 1. Corrigir UpdatePedidoDto no Frontend
```typescript
// ANTES (incorreto)
export interface UpdatePedidoDto {
  status?: PedidoStatus;
  motivoCancelamento?: string;
}

// DEPOIS (correto - herda de CreatePedidoDto)
export interface UpdatePedidoDto {
  comandaId?: string;
  itens?: CreateItemPedidoDto[];
}
```

### 2. Adicionar campos faltantes em Pedido
```typescript
export interface Pedido {
  // ... campos existentes ...
  criadoPorId?: string;
  criadoPorTipo?: 'GARCOM' | 'CLIENTE';
  criadoPor?: { id: string; nome: string; };
  entreguePorId?: string;
  entreguePor?: { id: string; nome: string; };
  entregueEm?: string;
  tempoTotalMinutos?: number;
}
```

### 3. Adicionar campos faltantes em ItemPedido
```typescript
export interface ItemPedido {
  // ... campos existentes ...
  tempoEntregaMinutos?: number | null;
  ambienteRetiradaId?: string | null;
}
```

### 4. Padronizar ordem do enum
```typescript
// Manter mesma ordem do backend
export enum PedidoStatus {
  FEITO = 'FEITO',
  EM_PREPARO = 'EM_PREPARO',
  QUASE_PRONTO = 'QUASE_PRONTO',
  PRONTO = 'PRONTO',
  RETIRADO = 'RETIRADO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',           // ← Mover para antes
  DEIXADO_NO_AMBIENTE = 'DEIXADO_NO_AMBIENTE',
}
```

---

## 🎯 Matriz de Compatibilidade

| DTO/Interface | Nomes ✓ | Tipos ✓ | Campos Extras | Status |
|---------------|:-------:|:-------:|:-------------:|:------:|
| CreatePedidoDto | ✅ | ✅ | Nenhum | ✅ OK |
| CreateItemPedidoDto | ✅ | ✅ | Nenhum | ✅ OK |
| UpdateItemPedidoStatusDto | ✅ | ✅ | Nenhum | ✅ OK |
| CreatePedidoGarcomDto | ✅ | ✅ | Nenhum | ✅ OK |
| DeixarNoAmbienteDto | ✅ | ✅ | Nenhum | ✅ OK |
| RetirarItemDto | ✅ | ✅ | Nenhum | ✅ OK |
| MarcarEntregueDto | ✅ | ✅ | Nenhum | ✅ OK |
| UpdatePedidoDto | ❌ | ❌ | status, motivoCancelamento | 🔴 ERRO |
| Pedido (resposta) | ⚠️ | ⚠️ | 7 campos faltando | ⚠️ PARCIAL |
| ItemPedido (resposta) | ⚠️ | ⚠️ | 2 campos faltando | ⚠️ PARCIAL |
| PedidoStatus (enum) | ✅ | ✅ | Ordem diferente | ⚠️ OK |

---

*Auditoria realizada em 11/12/2024*
