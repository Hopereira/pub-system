# 🔧 Plano de Correção de Bugs - Pub System

**Data:** 23 de outubro de 2025  
**Branch:** `bugfix/analise-erros-logica`  
**Responsável:** Equipe de Desenvolvimento

---

## 📋 Visão Geral

Este documento detalha o plano de ação para corrigir os 23 problemas identificados na análise completa do sistema.

---

## 🎯 Sprint 1 - Correções Críticas (1 semana)

### Objetivo
Corrigir vulnerabilidades de segurança e bugs críticos que podem causar perda de dados ou falhas em produção.

---

### ✅ Tarefa 1.1: Corrigir CORS no WebSocket

**Prioridade:** 🔴 CRÍTICA  
**Tempo Estimado:** 30 minutos  
**Arquivo:** `backend/src/modulos/pedido/pedidos.gateway.ts`

**Mudanças:**
```typescript
// ANTES
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})

// DEPOIS
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
```

**Variável de Ambiente:**
```env
# .env
FRONTEND_URL=http://localhost:3001

# .env.production
FRONTEND_URL=https://seu-dominio.com
```

**Testes:**
- [ ] Verificar conexão WebSocket do frontend
- [ ] Tentar conectar de origem não autorizada (deve falhar)
- [ ] Confirmar notificações funcionando

---

### ✅ Tarefa 1.2: Implementar Transação na Criação de Comanda

**Prioridade:** 🔴 CRÍTICA  
**Tempo Estimado:** 2 horas  
**Arquivo:** `backend/src/modulos/comanda/comanda.service.ts`

**Mudanças:**
```typescript
async create(createComandaDto: CreateComandaDto): Promise<Comanda> {
  const { mesaId, pontoEntregaId, clienteId, paginaEventoId, eventoId, agregados } = createComandaDto;

  // Validações iniciais permanecem as mesmas
  if (mesaId && pontoEntregaId) {
    throw new BadRequestException('A comanda não pode ter mesa E ponto de entrega ao mesmo tempo.');
  }
  
  if (!mesaId && !clienteId) {
    throw new BadRequestException('Comandas sem mesa precisam estar associadas a um cliente.');
  }

  // USAR TRANSAÇÃO COM LOCK
  return await this.comandaRepository.manager.transaction(async (transactionalEntityManager) => {
    let mesa: Mesa | null = null;
    
    if (mesaId) {
      // Lock pessimista para evitar race condition
      mesa = await transactionalEntityManager.findOne(Mesa, {
        where: { id: mesaId },
        lock: { mode: 'pessimistic_write' }
      });
      
      if (!mesa) {
        throw new NotFoundException(`Mesa com ID "${mesaId}" não encontrada.`);
      }
      
      if (!clienteId && mesa.status !== MesaStatus.LIVRE) {
        throw new BadRequestException(`A Mesa ${mesa.numero} já está ocupada.`);
      }
    }

    // Validar cliente
    let cliente: Cliente | null = null;
    if (clienteId) {
      cliente = await transactionalEntityManager.findOne(Cliente, { 
        where: { id: clienteId } 
      });
      
      if (!cliente) {
        throw new NotFoundException(`Cliente com ID "${clienteId}" não encontrado.`);
      }
      
      // Verificar comanda aberta existente
      const comandaAbertaExistente = await transactionalEntityManager.findOne(Comanda, {
        where: { cliente: { id: clienteId }, status: ComandaStatus.ABERTA }
      });
      
      if (comandaAbertaExistente) {
        this.logger.warn(`BLOQUEIO: Cliente ${clienteId} tentou criar nova comanda, mas já possui comanda aberta: ${comandaAbertaExistente.id}.`);
        throw new BadRequestException(
          `O Cliente "${cliente.nome}" já possui uma comanda aberta (ID: ${comandaAbertaExistente.id}). Por favor, feche a comanda anterior.`
        );
      }
    }

    // Validar página de evento
    let paginaEvento: PaginaEvento | null = null;
    if (paginaEventoId) {
      paginaEvento = await transactionalEntityManager.findOne(PaginaEvento, { 
        where: { id: paginaEventoId } 
      });
      if (!paginaEvento) {
        this.logger.warn(`Página de Evento com ID "${paginaEventoId}" não encontrada.`);
      }
    }

    // Validar ponto de entrega
    let pontoEntrega: PontoEntrega | null = null;
    if (pontoEntregaId) {
      pontoEntrega = await transactionalEntityManager.findOne(PontoEntrega, { 
        where: { id: pontoEntregaId } 
      });
      if (!pontoEntrega) {
        throw new NotFoundException(`Ponto de entrega com ID "${pontoEntregaId}" não encontrado.`);
      }
      if (!pontoEntrega.ativo) {
        throw new BadRequestException(`O ponto de entrega "${pontoEntrega.nome}" está desativado.`);
      }
    }

    // Criar comanda
    const comanda = transactionalEntityManager.create(Comanda, {
      mesa,
      cliente,
      pontoEntrega,
      paginaEvento,
      status: ComandaStatus.ABERTA,
    });

    const novaComanda = await transactionalEntityManager.save(comanda);

    // Criar agregados
    if (agregados && agregados.length > 0) {
      const agregadosEntities = agregados.map((agr, index) =>
        transactionalEntityManager.create(ComandaAgregado, {
          comandaId: novaComanda.id,
          nome: agr.nome,
          cpf: agr.cpf,
          ordem: index + 1,
        })
      );
      await transactionalEntityManager.save(agregadosEntities);
      this.logger.log(`✅ ${agregados.length} agregado(s) adicionado(s) à comanda ${novaComanda.id}`);
    }

    // Adicionar entrada do evento
    if (eventoId) {
      const evento = await transactionalEntityManager.findOne(Evento, { 
        where: { id: eventoId } 
      });
      
      if (evento && evento.valor > 0) {
        this.logger.log(`Adicionando entrada de R$ ${evento.valor} do evento "${evento.titulo}" à comanda ${novaComanda.id}`);
        
        const itemEntrada = transactionalEntityManager.create(ItemPedido, {
          produto: null,
          quantidade: 1,
          precoUnitario: evento.valor,
          observacao: `Couvert Artístico - ${evento.titulo}`,
          status: PedidoStatus.ENTREGUE,
        });

        const pedidoEntrada = transactionalEntityManager.create(Pedido, {
          comanda: novaComanda,
          itens: [itemEntrada],
          total: evento.valor,
          status: PedidoStatus.ENTREGUE,
        });
        
        await transactionalEntityManager.save(itemEntrada);
        await transactionalEntityManager.save(pedidoEntrada);
      }
    }

    // Atualizar status da mesa
    if (mesa) {
      mesa.status = MesaStatus.OCUPADA;
      await transactionalEntityManager.save(mesa);
    }
    
    return novaComanda;
  });
  
  // Recarregar comanda com todas as relações
  return this.findOne(novaComanda.id);
}
```

**Testes:**
- [ ] Criar comanda normal
- [ ] Tentar criar 2 comandas simultâneas para mesma mesa (deve falhar)
- [ ] Verificar rollback em caso de erro
- [ ] Testar com evento (entrada)
- [ ] Testar com agregados

---

### ✅ Tarefa 1.3: Remover URL Hardcoded

**Prioridade:** 🔴 CRÍTICA  
**Tempo Estimado:** 15 minutos  
**Arquivo:** `frontend/src/services/authService.ts`

**Mudanças:**
```typescript
// ANTES
const API_URL = 'http://localhost:3000';

// DEPOIS
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
```

**Testes:**
- [ ] Login funcionando em desenvolvimento
- [ ] Verificar que usa variável de ambiente em produção

---

### ✅ Tarefa 1.4: Adicionar Validação de Quantidade Máxima

**Prioridade:** 🔴 CRÍTICA  
**Tempo Estimado:** 30 minutos  
**Arquivo:** `backend/src/modulos/pedido/dto/create-pedido.dto.ts`

**Mudanças:**
```typescript
import { Max } from 'class-validator';

export class CreateItemPedidoDto {
  @ApiProperty({ description: 'ID do produto que está a ser pedido.' })
  @IsUUID()
  produtoId: string;

  @ApiProperty({ 
    description: 'Quantidade do produto a ser pedida.',
    minimum: 1,
    maximum: 100
  })
  @IsNumber()
  @IsPositive()
  @Max(100, { message: 'Quantidade máxima é 100 unidades por item' })
  quantidade: number;

  @ApiProperty({ description: 'Observação opcional para o item.', required: false })
  @IsString()
  @IsOptional()
  observacao?: string;
}
```

**Testes:**
- [ ] Criar pedido com quantidade 1 (sucesso)
- [ ] Criar pedido com quantidade 100 (sucesso)
- [ ] Criar pedido com quantidade 101 (deve falhar)
- [ ] Criar pedido com quantidade 0 (deve falhar)
- [ ] Criar pedido com quantidade negativa (deve falhar)

---

### ✅ Tarefa 1.5: Corrigir Cálculo de Total com Decimal

**Prioridade:** 🔴 CRÍTICA  
**Tempo Estimado:** 1 hora  
**Arquivos:** 
- `backend/src/modulos/pedido/pedido.service.ts`
- `backend/src/modulos/comanda/comanda.service.ts`

**Instalar Dependência:**
```bash
cd backend
npm install decimal.js
npm install --save-dev @types/decimal.js
```

**Mudanças em `pedido.service.ts`:**
```typescript
import Decimal from 'decimal.js';

async create(createPedidoDto: CreatePedidoDto): Promise<Pedido> {
  // ... código existente ...

  const itensPedido = await Promise.all(itensPedidoPromise);
  
  // USAR DECIMAL PARA CÁLCULOS MONETÁRIOS
  const total = itensPedido.reduce((sum, item) => {
    const itemTotal = new Decimal(item.quantidade).times(new Decimal(item.precoUnitario));
    return sum.plus(itemTotal);
  }, new Decimal(0));
  
  const pedido = this.pedidoRepository.create({
    comanda,
    itens: itensPedido,
    total: total.toNumber(),  // Converte de volta para number
    status: PedidoStatus.FEITO,
  });

  // ... resto do código ...
}
```

**Mudanças em `comanda.service.ts`:**
```typescript
import Decimal from 'decimal.js';

async findOne(id: string): Promise<Comanda> {
  // ... código existente ...

  let totalComandaCalculado = new Decimal(0);
  
  if (comanda.pedidos) {
    comanda.pedidos.forEach(pedido => {
      const totalPedidoCalculado = pedido.itens.reduce((sum, item) => {
        if (item.status !== PedidoStatus.CANCELADO) {
          const itemTotal = new Decimal(item.precoUnitario).times(new Decimal(item.quantidade));
          return sum.plus(itemTotal);
        }
        return sum;
      }, new Decimal(0));
      
      pedido.total = totalPedidoCalculado.toNumber();
      totalComandaCalculado = totalComandaCalculado.plus(totalPedidoCalculado);
    });
  }
  
  (comanda as any).total = totalComandaCalculado.toNumber();
  
  return comanda;
}
```

**Testes:**
- [ ] Criar pedido com valores decimais (ex: 12.50)
- [ ] Criar pedido com múltiplos itens
- [ ] Verificar total da comanda
- [ ] Testar com valores grandes (ex: 999999.99)
- [ ] Verificar precisão (não deve perder centavos)

---

## 🎯 Sprint 2 - Correções Importantes (2 semanas)

### ✅ Tarefa 2.1: Remover Polling Redundante

**Prioridade:** 🟠 MÉDIA  
**Tempo Estimado:** 1 hora  
**Arquivo:** `frontend/src/app/(protected)/dashboard/operacional/[ambienteId]/OperacionalClientPage.tsx`

**Mudanças:**
```typescript
// Adicionar estado de conexão no hook
export function useAmbienteNotification(ambienteId: string) {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    // ... código existente ...
    
    socket.on('connect', () => {
      setIsConnected(true);
      logger.log('🔌 Conectado ao ambiente', { socketId: socket.id, ambienteId });
    });
    
    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      logger.warn('Desconectado do WebSocket', { ambienteId, reason });
    });
    
    // ... resto do código ...
  }, [ambienteId]);
  
  return { 
    novoPedidoId, 
    audioConsentNeeded, 
    handleAllowAudio,
    clearNotification,
    isConnected  // Novo retorno
  };
}

// No componente
export function OperacionalClientPage({ ambienteId }: { ambienteId: string }) {
  const { 
    novoPedidoId, 
    audioConsentNeeded, 
    handleAllowAudio,
    isConnected 
  } = useAmbienteNotification(ambienteId);

  useEffect(() => {
    fetchDados();
    
    // Polling apenas se WebSocket desconectado
    if (!isConnected) {
      const intervalId = setInterval(fetchDados, 30000);
      return () => clearInterval(intervalId);
    }
  }, [ambienteId, isConnected]);
  
  // ... resto do código ...
}
```

**Testes:**
- [ ] Verificar que não há polling quando WebSocket conectado
- [ ] Desconectar WebSocket e verificar que polling inicia
- [ ] Reconectar WebSocket e verificar que polling para

---

### ✅ Tarefa 2.2: Adicionar Debounce na Busca

**Prioridade:** 🟠 MÉDIA  
**Tempo Estimado:** 30 minutos  
**Arquivo:** `frontend/src/app/(protected)/dashboard/operacional/caixa/page.tsx`

**Instalar Dependência:**
```bash
cd frontend
npm install use-debounce
```

**Mudanças:**
```typescript
import { useDebouncedCallback } from 'use-debounce';

export default function CaixaPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useDebouncedCallback(
    async (value: string) => {
      setIsSearching(true);
      try {
        const results = await searchComandas(value);
        setComandas(results);
      } catch (error) {
        console.error('Erro na busca:', error);
        toast.error('Falha ao buscar comandas');
      } finally {
        setIsSearching(false);
      }
    },
    500  // 500ms de debounce
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  return (
    <div>
      <Input 
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Buscar por nome, CPF ou mesa..."
      />
      {isSearching && <Loader2 className="animate-spin" />}
      {/* ... resto do componente ... */}
    </div>
  );
}
```

**Testes:**
- [ ] Digitar rapidamente e verificar que só faz 1 requisição
- [ ] Verificar loading state durante busca
- [ ] Testar com termo vazio

---

### ✅ Tarefa 2.3: Remover Senha do Console

**Prioridade:** 🟠 MÉDIA  
**Tempo Estimado:** 15 minutos  
**Arquivo:** `frontend/src/services/authService.ts`

**Mudanças:**
```typescript
export const login = async (email: string, senha: string) => {
  try {
    // Remover log de senha ou mascarar
    if (process.env.NODE_ENV === 'development') {
      console.log('Enviando para a API:', { email, senha: '***' });
    }

    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      senha,
    });

    return response.data;
  } catch (error: any) {
    // Não logar senha em erro também
    console.error('Falha na autenticação:', error.response?.status);
    
    if (error.response) {
      const errorMessage = Array.isArray(error.response.data.message)
        ? error.response.data.message.join(',')
        : error.response.data.message;
      throw new Error(errorMessage || 'Credenciais inválidas');
    }
    throw new Error('Não foi possível conectar ao servidor.');
  }
};
```

**Testes:**
- [ ] Verificar que senha não aparece no console
- [ ] Login ainda funciona normalmente

---

### ✅ Tarefa 2.4: Adicionar Timeout em Requisições

**Prioridade:** 🟠 MÉDIA  
**Tempo Estimado:** 15 minutos  
**Arquivo:** `frontend/src/services/api.ts`

**Mudanças:**
```typescript
const api = axios.create({
  baseURL: isServer
    ? process.env.API_URL_SERVER
    : process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,  // 30 segundos
});

export const publicApi = axios.create({
  baseURL: isServer
    ? process.env.API_URL_SERVER
    : process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,  // 30 segundos
});
```

**Testes:**
- [ ] Simular requisição lenta (deve dar timeout após 30s)
- [ ] Verificar mensagem de erro apropriada

---

### ✅ Tarefa 2.5: Implementar Paginação

**Prioridade:** 🟠 MÉDIA  
**Tempo Estimado:** 3 horas  
**Arquivos:** 
- `backend/src/modulos/pedido/pedido.service.ts`
- `backend/src/modulos/pedido/pedido.controller.ts`
- `backend/src/modulos/pedido/dto/pagination.dto.ts` (novo)

**Criar DTO de Paginação:**
```typescript
// backend/src/modulos/pedido/dto/pagination.dto.ts
import { IsOptional, IsPositive, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

**Atualizar Service:**
```typescript
async findAll(
  ambienteId?: string,
  paginationDto?: PaginationDto
): Promise<PaginatedResult<Pedido>> {
  const { page = 1, limit = 50 } = paginationDto || {};
  
  const queryBuilder = this.pedidoRepository.createQueryBuilder('pedido')
    .leftJoinAndSelect('pedido.comanda', 'comanda')
    .leftJoinAndSelect('comanda.mesa', 'mesa')
    .leftJoinAndSelect('pedido.itens', 'itemPedido')
    .leftJoinAndSelect('itemPedido.produto', 'produto')
    .leftJoinAndSelect('produto.ambiente', 'ambiente')
    .where('itemPedido.status IN (:...statuses)', {
      statuses: [PedidoStatus.FEITO, PedidoStatus.EM_PREPARO, PedidoStatus.PRONTO, PedidoStatus.DEIXADO_NO_AMBIENTE]
    })
    .orderBy('pedido.data', 'ASC')
    .skip((page - 1) * limit)
    .take(limit);

  if (ambienteId) {
    queryBuilder.andWhere('ambiente.id = :ambienteId', { ambienteId });
  }

  const [data, total] = await queryBuilder.getManyAndCount();
  
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

**Atualizar Controller:**
```typescript
@Get()
async findAll(
  @Query('ambienteId') ambienteId?: string,
  @Query() paginationDto?: PaginationDto,
) {
  return this.pedidoService.findAll(ambienteId, paginationDto);
}
```

**Testes:**
- [ ] Buscar página 1 com 10 itens
- [ ] Buscar página 2
- [ ] Verificar total de páginas
- [ ] Testar com limite máximo (100)
- [ ] Testar com valores inválidos

---

## 🎯 Sprint 3 - Melhorias (1 mês)

### Tarefas Planejadas

1. **Adicionar Índices no Banco** (1 dia)
2. **Melhorar Tratamento de Erros** (2 dias)
3. **Implementar Retry Logic** (1 dia)
4. **Adicionar Cache com React Query** (3 dias)
5. **Implementar Soft Delete** (2 dias)
6. **Adicionar Validação de CPF** (1 dia)
7. **Implementar Rate Limiting** (1 dia)
8. **Adicionar Health Check** (1 dia)
9. **Melhorar UX com Animações** (2 dias)
10. **Adicionar Testes Automatizados** (5 dias)

---

## 📊 Checklist de Verificação

### Antes de Cada Deploy

- [ ] Todos os testes passando
- [ ] Nenhum console.log em produção
- [ ] Variáveis de ambiente configuradas
- [ ] CORS configurado corretamente
- [ ] Migrations executadas
- [ ] Backup do banco realizado
- [ ] Health check funcionando
- [ ] Logs estruturados ativos

### Após Cada Deploy

- [ ] Verificar logs de erro
- [ ] Monitorar performance
- [ ] Testar funcionalidades críticas
- [ ] Verificar WebSocket conectando
- [ ] Confirmar notificações funcionando

---

## 🚀 Comandos Úteis

### Desenvolvimento
```bash
# Backend
cd backend
npm run start:dev

# Frontend
cd frontend
npm run dev

# Executar migrations
cd backend
npm run typeorm:migration:run

# Criar nova migration
npm run typeorm:migration:generate -- src/database/migrations/NomeDaMigration
```

### Testes
```bash
# Backend
cd backend
npm run test
npm run test:e2e
npm run test:cov

# Frontend
cd frontend
npm run test
```

### Build
```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm start
```

---

## 📞 Contatos

**Dúvidas Técnicas:** pereira_hebert@msn.com  
**Telefone:** (24) 99828-5751

---

**Última Atualização:** 23 de outubro de 2025
