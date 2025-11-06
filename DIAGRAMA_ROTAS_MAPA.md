# 🗺️ Diagrama de Rotas do Mapa Visual

## 📊 Fluxo de Navegação

```
┌─────────────────────────────────────────────────────────────────┐
│                         SISTEMA DE MAPA                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│     👨‍💼 ADMIN/GERENTE     │         │      👨‍🍳 GARÇOM          │
└──────────────────────────┘         └──────────────────────────┘
           │                                      │
           │                                      │
           ▼                                      ▼
┌──────────────────────────┐         ┌──────────────────────────┐
│  /dashboard/mapa/        │         │    /garcom/mapa          │
│      configurar          │         │                          │
│                          │         │  🟢 Visualização         │
│  🔧 Drag & Drop          │         │  🟡 Tempo Real           │
│  🔄 Rotação              │         │  🔴 Pedidos Prontos      │
│  💾 Salvar Layout        │         │  📊 Estatísticas         │
└──────────────────────────┘         └──────────────────────────┘
           │                                      ▲
           │                                      │
           │ "Visualizar Mapa"                    │ Admin pode
           ▼                                      │ supervisionar
┌──────────────────────────┐                     │
│  /dashboard/mapa/        │                     │
│     visualizar           │─────────────────────┘
│                          │
│  👁️ Preview Read-Only    │
│  📘 Banner Informativo   │
│  ⚙️ Botão "Configurar"   │
└──────────────────────────┘
           │
           │ "Configurar Layout"
           │
           └──────────────┐
                          │
                          ▼
           ┌──────────────────────────┐
           │  Volta para Configurar   │
           └──────────────────────────┘
```

---

## 🔒 Controle de Acesso (RoleGuard)

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROLE GUARD                                │
│                   Verifica Cargo do Usuário                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Usuário Logado? │
                    └─────────────────┘
                         │         │
                    SIM  │         │  NÃO
                         │         │
                         ▼         ▼
              ┌──────────────┐   ┌──────────────┐
              │ Cargo Válido?│   │ Redirecionar │
              └──────────────┘   │  para /login │
                   │      │      └──────────────┘
              SIM  │      │  NÃO
                   │      │
                   ▼      ▼
         ┌──────────┐  ┌──────────────────┐
         │ Renderiza│  │ Tela "Acesso     │
         │ Conteúdo │  │ Negado"          │
         └──────────┘  │                  │
                       │ - Ícone Vermelho │
                       │ - Seu Cargo      │
                       │ - Cargos Válidos │
                       │ - Botão Voltar   │
                       └──────────────────┘
```

---

## 📋 Matriz de Permissões

```
┌──────────────────────────────┬───────┬─────────┬────────┬───────┬─────────┐
│ ROTA                         │ ADMIN │ GERENTE │ GARCOM │ CAIXA │ COZINHA │
├──────────────────────────────┼───────┼─────────┼────────┼───────┼─────────┤
│ /dashboard/mapa/configurar   │  ✅   │   ✅    │   ❌   │  ❌   │   ❌    │
│ /dashboard/mapa/visualizar   │  ✅   │   ✅    │   ❌   │  ❌   │   ❌    │
│ /garcom/mapa                 │  ✅*  │   ✅*   │   ✅   │  ❌   │   ❌    │
└──────────────────────────────┴───────┴─────────┴────────┴───────┴─────────┘

* Acesso para supervisão
```

---

## 🎯 Cenários de Uso

### Cenário 1: Admin Configura Layout
```
1. Admin → /dashboard/mapa/configurar
   ├─ RoleGuard: ✅ ADMIN permitido
   ├─ Arrasta Mesa 1 para (100, 200)
   ├─ Rotaciona Mesa 1 em 90°
   └─ Clica "Salvar Layout"
       └─ ✅ Layout salvo

2. Admin → Clica "Visualizar Mapa"
   ├─ Redireciona para /dashboard/mapa/visualizar
   ├─ RoleGuard: ✅ ADMIN permitido
   └─ Vê preview como garçom veria
       └─ Banner: "Esta é uma prévia..."

3. Admin → Clica "Configurar Layout"
   └─ Volta para /dashboard/mapa/configurar
```

### Cenário 2: Garçom Usa Mapa
```
1. Garçom → /garcom/mapa
   ├─ RoleGuard: ✅ GARCOM permitido
   ├─ Vê Mesa 5 vermelha (pedidos prontos)
   └─ Clica na Mesa 5
       ├─ Modal: "2 pedidos prontos de 5 total"
       └─ Clica "Ver Comanda"
           └─ Redireciona para comanda
```

### Cenário 3: Caixa Bloqueado
```
1. Caixa → Tenta acessar /garcom/mapa
   ├─ RoleGuard: ❌ CAIXA não permitido
   └─ Tela "Acesso Negado"
       ├─ 🛡️ Ícone vermelho
       ├─ "Seu cargo: CAIXA"
       ├─ "Cargos permitidos: GARCOM, ADMIN, GERENTE"
       └─ Botão "Voltar para Minha Página"
           └─ Redireciona para /caixa
```

---

## 🔄 Antes vs Depois

### ❌ ANTES (Problemático)
```
Admin → Configurar → "Visualizar" → /garcom/mapa
                                        │
                                        ├─ Confusão de contexto
                                        ├─ Sem controle de acesso
                                        └─ Garçom e admin na mesma rota
```

### ✅ DEPOIS (Correto)
```
Admin → Configurar → "Visualizar" → /dashboard/mapa/visualizar
                                        │
                                        ├─ Contexto claro (admin preview)
                                        ├─ RoleGuard protegendo
                                        └─ Separação de rotas

Garçom → /garcom/mapa
            │
            ├─ Contexto operacional
            ├─ RoleGuard protegendo
            └─ Rota dedicada
```

---

## 📦 Componentes Criados

```
frontend/src/
├── components/
│   └── guards/
│       ├── RoleGuard.tsx          ← NOVO (Controle de acesso)
│       └── ComandaGuard.tsx       (Já existia)
│
└── app/(protected)/
    ├── dashboard/
    │   └── mapa/
    │       ├── configurar/
    │       │   └── page.tsx       (Modificado: RoleGuard + botão corrigido)
    │       └── visualizar/
    │           └── page.tsx       ← NOVO (Preview admin)
    │
    └── garcom/
        └── mapa/
            └── page.tsx           (Modificado: RoleGuard)
```

---

## 🎨 UI Components

### Tela de Acesso Negado
```
┌─────────────────────────────────────┐
│                                     │
│           🛡️ (Ícone Vermelho)       │
│                                     │
│         Acesso Negado               │
│                                     │
│  Você não tem permissão para        │
│  acessar esta página.               │
│                                     │
│  Seu cargo: CAIXA                   │
│  Cargos permitidos:                 │
│  GARCOM, ADMIN, GERENTE             │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ ← Voltar para Minha Página   │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### Banner Informativo (Admin Preview)
```
┌─────────────────────────────────────────────────────────┐
│ ℹ️  Modo de Visualização                                │
│                                                          │
│ Esta é uma prévia de como os garçons visualizam o mapa. │
│ Para editar o layout, clique em "Configurar Layout".    │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 Testes Rápidos

### ✅ Teste 1: Admin Acessa Configuração
```bash
Login: admin@pub.com
URL: /dashboard/mapa/configurar
Esperado: ✅ Carrega normalmente
```

### ✅ Teste 2: Admin Vê Preview
```bash
Login: admin@pub.com
URL: /dashboard/mapa/configurar
Ação: Clicar "Visualizar Mapa"
Esperado: ✅ Redireciona para /dashboard/mapa/visualizar
         ✅ Mostra banner informativo
```

### ✅ Teste 3: Garçom Acessa Mapa
```bash
Login: garcom@pub.com
URL: /garcom/mapa
Esperado: ✅ Carrega normalmente
```

### ✅ Teste 4: Garçom Bloqueado em Config
```bash
Login: garcom@pub.com
URL: /dashboard/mapa/configurar
Esperado: ❌ Tela "Acesso Negado"
         ✅ Botão volta para /garcom
```

### ✅ Teste 5: Caixa Bloqueado
```bash
Login: caixa@pub.com
URL: /garcom/mapa
Esperado: ❌ Tela "Acesso Negado"
         ✅ Mensagem: "Seu cargo: CAIXA"
         ✅ Botão volta para /caixa
```

---

## 📚 Documentação Completa

Para mais detalhes, consulte:
- `CORRECAO_CONTROLE_ACESSO_MAPA.md` - Documentação completa
- `RESUMO_CORRECAO_MAPA.md` - Resumo executivo
- `ISSUE_219_COMPLETA.md` - Issue original do mapa visual

---

**Criado em:** 04/11/2025  
**Status:** ✅ IMPLEMENTADO E TESTADO
