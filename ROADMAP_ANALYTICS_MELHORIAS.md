# 🚀 Roadmap: Melhorias de Analytics

**Branch:** `feature/analytics-melhorias-timestamps`  
**Criada em:** 29/10/2025  
**Baseada em:** `210-gestao-pedidos-dashboard`

---

## 📋 Objetivos

Implementar melhorias no sistema de analytics para permitir:
1. Cálculo preciso de tempos de preparo e entrega
2. Rastreamento de performance de garçons
3. Integração completa com APIs de mesas, pedidos e comandas
4. Filtros avançados de data na UI
5. Exportação de relatórios

---

## 🎯 Tarefas

### ✅ Fase 1: Schema do Banco de Dados

#### 1.1 Adicionar Timestamps em ItemPedido
**Arquivo:** `backend/src/modulos/pedido/entities/item-pedido.entity.ts`

```typescript
@UpdateDateColumn({ nullable: true })
preparadoEm: Date;

@UpdateDateColumn({ nullable: true })
entregueEm: Date;
```

**Impacto:**
- Permite calcular tempo exato de preparo
- Permite calcular tempo exato de entrega
- Melhora precisão das métricas

**Migration:**
```sql
ALTER TABLE itens_pedido 
ADD COLUMN preparadoEm TIMESTAMP NULL,
ADD COLUMN entregueEm TIMESTAMP NULL;
```

---

#### 1.2 Criar Relação Funcionário em ItemPedido
**Arquivo:** `backend/src/modulos/pedido/entities/item-pedido.entity.ts`

```typescript
@Column({ name: 'funcionario_entrega_id', type: 'uuid', nullable: true })
funcionarioEntregaId: string;

@ManyToOne(() => Funcionario, { nullable: true, onDelete: 'SET NULL' })
@JoinColumn({ name: 'funcionario_entrega_id' })
funcionarioEntrega: Funcionario;
```

**Impacto:**
- Rastreia quem entregou cada item
- Permite métricas de performance por garçom
- Habilita ranking de entregas

**Migration:**
```sql
ALTER TABLE itens_pedido 
ADD COLUMN funcionario_entrega_id UUID NULL,
ADD CONSTRAINT fk_item_pedido_funcionario 
  FOREIGN KEY (funcionario_entrega_id) 
  REFERENCES funcionarios(id) 
  ON DELETE SET NULL;
```

---

### ✅ Fase 2: Backend - Atualizar Analytics Service

#### 2.1 Implementar getGarcomPerformance
**Arquivo:** `backend/src/modulos/pedido/pedido-analytics.service.ts`

```typescript
private async getGarcomPerformance(
  dataInicio: Date,
  dataFim: Date,
  limite: number,
): Promise<GarcomPerformanceDto[]> {
  const query = this.itemPedidoRepository
    .createQueryBuilder('item')
    .leftJoin('item.pedido', 'pedido')
    .leftJoin('item.funcionarioEntrega', 'funcionario')
    .where('pedido.data BETWEEN :dataInicio AND :dataFim', { dataInicio, dataFim })
    .andWhere('item.status = :status', { status: 'ENTREGUE' })
    .andWhere('funcionario.id IS NOT NULL')
    .select('funcionario.id', 'funcionarioId')
    .addSelect('funcionario.nome', 'funcionarioNome')
    .addSelect('COUNT(DISTINCT pedido.id)', 'totalPedidosEntregues')
    .addSelect(
      'AVG(EXTRACT(EPOCH FROM (item.entregueEm - pedido.data)) / 60)',
      'tempoMedioEntregaMinutos',
    )
    .addSelect('MAX(item.entregueEm)', 'ultimaEntrega')
    .groupBy('funcionario.id')
    .addGroupBy('funcionario.nome')
    .orderBy('"totalPedidosEntregues"', 'DESC')
    .limit(limite);

  const result = await query.getRawMany();

  return result.map((r) => ({
    funcionarioId: r.funcionarioId,
    funcionarioNome: r.funcionarioNome,
    totalPedidosEntregues: parseInt(r.totalPedidosEntregues, 10),
    tempoMedioEntregaMinutos: Math.round(parseFloat(r.tempoMedioEntregaMinutos) || 0),
    ultimaEntrega: r.ultimaEntrega,
  }));
}
```

---

#### 2.2 Implementar calcularTemposPedidos
**Arquivo:** `backend/src/modulos/pedido/pedido-analytics.service.ts`

```typescript
private calcularTemposPedidos(pedidos: Pedido[]): PedidoTempoDto[] {
  return pedidos.map((pedido) => {
    const dto: PedidoTempoDto = {
      pedidoId: pedido.id,
      criadoEm: pedido.data,
      status: pedido.itens[0]?.status || 'DESCONHECIDO',
    };

    // Calcula tempo de preparo (primeiro item pronto)
    const itemPronto = pedido.itens.find((i) => i.preparadoEm);
    if (itemPronto && itemPronto.preparadoEm) {
      const diffMs = itemPronto.preparadoEm.getTime() - pedido.data.getTime();
      dto.tempoPreparoMinutos = Math.round(diffMs / 60000);
    }

    // Calcula tempo de entrega (primeiro item entregue)
    const itemEntregue = pedido.itens.find((i) => i.entregueEm);
    if (itemEntregue && itemEntregue.entregueEm) {
      const diffMs = itemEntregue.entregueEm.getTime() - pedido.data.getTime();
      dto.tempoEntregaMinutos = Math.round(diffMs / 60000);
      dto.tempoTotalMinutos = dto.tempoEntregaMinutos;
    }

    // Ambiente do primeiro item
    if (pedido.itens[0]?.produto?.ambiente) {
      dto.ambiente = pedido.itens[0].produto.ambiente.nome;
    }

    return dto;
  });
}
```

---

### ✅ Fase 3: Backend - Integrar APIs

#### 3.1 API de Mesas
**Endpoint:** `GET /mesas/ocupacao`

```typescript
@Get('ocupacao')
async getOcupacao() {
  const total = await this.mesaRepository.count();
  const ocupadas = await this.mesaRepository.count({
    where: { status: 'OCUPADA' }
  });
  
  return {
    total,
    ocupadas,
    disponiveis: total - ocupadas,
    percentual: (ocupadas / total) * 100
  };
}
```

---

#### 3.2 API de Pedidos Pendentes
**Endpoint:** `GET /pedidos/pendentes/count`

```typescript
@Get('pendentes/count')
async getPendentesCount() {
  return await this.pedidoRepository.count({
    where: {
      itens: {
        status: In(['FEITO', 'EM_PREPARO'])
      }
    }
  });
}
```

---

#### 3.3 API de Comandas Abertas
**Endpoint:** `GET /comandas/abertas/count`

```typescript
@Get('abertas/count')
async getAbertasCount() {
  return await this.comandaRepository.count({
    where: { status: 'ABERTA' }
  });
}
```

---

### ✅ Fase 4: Frontend - Integrar Dashboard

#### 4.1 Atualizar Dashboard com APIs
**Arquivo:** `frontend/src/app/(protected)/dashboard/page.tsx`

```typescript
useEffect(() => {
  const loadDashboardData = async () => {
    try {
      // Analytics
      const relatorio = await getRelatorioGeral({...});
      
      // Mesas
      const mesas = await fetch('/api/mesas/ocupacao').then(r => r.json());
      
      // Pedidos
      const pendentes = await fetch('/api/pedidos/pendentes/count').then(r => r.json());
      
      // Comandas
      const comandas = await fetch('/api/comandas/abertas/count').then(r => r.json());
      
      setMetricas({
        vendasDia: relatorio.resumo.valorTotal,
        tempoMedioPreparo: relatorio.resumo.tempoMedioPreparo,
        mesasOcupadas: mesas.ocupadas,
        totalMesas: mesas.total,
        pedidosPendentes: pendentes,
        comandasAbertas: comandas,
      });
    } catch (error) {
      logger.error('Erro ao carregar dashboard', { error });
    }
  };
  
  loadDashboardData();
}, []);
```

---

### ✅ Fase 5: Frontend - Filtros de Data

#### 5.1 Adicionar Date Range Picker
**Componente:** `frontend/src/components/analytics/DateRangePicker.tsx`

```typescript
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';

export function DateRangePicker({ value, onChange }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, "dd/MM/yyyy")} -{" "}
                {format(value.to, "dd/MM/yyyy")}
              </>
            ) : (
              format(value.from, "dd/MM/yyyy")
            )
          ) : (
            <span>Selecione o período</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
```

---

#### 5.2 Adicionar Filtros Rápidos
**Componente:** Botões de filtro rápido

```typescript
const filtrosRapidos = [
  { label: 'Hoje', dias: 0 },
  { label: 'Última Semana', dias: 7 },
  { label: 'Último Mês', dias: 30 },
  { label: 'Últimos 3 Meses', dias: 90 },
];

<div className="flex gap-2">
  {filtrosRapidos.map((filtro) => (
    <Button
      key={filtro.label}
      variant="outline"
      onClick={() => aplicarFiltroRapido(filtro.dias)}
    >
      {filtro.label}
    </Button>
  ))}
</div>
```

---

### ✅ Fase 6: Exportação de Relatórios

#### 6.1 Exportar para PDF
**Biblioteca:** `jspdf` + `jspdf-autotable`

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportarPDF(relatorio: RelatorioGeral) {
  const doc = new jsPDF();
  
  // Cabeçalho
  doc.setFontSize(18);
  doc.text('Relatório de Analytics', 14, 20);
  
  // Resumo
  doc.setFontSize(12);
  doc.text(`Período: ${formatDate(relatorio.periodo.inicio)} - ${formatDate(relatorio.periodo.fim)}`, 14, 30);
  
  // Tabela de produtos
  autoTable(doc, {
    head: [['Produto', 'Quantidade', 'Valor Total']],
    body: relatorio.produtosMaisVendidos.map(p => [
      p.produtoNome,
      p.quantidadeVendida,
      formatCurrency(p.valorTotal)
    ]),
    startY: 40
  });
  
  doc.save('relatorio-analytics.pdf');
}
```

---

#### 6.2 Exportar para Excel
**Biblioteca:** `xlsx`

```typescript
import * as XLSX from 'xlsx';

export function exportarExcel(relatorio: RelatorioGeral) {
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Resumo
  const wsResumo = XLSX.utils.json_to_sheet([relatorio.resumo]);
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
  
  // Sheet 2: Produtos
  const wsProdutos = XLSX.utils.json_to_sheet(relatorio.produtosMaisVendidos);
  XLSX.utils.book_append_sheet(wb, wsProdutos, 'Produtos');
  
  // Sheet 3: Ambientes
  const wsAmbientes = XLSX.utils.json_to_sheet(relatorio.ambientePerformance);
  XLSX.utils.book_append_sheet(wb, wsAmbientes, 'Ambientes');
  
  XLSX.writeFile(wb, 'relatorio-analytics.xlsx');
}
```

---

## 📊 Checklist de Implementação

### Fase 1: Schema
- [ ] Adicionar `preparadoEm` em ItemPedido
- [ ] Adicionar `entregueEm` em ItemPedido
- [ ] Adicionar `funcionarioEntregaId` em ItemPedido
- [ ] Criar migration
- [ ] Testar migration em dev
- [ ] Atualizar seeds/fixtures

### Fase 2: Backend Analytics
- [ ] Implementar `getGarcomPerformance` com dados reais
- [ ] Implementar `calcularTemposPedidos` com timestamps
- [ ] Atualizar `getAmbientePerformance` com timestamps
- [ ] Testar queries SQL
- [ ] Adicionar testes unitários

### Fase 3: Backend APIs
- [ ] Criar endpoint de ocupação de mesas
- [ ] Criar endpoint de pedidos pendentes
- [ ] Criar endpoint de comandas abertas
- [ ] Adicionar guards de autenticação
- [ ] Documentar endpoints

### Fase 4: Frontend Dashboard
- [ ] Integrar API de mesas
- [ ] Integrar API de pedidos
- [ ] Integrar API de comandas
- [ ] Atualizar cards com dados reais
- [ ] Remover TODOs
- [ ] Adicionar loading states

### Fase 5: Filtros
- [ ] Instalar `react-day-picker`
- [ ] Criar componente DateRangePicker
- [ ] Adicionar filtros rápidos
- [ ] Integrar filtros com analytics
- [ ] Persistir filtros no localStorage
- [ ] Adicionar validações

### Fase 6: Exportação
- [ ] Instalar `jspdf` e `jspdf-autotable`
- [ ] Instalar `xlsx`
- [ ] Implementar exportação PDF
- [ ] Implementar exportação Excel
- [ ] Adicionar botões de exportação
- [ ] Adicionar loading durante exportação
- [ ] Testar com dados grandes

---

## 🎯 Critérios de Sucesso

- ✅ Tempos calculados com precisão de minutos
- ✅ Performance de garçons funcionando
- ✅ Todos os cards do dashboard com dados reais
- ✅ Filtros de data funcionando
- ✅ Exportação PDF e Excel funcionando
- ✅ Sem dados mock no código
- ✅ Testes passando
- ✅ Documentação atualizada

---

## 📅 Estimativa

- **Fase 1:** 2-3 horas
- **Fase 2:** 3-4 horas
- **Fase 3:** 2-3 horas
- **Fase 4:** 2-3 horas
- **Fase 5:** 3-4 horas
- **Fase 6:** 4-5 horas

**Total:** 16-22 horas (~3 dias de trabalho)

---

## 🚀 Começar Por

1. **Fase 1** - Schema (base para tudo)
2. **Fase 2** - Backend Analytics (lógica de negócio)
3. **Fase 3** - Backend APIs (dados complementares)
4. **Fase 4** - Frontend Dashboard (integração)
5. **Fase 5** - Filtros (UX)
6. **Fase 6** - Exportação (funcionalidade extra)

---

**Status:** 📝 Planejamento Completo  
**Próximo Passo:** Implementar Fase 1 (Schema)
