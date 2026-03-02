# 🎯 Sprint 2-2: Invalidação Automática de Cache

**Data de Planejamento:** 17 de Dezembro de 2025  
**Sprint:** 2-2  
**Estimativa:** 4-6 horas  
**Status:** 📋 **PLANEJADO**

**Dependências:**
- ✅ Sprint 1-2: Paginação e Cache em Produtos
- ✅ Sprint 2-1: Expansão de Paginação e Cache

---

## 🎯 Objetivo

Implementar invalidação automática de cache quando dados são criados, atualizados ou deletados, garantindo que o cache sempre reflita o estado atual do banco de dados.

---

## 🔍 Problema Atual

### Cenário de Inconsistência

**Situação:**
1. Cliente consulta `/produtos?page=1` → Cache MISS → Dados salvos no cache (TTL: 15min)
2. Admin cria novo produto via POST `/produtos`
3. Cliente consulta `/produtos?page=1` novamente → Cache HIT → **Produto novo NÃO aparece**
4. Cliente só verá o novo produto após 15 minutos (quando cache expirar)

**Impacto:**
- ❌ Dados desatualizados para usuários
- ❌ Confusão (produto criado mas não aparece)
- ❌ Experiência ruim (precisa esperar TTL)
- ❌ Possíveis bugs em produção

### Endpoints Afetados

| Endpoint | Operação | Cache Afetado | TTL Atual |
|----------|----------|---------------|-----------|
| `POST /produtos` | Create | `produtos:*` | 15 min |
| `PATCH /produtos/:id` | Update | `produtos:*` | 15 min |
| `DELETE /produtos/:id` | Delete | `produtos:*` | 15 min |
| `POST /comandas` | Create | `comandas:*` | 5 min |
| `PATCH /comandas/:id` | Update | `comandas:*` | 5 min |
| `POST /comandas/:id/fechar` | Close | `comandas:*`, `mesas:*` | 5 min |
| `POST /pedidos` | Create | `pedidos:*` | 2 min |
| `PATCH /pedidos/item/:id/status` | Update | `pedidos:*` | 2 min |
| `POST /ambientes` | Create | `ambientes:*` | 10 min |
| `PATCH /ambientes/:id` | Update | `ambientes:*` | 10 min |
| `DELETE /ambientes/:id` | Delete | `ambientes:*` | 10 min |
| `POST /mesas` | Create | `mesas:*` | 3 min |
| `PATCH /mesas/:id` | Update | `mesas:*` | 3 min |
| `DELETE /mesas/:id` | Delete | `mesas:*` | 3 min |

---

## 🏗️ Arquitetura da Solução

### Abordagem 1: Interceptor Global (Recomendada)

**Vantagens:**
- ✅ Centralizado (um único ponto de controle)
- ✅ Automático (não precisa lembrar de invalidar)
- ✅ Consistente (sempre funciona)
- ✅ Fácil de testar

**Desvantagens:**
- ⚠️ Pode invalidar mais do que necessário
- ⚠️ Precisa de configuração por endpoint

**Implementação:**
```typescript
// backend/src/common/interceptors/cache-invalidation.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, route } = request;

    return next.handle().pipe(
      tap(async () => {
        // Invalidar cache após operação bem-sucedida
        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
          await this.invalidateCacheForRoute(route.path);
        }
      }),
    );
  }

  private async invalidateCacheForRoute(routePath: string): Promise<void> {
    const invalidationMap = {
      '/produtos': ['produtos:*'],
      '/produtos/:id': ['produtos:*'],
      '/comandas': ['comandas:*', 'mesas:*'],
      '/comandas/:id': ['comandas:*', 'mesas:*'],
      '/comandas/:id/fechar': ['comandas:*', 'mesas:*'],
      '/pedidos': ['pedidos:*'],
      '/pedidos/item/:id/status': ['pedidos:*'],
      '/ambientes': ['ambientes:*', 'produtos:*'], // Produtos dependem de ambientes
      '/ambientes/:id': ['ambientes:*', 'produtos:*'],
      '/mesas': ['mesas:*'],
      '/mesas/:id': ['mesas:*'],
    };

    const patterns = invalidationMap[routePath] || [];
    
    for (const pattern of patterns) {
      const keys = await this.cacheManager.store.keys(pattern);
      for (const key of keys) {
        await this.cacheManager.del(key);
        console.log(`🗑️ Cache invalidado: ${key}`);
      }
    }
  }
}
```

### Abordagem 2: Decorator Customizado

**Vantagens:**
- ✅ Granular (controle fino por método)
- ✅ Explícito (fica claro o que invalida)
- ✅ Flexível (pode invalidar múltiplos padrões)

**Desvantagens:**
- ⚠️ Manual (precisa adicionar em cada método)
- ⚠️ Pode esquecer de adicionar
- ⚠️ Mais código repetido

**Implementação:**
```typescript
// backend/src/common/decorators/invalidate-cache.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const CACHE_INVALIDATION_KEY = 'cache_invalidation';

export const InvalidateCache = (...patterns: string[]) => 
  SetMetadata(CACHE_INVALIDATION_KEY, patterns);

// Uso no controller:
@Post()
@InvalidateCache('produtos:*')
async create(@Body() createProdutoDto: CreateProdutoDto) {
  return this.produtoService.create(createProdutoDto);
}

@Patch(':id')
@InvalidateCache('produtos:*')
async update(@Param('id') id: string, @Body() updateProdutoDto: UpdateProdutoDto) {
  return this.produtoService.update(id, updateProdutoDto);
}
```

### Abordagem 3: Service Layer (Híbrida)

**Vantagens:**
- ✅ Controle total (lógica complexa de invalidação)
- ✅ Testável (fácil de mockar)
- ✅ Reutilizável (pode ser chamado de qualquer lugar)

**Desvantagens:**
- ⚠️ Manual (precisa chamar explicitamente)
- ⚠️ Mais código nos services

**Implementação:**
```typescript
// backend/src/cache/cache-invalidation.service.ts
@Injectable()
export class CacheInvalidationService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async invalidateProdutos(): Promise<void> {
    await this.invalidatePattern('produtos:*');
  }

  async invalidateComandas(): Promise<void> {
    await this.invalidatePattern('comandas:*');
    await this.invalidatePattern('mesas:*'); // Mesas dependem de comandas
  }

  async invalidateAmbientes(): Promise<void> {
    await this.invalidatePattern('ambientes:*');
    await this.invalidatePattern('produtos:*'); // Produtos dependem de ambientes
  }

  private async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.cacheManager.store.keys(pattern);
    for (const key of keys) {
      await this.cacheManager.del(key);
      this.logger.debug(`🗑️ Cache invalidado: ${key}`);
    }
  }
}

// Uso no service:
async create(createProdutoDto: CreateProdutoDto): Promise<Produto> {
  const produto = await this.produtoRepository.save(createProdutoDto);
  await this.cacheInvalidationService.invalidateProdutos();
  return produto;
}
```

---

## 📋 Plano de Implementação

### Fase 1: Infraestrutura (1h)

**1.1 Criar CacheInvalidationService**
- [ ] Criar `backend/src/cache/cache-invalidation.service.ts`
- [ ] Implementar método `invalidatePattern(pattern: string)`
- [ ] Implementar métodos específicos (`invalidateProdutos()`, `invalidateComandas()`, etc.)
- [ ] Adicionar logging detalhado

**1.2 Criar CacheInvalidationInterceptor**
- [ ] Criar `backend/src/common/interceptors/cache-invalidation.interceptor.ts`
- [ ] Implementar lógica de detecção de operações (POST, PATCH, DELETE)
- [ ] Implementar mapa de rotas → padrões de cache
- [ ] Adicionar tratamento de erros

**1.3 Registrar Globalmente**
- [ ] Adicionar interceptor em `app.module.ts`
- [ ] Exportar `CacheInvalidationService` do `CacheModule`

### Fase 2: Implementação por Endpoint (2h)

**2.1 Produtos**
- [ ] `POST /produtos` → Invalidar `produtos:*`
- [ ] `PATCH /produtos/:id` → Invalidar `produtos:*`
- [ ] `DELETE /produtos/:id` → Invalidar `produtos:*`
- [ ] Testar criação, atualização e deleção

**2.2 Comandas**
- [ ] `POST /comandas` → Invalidar `comandas:*`, `mesas:*`
- [ ] `PATCH /comandas/:id` → Invalidar `comandas:*`, `mesas:*`
- [ ] `POST /comandas/:id/fechar` → Invalidar `comandas:*`, `mesas:*`
- [ ] Testar abertura, atualização e fechamento

**2.3 Pedidos**
- [ ] `POST /pedidos` → Invalidar `pedidos:*`
- [ ] `PATCH /pedidos/item/:id/status` → Invalidar `pedidos:*`
- [ ] Testar criação e atualização de status

**2.4 Ambientes**
- [ ] `POST /ambientes` → Invalidar `ambientes:*`, `produtos:*`
- [ ] `PATCH /ambientes/:id` → Invalidar `ambientes:*`, `produtos:*`
- [ ] `DELETE /ambientes/:id` → Invalidar `ambientes:*`, `produtos:*`
- [ ] Testar criação, atualização e deleção

**2.5 Mesas**
- [ ] `POST /mesas` → Invalidar `mesas:*`
- [ ] `PATCH /mesas/:id` → Invalidar `mesas:*`
- [ ] `DELETE /mesas/:id` → Invalidar `mesas:*`
- [ ] Testar criação, atualização e deleção

### Fase 3: Testes e Validação (1h)

**3.1 Testes Unitários**
- [ ] Testar `CacheInvalidationService.invalidatePattern()`
- [ ] Testar métodos específicos de invalidação
- [ ] Mockar `cacheManager` e verificar chamadas

**3.2 Testes de Integração**
- [ ] Criar produto → Verificar cache invalidado
- [ ] Consultar produtos → Cache MISS → Cache criado
- [ ] Atualizar produto → Verificar cache invalidado novamente
- [ ] Consultar produtos → Cache MISS → Cache recriado

**3.3 Testes de Regressão**
- [ ] Verificar que funcionalidades existentes não quebraram
- [ ] Verificar que cache ainda funciona corretamente
- [ ] Verificar logs de invalidação

### Fase 4: Documentação e Deploy (30min)

**4.1 Documentação**
- [ ] Atualizar `2025-12-17-SPRINT-2-2-IMPLEMENTACAO.md`
- [ ] Documentar padrões de invalidação
- [ ] Criar guia de troubleshooting

**4.2 Deploy**
- [ ] Commit e push
- [ ] Deploy em produção
- [ ] Monitorar logs de invalidação

---

## 🧪 Cenários de Teste

### Teste 1: Criar Produto
```bash
# 1. Consultar produtos (Cache MISS)
GET /produtos?page=1&limit=5
# Resposta: 10 produtos

# 2. Criar novo produto
POST /produtos
{
  "nome": "Produto Teste",
  "preco": 50.00,
  "ambienteId": "abc123"
}
# Esperado: Cache invalidado (log: 🗑️ Cache invalidado: produtos:*)

# 3. Consultar produtos novamente (Cache MISS esperado)
GET /produtos?page=1&limit=5
# Resposta: 11 produtos (incluindo o novo)
```

### Teste 2: Fechar Comanda
```bash
# 1. Consultar comandas (Cache MISS)
GET /comandas?page=1
# Resposta: 5 comandas abertas

# 2. Consultar mesas (Cache MISS)
GET /mesas
# Resposta: Mesa 1 OCUPADA

# 3. Fechar comanda
POST /comandas/abc123/fechar
# Esperado: Cache invalidado (comandas:* e mesas:*)

# 4. Consultar comandas novamente (Cache MISS)
GET /comandas?page=1
# Resposta: 4 comandas abertas

# 5. Consultar mesas novamente (Cache MISS)
GET /mesas
# Resposta: Mesa 1 LIVRE
```

### Teste 3: Atualizar Ambiente
```bash
# 1. Consultar ambientes (Cache MISS)
GET /ambientes
# Resposta: 5 ambientes

# 2. Consultar produtos (Cache MISS)
GET /produtos?page=1
# Resposta: 10 produtos

# 3. Atualizar ambiente
PATCH /ambientes/abc123
{
  "nome": "Novo Nome"
}
# Esperado: Cache invalidado (ambientes:* e produtos:*)

# 4. Consultar ambientes novamente (Cache MISS)
GET /ambientes
# Resposta: 5 ambientes (com nome atualizado)

# 5. Consultar produtos novamente (Cache MISS)
GET /produtos?page=1
# Resposta: 10 produtos (com ambiente atualizado)
```

---

## 📊 Mapa de Dependências de Cache

```
produtos:*
  ↑
  └── Depende de: ambientes:*
      (Produto tem ambiente)

comandas:*
  ↑
  ├── Afeta: mesas:*
  │   (Comanda aberta = mesa ocupada)
  └── Afeta: pedidos:*
      (Pedidos pertencem a comandas)

mesas:*
  ↑
  └── Depende de: comandas:*
      (Status da mesa depende de comanda)

pedidos:*
  ↑
  └── Depende de: comandas:*
      (Pedidos pertencem a comandas)

ambientes:*
  ↑
  └── Afeta: produtos:*
      (Produtos pertencem a ambientes)
```

**Regra de Invalidação em Cascata:**
- Atualizar **ambiente** → Invalidar `ambientes:*` + `produtos:*`
- Criar/Fechar **comanda** → Invalidar `comandas:*` + `mesas:*`
- Criar **pedido** → Invalidar `pedidos:*`

---

## 🎯 Métricas de Sucesso

### KPIs
- ✅ **100%** dos endpoints de escrita invalidam cache
- ✅ **0** inconsistências de dados após operações
- ✅ **< 50ms** tempo de invalidação
- ✅ **100%** cobertura de testes

### Logs Esperados
```
[CacheInvalidationService] 🗑️ Cache invalidado: produtos:page:1:limit:20:sort:nome:ASC
[CacheInvalidationService] 🗑️ Cache invalidado: produtos:page:2:limit:20:sort:nome:ASC
[CacheInvalidationService] 🗑️ Cache invalidado: produtos:page:1:limit:5:sort:preco:DESC
[CacheInvalidationService] ✅ Total de chaves invalidadas: 3
```

---

## 🚨 Riscos e Mitigações

### Risco 1: Performance
**Problema:** Invalidar muitas chaves pode ser lento  
**Mitigação:** 
- Usar `SCAN` ao invés de `KEYS` em produção
- Invalidar em background (não bloquear request)
- Limitar número de chaves por padrão

### Risco 2: Invalidação Excessiva
**Problema:** Invalidar mais do que necessário  
**Mitigação:**
- Padrões específicos (ex: `produtos:amb:abc123:*` ao invés de `produtos:*`)
- Monitorar taxa de Cache MISS
- Ajustar TTL se necessário

### Risco 3: Esquecer de Invalidar
**Problema:** Novo endpoint criado sem invalidação  
**Mitigação:**
- Interceptor global (automático)
- Testes de integração
- Code review checklist

---

## 📚 Referências

- [Redis KEYS vs SCAN](https://redis.io/commands/scan/)
- [NestJS Interceptors](https://docs.nestjs.com/interceptors)
- [Cache Invalidation Strategies](https://aws.amazon.com/caching/best-practices/)

---

## ✅ Checklist de Implementação

### Infraestrutura
- [ ] Criar `CacheInvalidationService`
- [ ] Criar `CacheInvalidationInterceptor`
- [ ] Registrar globalmente em `app.module.ts`
- [ ] Adicionar logging

### Endpoints
- [ ] Produtos (create, update, delete)
- [ ] Comandas (create, update, fechar)
- [ ] Pedidos (create, updateStatus)
- [ ] Ambientes (create, update, delete)
- [ ] Mesas (create, update, delete)

### Testes
- [ ] Testes unitários do service
- [ ] Testes de integração por endpoint
- [ ] Testes de regressão
- [ ] Verificar logs de invalidação

### Documentação
- [ ] Documentar implementação
- [ ] Criar guia de troubleshooting
- [ ] Atualizar README

### Deploy
- [ ] Commit e push
- [ ] Deploy em produção
- [ ] Monitorar em produção

---

**Sprint 2-2 planejada para 4-6 horas de implementação!** 🚀
