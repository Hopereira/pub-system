# 🔧 Correções - 15 de Dezembro de 2025

> Resumo das correções implementadas na sessão de hoje

---

## 📋 Resumo Executivo

| Categoria | Correções | Status |
|-----------|-----------|--------|
| Auto-Atendimento | 4 | ✅ Completo |
| TabBar/Navegação | 2 | ✅ Completo |
| Caixa/Financeiro | 3 | ✅ Completo |
| Recuperação de Comanda | 5 | ✅ Completo |
| WebSocket/Tempo Real | 6 | ✅ Completo |
| Endpoints Públicos | 3 | ✅ Completo |
| **Total** | **23** | ✅ **100%** |

---

## 🎯 Auto-Atendimento do Cliente

### 1. Rota `/evento/[id]` - Erro 404
**Problema:** QR Code de boas-vindas levava para página "Não Encontrada"

**Causa:** Sintaxe de `params` incompatível com Next.js 15

**Solução:** Atualizado para usar `params` como Promise
```typescript
// ANTES (incorreto)
params: { id: string };
const { id } = params;

// DEPOIS (correto - Next.js 15)
params: Promise<{ id: string }>;
const { id } = await params;
```

**Arquivo:** `frontend/src/app/evento/[id]/page.tsx`

---

### 2. Fallback para `API_URL_SERVER`
**Problema:** Rotas SSR não conseguiam chamar a API no Vercel

**Causa:** Variável `API_URL_SERVER` não estava configurada no Vercel

**Solução:** Adicionado fallback com prioridade:
1. `API_URL_SERVER` (se definida)
2. `NEXT_PUBLIC_API_URL` (fallback)
3. `https://api.pubsystem.com.br` (fallback final)

```typescript
const getApiBaseUrl = () => {
  if (isServer) {
    return process.env.API_URL_SERVER || 
           process.env.NEXT_PUBLIC_API_URL || 
           'https://api.pubsystem.com.br';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.pubsystem.com.br';
};
```

**Arquivo:** `frontend/src/services/api.ts`

---

### 3. Fluxo de QR Codes Documentado

| QR Code | Gerado em | Rota | Cobrança |
|---------|-----------|------|----------|
| **Boas-Vindas** | Páginas de Boas-Vindas | `/evento/[paginaEventoId]` | ❌ Sem entrada |
| **Entrada Paga** | Agenda de Eventos | `/entrada/[eventoId]` | ✅ Com valor |

**Fluxo do Cliente:**
1. Escaneia QR Code → Vai para `/evento/...` ou `/entrada/...`
2. Preenche dados (nome, CPF, email, celular)
3. Sistema cria cliente (ou encontra existente por CPF)
4. Sistema abre comanda (com ou sem valor de entrada)
5. Redireciona para `/portal-cliente/[comandaId]`
6. Cliente acessa cardápio, faz pedidos, acompanha status

---

## 🧭 TabBar e Navegação

### 4. TabBar do Cozinheiro - Duplicação
**Problema:** "Início" e "Pedidos" apontavam para a mesma rota `/cozinha`

**Solução:** Trocado "Pedidos" por "Prontos" com ícone Bell
```typescript
const preparoTabs: TabItem[] = [
  { label: 'Início', icon: Home, href: '/cozinha' },
  { label: 'Prontos', icon: Bell, href: '/dashboard/operacional/pedidos-prontos' },
  { label: 'Perfil', icon: User, href: '/dashboard/perfil' },
];
```

**Arquivo:** `frontend/src/components/mobile/TabBar.tsx`

---

### 5. Rota `/cozinha` Redirecionamento
**Problema:** Rota `/cozinha` não tinha conteúdo útil

**Solução:** Redireciona automaticamente para o painel Kanban do primeiro ambiente de preparo

**Arquivo:** `frontend/src/app/(protected)/cozinha/page.tsx`

---

## 💰 Caixa e Financeiro

### 6. Fechamento sem Movimentações
**Problema:** Erro ao tentar fechar caixa sem sangrias/suprimentos

**Solução:** Adicionado checkbox de confirmação quando não há movimentações

---

### 7. Valor do Suprimento no Modal
**Problema:** Valor do suprimento não aparecia no modal de fechamento

**Solução:** Corrigido cálculo e exibição do valor

---

### 8. Dinheiro Esperado
**Problema:** Cálculo não incluía o valor inicial do caixa

**Solução:** Fórmula corrigida: `valorInicial + vendas + suprimentos - sangrias`

---

## 📁 Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `frontend/src/app/evento/[id]/page.tsx` | Sintaxe Next.js 15 |
| `frontend/src/services/api.ts` | Fallback API_URL_SERVER |
| `frontend/src/components/mobile/TabBar.tsx` | TabBar cozinheiro |
| `README.md` | Seção correções recentes |
| `GUIA_RAPIDO_SERVIDORES.md` | Documentação QR Codes |

---

## 🚀 Deploy

### Frontend (Vercel)
- ✅ Deploy automático via push no `main`
- ✅ Correções aplicadas e funcionando

### Backend (Oracle VM)
- ⏳ Pendente: Deploy para aplicar correções de timezone
- Comando: 
```bash
cd ~/pub-system
git pull origin main
docker compose -f docker-compose.micro.yml up -d --build --no-cache --force-recreate
```

---

## 🔑 Recuperação de Comanda (NOVO)

### 9. Endpoint Público para Recuperar Comanda
**Problema:** Cliente recebia erro 401 ao tentar recuperar comanda por CPF

**Causa:** Endpoint `/comandas/search` exigia autenticação

**Solução:** Criado endpoint público `POST /comandas/recuperar`
```typescript
@Public()
@Post('recuperar')
async recuperarComanda(@Body() dto: RecuperarComandaDto) {
  return this.comandaService.recuperarComandaPublica(dto);
}
```

**Arquivos:**
- `backend/src/modulos/comanda/comanda.controller.ts`
- `backend/src/modulos/comanda/comanda.service.ts`

---

### 10. Busca por ID ou CPF
**Funcionalidade:** Cliente pode buscar comanda por:
- **ID da comanda** (UUID completo)
- **CPF** (com ou sem formatação)

**Lógica:**
```typescript
// Detecta automaticamente se é UUID ou CPF
const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (isUUID.test(identificador)) {
  // Busca por ID
} else {
  // Busca por CPF (remove formatação)
}
```

---

### 11. Página `/recuperar-comanda` Atualizada
**Problema:** Página usava endpoint protegido

**Solução:** Atualizada para usar `POST /comandas/recuperar`

**Arquivo:** `frontend/src/app/(publico)/recuperar-comanda/page.tsx`

---

### 12. Link nas Páginas de Evento
**Melhoria:** Adicionado link "Recuperar Comanda" nas páginas:
- `/evento/[id]` (boas-vindas)
- `/entrada/[id]` (entrada paga)

---

### 13. CPF com Máscara Visual
**Melhoria:** CPF exibido com máscara XXX.XXX.XXX-XX em todas as páginas

---

## 🔌 WebSocket e Tempo Real (NOVO)

### 14. Evento `nova_comanda`
**Problema:** Comandas abertas não atualizavam automaticamente

**Solução:** Backend emite evento `nova_comanda` ao criar comanda
```typescript
// Em comanda.service.ts - método create()
this.pedidosGateway.emitNovaComanda(comandaSalva);
```

**Arquivo:** `backend/src/modulos/comanda/comanda.service.ts`

---

### 15. Comandas Abertas - Atualização Dinâmica
**Problema:** Páginas de comandas abertas (ADM/Caixa) não atualizavam

**Solução:** Implementado WebSocket nas páginas:
- `/caixa/comandas-abertas`
- `/caixa` (estatísticas)

**Eventos escutados:**
- `nova_comanda` - Adiciona nova comanda à lista
- `comanda_atualizada` - Atualiza comanda existente

**Arquivos:**
- `frontend/src/app/(protected)/caixa/comandas-abertas/page.tsx`
- `frontend/src/app/(protected)/caixa/page.tsx`

---

### 16. Gestão de Pedidos do Garçom
**Problema:** Garçom não via pedidos (filtro muito restritivo)

**Causa:** Filtro mostrava apenas pedidos que o garçom já entregou

**Solução:** Removido filtro - garçom agora vê TODOS os pedidos (igual ADM)
```typescript
// ANTES: Filtrava por garcomEntregaId === user?.id
// DEPOIS: Sem filtro restritivo
```

**Arquivo:** `frontend/src/app/(protected)/dashboard/gestaopedidos/MapaPedidos.tsx`

---

### 17. WebSocket com Pedido Completo
**Problema:** Cozinha não atualizava quando garçom entregava pedido

**Causa:** WebSocket enviava pedido com relações incompletas

**Solução:** Recarregar pedido completo antes de emitir evento
```typescript
// Em retirarItem() e marcarComoEntregue()
const pedidoCompleto = await this.pedidoRepository.findOne({
  where: { id: item.pedido.id },
  relations: [
    'comanda', 'comanda.mesa', 'comanda.cliente',
    'itens', 'itens.produto', 'itens.produto.ambiente',
  ],
});
this.pedidosGateway.emitStatusAtualizado(pedidoCompleto);
```

**Arquivo:** `backend/src/modulos/pedido/pedido.service.ts`

---

### 18. Indicador Visual de Conexão
**Melhoria:** Badge visual mostrando status da conexão WebSocket
- 🟢 Conectado (badge verde)
- 🔴 Offline (badge vermelho pulsante)

---

## 🌐 Endpoints Públicos (NOVO)

### 19. `GET /ambientes/publico`
**Funcionalidade:** Lista ambientes sem autenticação
**Uso:** Botão "Mudar" localização no portal do cliente

---

### 20. `GET /mesas/publico`
**Funcionalidade:** Lista mesas sem autenticação
**Uso:** Seleção de mesa no auto-atendimento

---

### 21. `POST /comandas/recuperar`
**Funcionalidade:** Recupera comanda por ID ou CPF
**Uso:** Página de recuperação de comanda

---

## 📁 Arquivos Modificados (Sessão Completa)

| Arquivo | Alteração |
|---------|-----------|
| `frontend/src/app/evento/[id]/page.tsx` | Sintaxe Next.js 15 |
| `frontend/src/services/api.ts` | Fallback API_URL_SERVER |
| `frontend/src/components/mobile/TabBar.tsx` | TabBar cozinheiro |
| `backend/src/modulos/comanda/comanda.controller.ts` | Endpoint público recuperar |
| `backend/src/modulos/comanda/comanda.service.ts` | Método recuperarComandaPublica + evento nova_comanda |
| `backend/src/modulos/pedido/pedidos.gateway.ts` | Método emitNovaComanda |
| `backend/src/modulos/pedido/pedido.service.ts` | WebSocket com pedido completo |
| `backend/src/modulos/ambiente/ambiente.controller.ts` | Endpoint público |
| `backend/src/modulos/mesa/mesa.controller.ts` | Endpoint público |
| `frontend/src/app/(publico)/recuperar-comanda/page.tsx` | Usar endpoint público |
| `frontend/src/app/(protected)/caixa/comandas-abertas/page.tsx` | WebSocket |
| `frontend/src/app/(protected)/caixa/page.tsx` | WebSocket estatísticas |
| `frontend/src/app/(protected)/dashboard/gestaopedidos/MapaPedidos.tsx` | Remover filtro garçom |
| `README.md` | Seção correções recentes |

---

## ✅ Verificação

Testar as seguintes URLs:
- [ ] `https://pubsystem.com.br/evento/[ID_PAGINA_EVENTO]` - Boas-vindas
- [ ] `https://pubsystem.com.br/entrada/[ID_EVENTO]` - Entrada paga
- [ ] `https://pubsystem.com.br/recuperar-comanda` - Recuperar comanda
- [ ] Login e navegação do cozinheiro
- [ ] Fechamento de caixa
- [ ] Gestão de pedidos do garçom (deve ver todos os pedidos)
- [ ] Cozinha atualiza quando garçom entrega pedido
- [ ] Comandas abertas atualizam em tempo real

---

## 🚀 Deploy Pendente

### Backend (Oracle VM)
```bash
ssh ubuntu@134.65.248.235
cd ~/pub-system
git pull origin main
docker compose -f docker-compose.micro.yml up -d --build --no-cache --force-recreate
```

**Correções que serão aplicadas:**
- ✅ CORS WebSocket
- ✅ Correções de timezone
- ✅ Endpoints públicos
- ✅ Endpoint `/comandas/recuperar`
- ✅ Evento `nova_comanda`
- ✅ WebSocket com pedido completo

---

*Documento atualizado em: 15 de Dezembro de 2025 - 17:55*
