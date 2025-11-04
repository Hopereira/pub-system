---
name: Sistema de Entrega de Pedidos
about: Implementar rastreamento de entregas por garçom
title: '[FEATURE] Sistema de Entrega de Pedidos com Rastreamento'
labels: feature, backend, frontend, garçom, priority-high
assignees: ''
---

## 📦 Descrição
Implementar sistema para garçom marcar entregas de pedidos, registrando quem entregou, quando e onde.

## 🎯 Objetivo
Permitir que garçons marquem pedidos como entregues e criar histórico de entregas para análise de desempenho.

## 📋 Tarefas

### Backend
- [ ] Criar entidade `EntregaPedido`
- [ ] Criar migration para tabela `entregas_pedido`
- [ ] Criar DTO `MarcarEntregaDto`
- [ ] Implementar service `EntregaPedidoService`
- [ ] Criar endpoint `POST /pedidos/:id/entregar`
- [ ] Criar endpoint `GET /pedidos/:id/entregas`
- [ ] Calcular tempo de entrega automaticamente
- [ ] Emitir evento WebSocket quando entregue

### Frontend
- [ ] Adicionar botão "Marcar como Entregue"
- [ ] Criar modal de confirmação
- [ ] Mostrar quem entregou cada pedido
- [ ] Exibir tempo de entrega
- [ ] Atualizar em tempo real via WebSocket
- [ ] Toast de sucesso

## 🏗️ Estrutura Técnica

```typescript
@Entity('entregas_pedido')
export class EntregaPedido {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Pedido)
  pedido: Pedido;

  @ManyToOne(() => Funcionario)
  garcom: Funcionario;

  @Column()
  dataEntrega: Date;

  @Column({ type: 'int' })
  tempoEntrega: number; // minutos

  @Column({ type: 'text', nullable: true })
  observacao: string;
}
```

## ✅ Critérios de Aceite
- [ ] Garçom marca pedido como entregue
- [ ] Sistema registra quem entregou
- [ ] Tempo calculado automaticamente
- [ ] Status muda para ENTREGUE
- [ ] Notificação WebSocket enviada
- [ ] Frontend atualiza em tempo real

## ⏱️ Estimativa
**5 dias**
