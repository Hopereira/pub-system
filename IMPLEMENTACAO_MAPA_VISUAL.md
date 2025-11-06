# 🗺️ Implementação - Mapa Visual de Mesas e Pontos de Entrega

## 📋 Issue #5 - Mapa Visual

**Branch:** `219-5-mapa-visual-de-mesas-e-pontos-de-entrega`  
**Data:** 04/11/2025  
**Status:** 🟡 EM DESENVOLVIMENTO

---

## ✅ Backend Implementado (70%)

### 1. Entidades Atualizadas

#### Mesa
**Arquivo:** `backend/src/modulos/mesa/entities/mesa.entity.ts`

Novos campos adicionados:
```typescript
@Column({ type: 'json', nullable: true })
posicao: { x: number; y: number };

@Column({ type: 'json', nullable: true })
tamanho: { width: number; height: number };

@Column({ type: 'int', nullable: true, default: 0 })
rotacao: number; // graus (0, 90, 180, 270)
```

#### PontoEntrega
**Arquivo:** `backend/src/modulos/ponto-entrega/entities/ponto-entrega.entity.ts`

Novos campos adicionados:
```typescript
@Column({ type: 'json', nullable: true })
posicao: { x: number; y: number };

@Column({ type: 'json', nullable: true })
tamanho: { width: number; height: number };
```

### 2. Migration Criada
**Arquivo:** `backend/src/database/migrations/1730770000000-AddMapaVisualFields.ts`

- ✅ Adiciona campos `posicao`, `tamanho`, `rotacao` em `mesas`
- ✅ Adiciona campos `posicao`, `tamanho` em `pontos_entrega`
- ✅ Suporta rollback completo

### 3. DTOs Criados
**Arquivo:** `backend/src/modulos/mesa/dto/mapa.dto.ts`

- ✅ `PosicaoDto` - Coordenadas X, Y
- ✅ `TamanhoDto` - Largura e altura
- ✅ `AtualizarPosicaoMesaDto` - Atualizar posição de mesa
- ✅ `MesaMapaDto` - Mesa com dados de mapa
- ✅ `PontoEntregaMapaDto` - Ponto com dados de mapa
- ✅ `MapaCompletoDto` - Mapa completo
- ✅ `LayoutEstabelecimentoDto` - Configuração do layout

### 4. Service Atualizado
**Arquivo:** `backend/src/modulos/mesa/mesa.service.ts`

Novos métodos:
```typescript
// Atualizar posição de uma mesa
async atualizarPosicao(id: string, dto: AtualizarPosicaoMesaDto): Promise<Mesa>

// Obter mapa completo com status em tempo real
async getMapa(ambienteId: string): Promise<MapaCompletoDto>
```

**Funcionalidades:**
- ✅ Calcula pedidos prontos por mesa
- ✅ Calcula pedidos prontos por ponto de entrega
- ✅ Retorna status em tempo real
- ✅ Valores padrão para tamanho (mesa: 80x80, ponto: 100x60)

### 5. Controller Atualizado
**Arquivo:** `backend/src/modulos/mesa/mesa.controller.ts`

Novos endpoints:
```typescript
GET /mesas/mapa/visualizar?ambienteId={id}
// Retorna mapa completo com todas as mesas e pontos
// Acesso: ADMIN, GARCOM, CAIXA

PUT /mesas/:id/posicao
// Atualiza posição de uma mesa específica
// Acesso: ADMIN apenas
```

---

## ⏳ Frontend - 0% PENDENTE

### Frontend Mobile (Garçom)
- [ ] ⏳ Tela de mapa visual
- [ ] ⏳ Renderizar mesas com cores por status
- [ ] ⏳ Renderizar pontos de entrega
- [ ] ⏳ Zoom e pan
- [ ] ⏳ Clique na mesa → Ver detalhes
- [ ] ⏳ Filtro: "Apenas com pedidos prontos"
- [ ] ⏳ Atualização em tempo real (WebSocket)

### Frontend Desktop (Admin)
- [ ] ⏳ Configurador de layout
- [ ] ⏳ Drag & drop de mesas
- [ ] ⏳ Redimensionar mesas
- [ ] ⏳ Adicionar/remover mesas
- [ ] ⏳ Salvar layout
- [ ] ⏳ Preview do mapa

---

## 🎨 Cores por Status

```typescript
// Mesas
🟢 Verde: LIVRE
🟡 Amarelo: OCUPADA (sem pedidos prontos)
🔴 Vermelho: OCUPADA (com pedidos prontos)
🔵 Azul: RESERVADA
⚪ Cinza: AGUARDANDO_PAGAMENTO

// Pontos de Entrega
🔵 Azul: Ativo (sem pedidos)
🔴 Vermelho: Ativo (com pedidos prontos)
⚪ Cinza: Inativo
```

---

## 📊 Estrutura do Mapa

### Layout Padrão
```typescript
{
  width: 1200,  // pixels
  height: 800,  // pixels
  gridSize: 20  // pixels (grade para snap)
}
```

### Mesa no Mapa
```typescript
{
  id: "uuid",
  numero: 5,
  status: "OCUPADA",
  posicao: { x: 100, y: 200 },
  tamanho: { width: 80, height: 80 },
  rotacao: 0,
  comanda: {
    id: "uuid",
    pedidosProntos: 2,
    totalPedidos: 5
  }
}
```

### Ponto de Entrega no Mapa
```typescript
{
  id: "uuid",
  nome: "Balcão Principal",
  ativo: true,
  posicao: { x: 500, y: 100 },
  tamanho: { width: 100, height: 60 },
  pedidosProntos: 3
}
```

---

## 🔄 Fluxos Implementados

### Visualizar Mapa (Garçom)
```
1. Garçom acessa /mapa
2. Sistema busca ambiente do garçom
3. Sistema carrega mesas e pontos
4. Sistema calcula pedidos prontos
5. Renderiza mapa com cores
6. Atualiza em tempo real via WebSocket
```

### Configurar Layout (Admin)
```
1. Admin acessa /admin/mapa/configurar
2. Sistema carrega mapa atual
3. Admin arrasta mesas para posições
4. Admin redimensiona mesas
5. Admin salva layout
6. Sistema atualiza banco de dados
7. Mapa é atualizado para todos
```

---

## 🧪 Como Testar (Backend)

### 1. Executar Migration
```bash
docker-compose exec backend npm run typeorm:migration:run
```

### 2. Testar Endpoints

#### Obter Mapa
```bash
GET http://localhost:3000/mesas/mapa/visualizar?ambienteId={uuid}
Header: Authorization: Bearer {token}

Response:
{
  "mesas": [
    {
      "id": "uuid",
      "numero": 1,
      "status": "LIVRE",
      "posicao": null,
      "tamanho": { "width": 80, "height": 80 },
      "rotacao": 0
    }
  ],
  "pontosEntrega": [
    {
      "id": "uuid",
      "nome": "Balcão",
      "ativo": true,
      "posicao": null,
      "tamanho": { "width": 100, "height": 60 },
      "pedidosProntos": 0
    }
  ],
  "layout": {
    "width": 1200,
    "height": 800,
    "gridSize": 20
  }
}
```

#### Atualizar Posição
```bash
PUT http://localhost:3000/mesas/{mesaId}/posicao
Header: Authorization: Bearer {token-admin}
Body:
{
  "posicao": { "x": 100, "y": 200 },
  "tamanho": { "width": 80, "height": 80 },
  "rotacao": 0
}
```

---

## 📝 Próximos Passos

### Imediato
1. ⏳ Executar migration
2. ⏳ Testar endpoints
3. ⏳ Criar frontend mobile (visualizador)
4. ⏳ Criar frontend desktop (configurador)

### Frontend Mobile (Garçom)
1. ⏳ Criar componente `MapaVisual.tsx`
2. ⏳ Implementar renderização de mesas
3. ⏳ Implementar renderização de pontos
4. ⏳ Adicionar zoom/pan (react-zoom-pan-pinch)
5. ⏳ Adicionar filtros
6. ⏳ Integrar WebSocket

### Frontend Desktop (Admin)
1. ⏳ Criar componente `ConfiguradorMapa.tsx`
2. ⏳ Implementar drag & drop (react-dnd)
3. ⏳ Implementar redimensionamento
4. ⏳ Adicionar grade (snap to grid)
5. ⏳ Salvar layout

---

## 🔗 Dependências

### Backend
- ✅ TypeORM (JSON columns)
- ✅ NestJS Guards
- ✅ Swagger/OpenAPI

### Frontend (A implementar)
- ⏳ react-zoom-pan-pinch (zoom/pan)
- ⏳ react-dnd (drag & drop)
- ⏳ react-rnd (resize & drag)
- ⏳ Socket.io-client (tempo real)

---

## 📊 Progresso

- **Backend:** 70% ✅
  - ✅ Entidades atualizadas
  - ✅ Migration criada
  - ✅ DTOs criados
  - ✅ Service implementado
  - ✅ Controller implementado
  - ⏳ Migration executada
  - ⏳ Testes

- **Frontend:** 0% ⏳
  - ⏳ Visualizador (garçom)
  - ⏳ Configurador (admin)

---

**Status Atual:** Backend pronto para migration e testes. Frontend pendente.  
**Próxima Ação:** Executar migration e começar frontend
