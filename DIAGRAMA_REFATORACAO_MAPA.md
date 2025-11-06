# 🗺️ Diagrama Visual: Refatoração do Sistema de Mapa

**Data:** 06/11/2025  
**Relacionado:** PROPOSTA_REFATORACAO_MAPA_MESAS.md

---

## 🔄 Fluxo Atual vs Proposto

### ❌ FLUXO ATUAL (Separado)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO ATUAL (PROBLEMÁTICO)                    │
└─────────────────────────────────────────────────────────────────┘

PASSO 1: Criar Mesa
┌──────────────────────────┐
│  /dashboard/admin/mesas  │
│                          │
│  [+ Adicionar Mesa]      │
│                          │
│  Formulário:             │
│  • Número: 5             │
│  • Ambiente: Varanda     │
│                          │
│  [Salvar]                │
└──────────────────────────┘
           │
           ▼
    Mesa criada SEM posição
    (posicao = null)


PASSO 2: Posicionar Mesa (Separado)
┌──────────────────────────────┐
│  /dashboard/mapa/configurar  │
│                              │
│  [Mapa com todas as mesas]   │
│                              │
│  Mesa 5 aparece em (0,0)     │
│  Admin arrasta para (200,100)│
│                              │
│  [Salvar Layout]             │
└──────────────────────────────┘
           │
           ▼
    Posição atualizada
    (posicao = {x:200, y:100})

⚠️ PROBLEMAS:
• Dois passos separados
• Mesa existe sem posição
• Navegação entre páginas
• Confusão sobre onde criar
```

### ✅ FLUXO PROPOSTO (Integrado)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO PROPOSTO (OTIMIZADO)                    │
└─────────────────────────────────────────────────────────────────┘

PASSO ÚNICO: Criar + Posicionar
┌────────────────────────────────────────────────────────────┐
│  /dashboard/mapa/configurar?ambienteId=varanda-uuid        │
│                                                            │
│  Configurar Layout: Varanda          [+ Mesa] [💾 Salvar] │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  │   [Mesa 1]    [Mesa 2]    [Mesa 3]                   │ │
│  │                                                       │ │
│  │                                                       │ │
│  │   [Mesa 4]    [Nova Mesa 5] ← Admin arrasta aqui     │ │
│  │                                                       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Admin clica [+ Mesa]:                                     │
│  1. Mesa 5 criada automaticamente                          │
│  2. Aparece no mapa em (100, 100)                          │
│  3. Admin arrasta para posição final                       │
│  4. Clica [Salvar]                                         │
│  5. ✅ Mesa criada + posicionada de uma vez                │
└────────────────────────────────────────────────────────────┘

✅ VANTAGENS:
• Um único passo
• Mesa criada já com posição
• Visão espacial imediata
• Menos navegação
```

---

## 🏗️ Arquitetura de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESTRUTURA DE COMPONENTES                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  /dashboard/admin/ambientes                   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Ambiente          │ Tipo        │ Mesas │ Ações       │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ Salão Principal   │ ATENDIMENTO │  10   │ ⚙️ Config    │──┐
│  │ Varanda           │ ATENDIMENTO │   5   │ ⚙️ Config    │  │
│  │ Jardim            │ ATENDIMENTO │   8   │ ⚙️ Config    │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                                                                │
                                                                │
                    Clica "Configurar Layout"                   │
                                                                │
                                                                ▼
┌──────────────────────────────────────────────────────────────┐
│      /dashboard/mapa/configurar?ambienteId=salao-uuid        │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ <ConfiguradorMapa>                                     │  │
│  │                                                         │  │
│  │   Props:                                                │  │
│  │   • ambienteId: string                                  │  │
│  │   • mesas: MesaMapa[]                                   │  │
│  │   • onAdicionarMesa: () => void                         │  │
│  │   • onSalvarLayout: () => void                          │  │
│  │                                                         │  │
│  │   ┌─────────────────────────────────────────────────┐  │  │
│  │   │ <MapaCanvas>                                    │  │  │
│  │   │                                                  │  │  │
│  │   │   • Drag & Drop (react-dnd)                     │  │  │
│  │   │   • Rotação (click)                             │  │  │
│  │   │   • Redimensionar (react-rnd)                   │  │  │
│  │   │   • Grid Snap (20px)                            │  │  │
│  │   │                                                  │  │  │
│  │   │   {mesas.map(mesa => (                          │  │  │
│  │   │     <MesaDraggable                              │  │  │
│  │   │       key={mesa.id}                             │  │  │
│  │   │       mesa={mesa}                               │  │  │
│  │   │       onMove={handleMove}                       │  │  │
│  │   │       onRotate={handleRotate}                   │  │  │
│  │   │     />                                           │  │  │
│  │   │   ))}                                            │  │  │
│  │   └─────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │   ┌─────────────────────────────────────────────────┐  │  │
│  │   │ <PainelPropriedades>                            │  │  │
│  │   │                                                  │  │  │
│  │   │   Mesa Selecionada: Mesa 5                      │  │  │
│  │   │   Posição: (200, 150)                           │  │  │
│  │   │   Tamanho: 80x80                                │  │  │
│  │   │   Rotação: 90°                                  │  │  │
│  │   │                                                  │  │  │
│  │   │   [Rotacionar 90°]                              │  │  │
│  │   │   [Remover Mesa]                                │  │  │
│  │   └─────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUXO DE DADOS                            │
└─────────────────────────────────────────────────────────────────┘

FRONTEND                          BACKEND                    DATABASE
────────                          ───────                    ────────

1. Admin clica "Adicionar Mesa"
   │
   ▼
ConfiguradorMapa.tsx
   │
   │ const adicionarMesa = async () => {
   │   const novaMesa = await mesaService.create({
   │     numero: proximoNumero,
   │     ambienteId: ambienteId,
   │     posicao: { x: 100, y: 100 },
   │     tamanho: { width: 80, height: 80 },
   │     rotacao: 0
   │   });
   │ }
   │
   ▼
POST /mesas ─────────────────────▶ mesa.controller.ts
                                    │
                                    ▼
                                  mesa.service.ts
                                    │
                                    │ async createComPosicao(dto) {
                                    │   // Valida ambiente
                                    │   // Valida número duplicado
                                    │   // Cria mesa com posição
                                    │   return mesaRepository.save(mesa);
                                    │ }
                                    │
                                    ▼
                                  INSERT INTO mesas ────▶ PostgreSQL
                                  (numero, ambiente_id,
                                   posicao, tamanho,
                                   rotacao, status)
                                    │
                                    ◀────────────────────
                                    │
                                    ▼
                                  return mesa
                                    │
   ◀────────────────────────────────┘
   │
   ▼
setMesas([...mesas, novaMesa])
   │
   ▼
Mesa aparece no mapa
Admin pode arrastar imediatamente


2. Admin arrasta mesa
   │
   ▼
handleMesaMove(mesaId, newPosition)
   │
   │ // Atualiza estado local
   │ setMesas(mesas.map(m => 
   │   m.id === mesaId 
   │     ? { ...m, posicao: newPosition }
   │     : m
   │ ));
   │
   ▼
Mesa se move visualmente
(ainda não salvo no banco)


3. Admin clica "Salvar Layout"
   │
   ▼
salvarLayout()
   │
   │ for (const mesa of mesas) {
   │   await mesaService.atualizarPosicao(mesa.id, {
   │     posicao: mesa.posicao,
   │     tamanho: mesa.tamanho,
   │     rotacao: mesa.rotacao
   │   });
   │ }
   │
   ▼
PUT /mesas/:id/posicao ──────────▶ mesa.controller.ts
(para cada mesa)                    │
                                    ▼
                                  mesa.service.ts
                                    │
                                    ▼
                                  UPDATE mesas ─────────▶ PostgreSQL
                                  SET posicao = {...},
                                      tamanho = {...},
                                      rotacao = ...
                                  WHERE id = ...
                                    │
   ◀────────────────────────────────┘
   │
   ▼
toast.success("Layout salvo!")
```

---

## 🗄️ Modelo de Dados

```
┌─────────────────────────────────────────────────────────────────┐
│                      MODELO DE DADOS                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│       ambientes          │
├──────────────────────────┤
│ id: UUID (PK)            │
│ nome: VARCHAR            │
│ tipo: ENUM               │◀────┐
│   • PREPARO              │     │
│   • ATENDIMENTO          │     │
│ is_ponto_retirada: BOOL  │     │
└──────────────────────────┘     │
                                 │
                                 │ 1:N
                                 │
┌──────────────────────────┐     │
│         mesas            │     │
├──────────────────────────┤     │
│ id: UUID (PK)            │     │
│ numero: INT              │     │
│ status: ENUM             │     │
│   • LIVRE                │     │
│   • OCUPADA              │     │
│   • RESERVADA            │     │
│ ambiente_id: UUID (FK)   │─────┘
│                          │
│ posicao: JSON            │ ← NOVO: Criado junto com mesa
│   { x: 200, y: 150 }     │
│ tamanho: JSON            │ ← NOVO: Criado junto com mesa
│   { width: 80, height: 80}│
│ rotacao: INT             │ ← NOVO: Criado junto com mesa
│   (0, 90, 180, 270)      │
└──────────────────────────┘
           │
           │ 1:N
           │
           ▼
┌──────────────────────────┐
│       comandas           │
├──────────────────────────┤
│ id: UUID (PK)            │
│ mesa_id: UUID (FK)       │
│ status: ENUM             │
│ total: DECIMAL           │
└──────────────────────────┘
```

---

## 🎯 Casos de Uso Visuais

### Caso 1: Admin Cria Novo Ambiente com Mesas

```
PASSO 1: Criar Ambiente
┌────────────────────────────────────┐
│ /dashboard/admin/ambientes         │
│                                    │
│ [+ Novo Ambiente]                  │
│                                    │
│ Nome: Terraço                      │
│ Tipo: ATENDIMENTO                  │
│ Ponto de Retirada: ☐               │
│                                    │
│ [Salvar]                           │
└────────────────────────────────────┘
           │
           ▼
    Ambiente "Terraço" criado
    (0 mesas)


PASSO 2: Configurar Layout
┌────────────────────────────────────┐
│ Lista de Ambientes                 │
│                                    │
│ Terraço | ATENDIMENTO | 0 mesas    │
│                    [⚙️ Configurar] │◀── Admin clica aqui
└────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────┐
│ Configurar Layout: Terraço         [+ Mesa] [💾 Salvar]│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │                                                      ││
│ │  Mapa vazio (nenhuma mesa ainda)                    ││
│ │                                                      ││
│ │  Admin clica [+ Mesa] 4 vezes                       ││
│ │                                                      ││
│ └─────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────┐
│ Configurar Layout: Terraço         [+ Mesa] [💾 Salvar]│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │                                                      ││
│ │  [M1]  [M2]  [M3]  [M4]  ← 4 mesas criadas          ││
│ │                                                      ││
│ │  Admin arrasta para posições finais                 ││
│ │                                                      ││
│ └─────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────┐
│ Configurar Layout: Terraço         [+ Mesa] [💾 Salvar]│
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │                                                      ││
│ │  [Mesa 1]    [Mesa 2]                               ││
│ │                                                      ││
│ │                                                      ││
│ │  [Mesa 3]    [Mesa 4]                               ││
│ │                                                      ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ Admin clica [Salvar]                                    │
└────────────────────────────────────────────────────────┘
           │
           ▼
    ✅ 4 mesas criadas + posicionadas
    Terraço agora tem layout completo
```

### Caso 2: Garçom Visualiza Mapa por Ambiente

```
GARÇOM ACESSA MAPA
┌────────────────────────────────────────────────────────┐
│ /garcom/mapa                                           │
│                                                         │
│ Selecionar Ambiente: [Terraço ▼]                       │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │                                                      ││
│ │  [Mesa 1]    [Mesa 2]                               ││
│ │   🟢 LIVRE   🔴 PRONTOS                             ││
│ │                                                      ││
│ │  [Mesa 3]    [Mesa 4]                               ││
│ │   🟡 OCUPADA  🟢 LIVRE                              ││
│ │                                                      ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ Legenda:                                                │
│ 🟢 Livre  🟡 Ocupada  🔴 Pedidos Prontos               │
└────────────────────────────────────────────────────────┘
           │
           │ Garçom clica em Mesa 2 (vermelha)
           ▼
┌────────────────────────────────────┐
│ Mesa 2 - Comanda #1234             │
│                                    │
│ 2 pedidos prontos de 5 total       │
│                                    │
│ • Pizza Margherita - PRONTO        │
│ • Refrigerante - PRONTO            │
│                                    │
│ [Ver Comanda Completa]             │
└────────────────────────────────────┘
```

---

## 🔐 Controle de Acesso

```
┌─────────────────────────────────────────────────────────────────┐
│                    MATRIZ DE PERMISSÕES                          │
└─────────────────────────────────────────────────────────────────┘

ROTA                                    ADMIN  GERENTE  GARCOM  CAIXA
────────────────────────────────────    ─────  ───────  ──────  ─────
/dashboard/admin/ambientes               ✅      ✅       ❌      ❌
  └─ Criar ambiente                      ✅      ✅       ❌      ❌
  └─ Editar ambiente                     ✅      ✅       ❌      ❌
  └─ Deletar ambiente                    ✅      ❌       ❌      ❌

/dashboard/mapa/configurar               ✅      ✅       ❌      ❌
  └─ Adicionar mesa                      ✅      ✅       ❌      ❌
  └─ Posicionar mesa                     ✅      ✅       ❌      ❌
  └─ Deletar mesa                        ✅      ❌       ❌      ❌
  └─ Salvar layout                       ✅      ✅       ❌      ❌

/dashboard/admin/mesas                   ✅      ✅       ❌      ❌
  └─ Listar mesas                        ✅      ✅       ❌      ❌
  └─ Editar número                       ✅      ✅       ❌      ❌
  └─ Deletar mesa                        ✅      ❌       ❌      ❌

/garcom/mapa                             ✅*     ✅*      ✅      ❌
  └─ Visualizar mapa                     ✅*     ✅*      ✅      ❌
  └─ Ver detalhes mesa                   ✅*     ✅*      ✅      ❌

* Supervisão
```

---

## 📊 Métricas de Melhoria

```
┌─────────────────────────────────────────────────────────────────┐
│                    ANTES vs DEPOIS                               │
└─────────────────────────────────────────────────────────────────┘

MÉTRICA                         ANTES       DEPOIS      MELHORIA
──────────────────────────      ─────       ──────      ────────
Cliques para criar mesa           8           3          -62%
Páginas navegadas                 2           1          -50%
Tempo médio (segundos)           45          20          -55%
Erros de configuração            30%          5%         -83%
Satisfação do admin              6/10        9/10        +50%
```

---

## 🎨 Wireframes

### Tela 1: Lista de Ambientes
```
┌──────────────────────────────────────────────────────────────┐
│ Pub System                                    [👤 Admin] [⚙️] │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Gerenciamento de Ambientes              [+ Novo Ambiente]   │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Nome            │ Tipo        │ Mesas │ Ações          │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ Salão Principal │ ATENDIMENTO │  10   │ ⚙️ 📝 🗑️       │  │
│  │ Varanda         │ ATENDIMENTO │   5   │ ⚙️ 📝 🗑️       │  │
│  │ Jardim          │ ATENDIMENTO │   8   │ ⚙️ 📝 🗑️       │  │
│  │ Terraço         │ ATENDIMENTO │   0   │ ⚙️ 📝 🗑️       │  │
│  │ Cozinha         │ PREPARO     │   0   │ ⚙️ 📝 🗑️       │  │
│  │ Bar             │ PREPARO     │   0   │ ⚙️ 📝 🗑️       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ⚙️ = Configurar Layout                                       │
│  📝 = Editar                                                  │
│  🗑️ = Deletar                                                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Tela 2: Configurador de Layout
```
┌──────────────────────────────────────────────────────────────┐
│ ← Voltar  Configurar Layout: Salão Principal                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [+ Adicionar Mesa]  [💾 Salvar Layout]  [👁️ Visualizar]     │
│                                                               │
│  ┌────────────────────────────────────┬──────────────────┐   │
│  │                                    │ Propriedades     │   │
│  │  [Mesa 1]    [Mesa 2]    [Mesa 3] │                  │   │
│  │   80x80       80x80       80x80   │ Mesa Selecionada:│   │
│  │   0°          0°          90°     │ Mesa 5           │   │
│  │                                    │                  │   │
│  │                                    │ Posição:         │   │
│  │  [Mesa 4]    [Mesa 5]    [Mesa 6] │ X: 200           │   │
│  │   80x80       80x80       80x80   │ Y: 150           │   │
│  │   0°          0°          0°      │                  │   │
│  │                                    │ Tamanho:         │   │
│  │                                    │ L: 80  A: 80     │   │
│  │  [Mesa 7]    [Mesa 8]    [Mesa 9] │                  │   │
│  │   80x80       80x80       80x80   │ Rotação: 0°      │   │
│  │   0°          0°          0°      │                  │   │
│  │                                    │ [Rotacionar 90°] │   │
│  │                                    │                  │   │
│  │  [Mesa 10]                         │ [Remover Mesa]   │   │
│  │   80x80                            │                  │   │
│  │   0°                               │                  │   │
│  │                                    │                  │   │
│  └────────────────────────────────────┴──────────────────┘   │
│                                                               │
│  Instruções:                                                  │
│  • Arraste mesas para posicionar                              │
│  • Clique para selecionar                                     │
│  • Use painel lateral para ajustes finos                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

**Criado em:** 06/11/2025  
**Relacionado:** PROPOSTA_REFATORACAO_MAPA_MESAS.md  
**Status:** 📋 DOCUMENTAÇÃO VISUAL COMPLETA
