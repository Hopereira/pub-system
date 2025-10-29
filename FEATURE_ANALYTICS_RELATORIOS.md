# 📊 Feature: Sistema de Analytics e Relatórios

**Data:** 29/10/2025  
**Branch:** `210-gestao-pedidos-dashboard`  
**Status:** 🚧 Em Desenvolvimento

---

## 🎯 Objetivo

Criar um sistema completo de analytics e relatórios para gestão de pedidos, permitindo que administradores e gerentes visualizem métricas detalhadas sobre:

1. **Tempos de Pedidos**
   - Tempo desde criação até preparo
   - Tempo de preparo por ambiente
   - Tempo de entrega
   - Tempo total

2. **Performance de Garçons**
   - Quem entregou mais pedidos
   - Quem entregou menos pedidos
   - Tempo médio de entrega por garçom
   - Última entrega

3. **Performance de Ambientes**
   - Qual ambiente mais preparou pedidos
   - Tempo médio de preparo por ambiente
   - Pedidos em preparo no momento

4. **Análise de Produtos**
   - Produtos mais vendidos
   - Produtos menos vendidos
   - Quantidade e valor total
   - Última venda

5. **Análises Temporais**
   - Pedidos por hora do dia
   - Pedidos por dia da semana
   - Tendências e padrões

---

## 📁 Estrutura de Arquivos

### Backend

```
backend/src/modulos/pedido/
├── dto/
│   └── analytics.dto.ts                    ✅ Criado
├── pedido-analytics.service.ts             ✅ Criado
├── pedido-analytics.controller.ts          ✅ Criado
└── pedido.module.ts                        ✅ Atualizado
```

### Frontend

```
frontend/src/
├── types/
│   └── analytics.ts                        ✅ Criado
├── services/
│   └── analyticsService.ts                 ✅ Criado
├── components/
│   └── analytics/
│       └── MetricCard.tsx                  ✅ Criado
└── app/(protected)/dashboard/
    └── relatorios/
        └── page.tsx                        🚧 Pendente
```

---

## 🔧 Backend

### DTOs Criados

```typescript
// analytics.dto.ts
export class PedidoTempoDto {
  pedidoId: string;
  criadoEm: Date;
  tempoPreparoMinutos?: number;
  tempoEntregaMinutos?: number;
  tempoTotalMinutos?: number;
  ambiente?: string;
  status: string;
}

export class GarcomPerformanceDto {
  funcionarioId: string;
  funcionarioNome: string;
  totalPedidosEntregues: number;
  tempoMedioEntregaMinutos: number;
  ultimaEntrega?: Date;
}

export class AmbientePerformanceDto {
  ambienteId: string;
  ambienteNome: string;
  totalPedidosPreparados: number;
  tempoMedioPreparoMinutos: number;
  pedidosEmPreparo: number;
}

export class ProdutoVendasDto {
  produtoId: string;
  produtoNome: string;
  quantidadeVendida: number;
  valorTotal: number;
  ultimaVenda?: Date;
}

export class RelatorioGeralDto {
  periodo: { inicio: Date; fim: Date; };
  resumo: {
    totalPedidos: number;
    totalItens: number;
    valorTotal: number;
    tempoMedioPreparo: number;
    tempoMedioEntrega: number;
  };
  garcons: GarcomPerformanceDto[];
  ambientes: AmbientePerformanceDto[];
  produtosMaisVendidos: ProdutoVendasDto[];
  produtosMenosVendidos: ProdutoVendasDto[];
  pedidosPorHora: { hora: number; quantidade: number; }[];
  pedidosPorDiaSemana: { dia: string; quantidade: number; }[];
}
```

### Endpoints Criados

#### 1. GET `/analytics/pedidos/relatorio-geral`
**Permissões:** ADMIN, GERENTE

**Query Params:**
- `dataInicio` (opcional): Data inicial do período
- `dataFim` (opcional): Data final do período
- `ambienteId` (opcional): Filtrar por ambiente
- `funcionarioId` (opcional): Filtrar por funcionário
- `limite` (opcional): Limite de resultados (padrão: 10)

**Resposta:** `RelatorioGeralDto`

**Exemplo:**
```bash
GET /analytics/pedidos/relatorio-geral?dataInicio=2025-10-01&dataFim=2025-10-29&limite=5
```

#### 2. GET `/analytics/pedidos/tempos`
**Permissões:** ADMIN, GERENTE, GARCOM

**Query Params:**
- `dataInicio` (opcional): Data inicial
- `dataFim` (opcional): Data final
- `limite` (opcional): Limite de resultados (padrão: 50)

**Resposta:** `PedidoTempoDto[]`

**Exemplo:**
```bash
GET /analytics/pedidos/tempos?limite=20
```

---

## 🎨 Frontend

### Serviço de Analytics

```typescript
// analyticsService.ts
export const getRelatorioGeral = async (filtro?: FiltroRelatorio): Promise<RelatorioGeral>
export const getTemposPedidos = async (filtro?: FiltroRelatorio): Promise<PedidoTempo[]>
```

### Componentes

#### MetricCard
Componente reutilizável para exibir métricas com ícone e valor.

**Props:**
- `title`: Título da métrica
- `value`: Valor principal
- `subtitle`: Texto secundário
- `trend`: Tendência (ex: "+12% vs. ontem")
- `icon`: Ícone Lucide
- `iconColor`: Cor do ícone
- `iconBgColor`: Cor de fundo do ícone

**Exemplo de Uso:**
```tsx
<MetricCard
  title="Vendas do Dia"
  value="R$ 4250,00"
  subtitle="Atualizado em tempo real"
  trend="↑ 12% vs. ontem"
  icon={DollarSign}
  iconColor="text-green-600"
  iconBgColor="bg-green-100"
/>
```

---

## 📊 Métricas Implementadas

### 1. Resumo Geral
- ✅ Total de pedidos
- ✅ Total de itens
- ✅ Valor total
- ✅ Tempo médio de preparo
- ✅ Tempo médio de entrega

### 2. Performance de Garçons
- ✅ Total de pedidos entregues por garçom
- ✅ Tempo médio de entrega por garçom
- ✅ Última entrega
- ✅ Ordenação por mais entregas

### 3. Performance de Ambientes
- ✅ Total de pedidos preparados por ambiente
- ✅ Tempo médio de preparo por ambiente
- ✅ Pedidos em preparo no momento
- ✅ Ordenação por mais pedidos

### 4. Produtos
- ✅ Top 10 produtos mais vendidos
- ✅ Top 10 produtos menos vendidos
- ✅ Quantidade vendida
- ✅ Valor total por produto
- ✅ Última venda

### 5. Análises Temporais
- ✅ Distribuição de pedidos por hora (0-23h)
- ✅ Distribuição por dia da semana
- ✅ Padrões de demanda

---

## 🎯 Próximos Passos

### Pendente

1. **Página de Relatórios** 🚧
   - Criar `/dashboard/relatorios/page.tsx`
   - Layout com cards de métricas
   - Gráficos de visualização
   - Filtros de período

2. **Componentes de Visualização** 🚧
   - Gráfico de barras (produtos)
   - Gráfico de linha (pedidos por hora)
   - Gráfico de pizza (por dia da semana)
   - Tabela de garçons
   - Tabela de ambientes

3. **Filtros Avançados** 🚧
   - Seletor de data (range)
   - Filtro por ambiente
   - Filtro por garçom
   - Filtro por produto

4. **Exportação** 🚧
   - Exportar para PDF
   - Exportar para Excel
   - Exportar para CSV

5. **Agendamento** 🚧
   - Relatórios automáticos por email
   - Configurar frequência (diário, semanal, mensal)

---

## 🧪 Testes

### Backend

```bash
# Teste 1: Relatório geral dos últimos 30 dias
curl -X GET "http://localhost:3000/analytics/pedidos/relatorio-geral" \
  -H "Authorization: Bearer TOKEN"

# Teste 2: Relatório com filtro de data
curl -X GET "http://localhost:3000/analytics/pedidos/relatorio-geral?dataInicio=2025-10-01&dataFim=2025-10-29" \
  -H "Authorization: Bearer TOKEN"

# Teste 3: Tempos de pedidos
curl -X GET "http://localhost:3000/analytics/pedidos/tempos?limite=10" \
  -H "Authorization: Bearer TOKEN"
```

### Frontend

```bash
# Acessar página de relatórios
http://localhost:3001/dashboard/relatorios

# Verificar:
✅ Cards de métricas aparecem
✅ Dados são carregados
✅ Filtros funcionam
✅ Gráficos renderizam
```

---

## 📈 Métricas de Sucesso

1. **Performance**
   - Tempo de carregamento < 2s
   - Queries otimizadas com índices

2. **Usabilidade**
   - Interface intuitiva
   - Filtros fáceis de usar
   - Visualizações claras

3. **Precisão**
   - Cálculos corretos de tempos
   - Dados consistentes
   - Sem duplicações

---

## 🔒 Segurança

- ✅ Endpoints protegidos com JWT
- ✅ Validação de roles (ADMIN, GERENTE)
- ✅ Sanitização de inputs
- ✅ Rate limiting (futuro)

---

## 📚 Documentação Relacionada

- `RESUMO_SESSAO_WEBSOCKET.md` - WebSocket e atualizações em tempo real
- `CORRECAO_WEBSOCKET_SUPERVISAO.md` - Supervisão de pedidos
- `CORRECAO_ATUALIZACAO_AUTOMATICA_PEDIDOS.md` - Painel operacional

---

**Status Atual:** 🚧 Backend completo, Frontend em desenvolvimento  
**Próximo:** Criar página de relatórios com visualizações
