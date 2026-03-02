# Issues #4 e #5: BaseTenantRepository e TenantGuard

**Data:** 18 de dezembro de 2025  
**Sprint:** Multi-tenancy  
**Status:** ✅ Implementado

---

## 📖 Descrição

### Issue #4: BaseTenantRepository - Enforcement Automático
Garantir que nenhum desenvolvedor consiga realizar uma busca no banco de dados sem filtrar pelo `tenant_id`, mitigando o risco de vazamento de dados entre bares.

### Issue #5: TenantGuard - Bloqueio de Acesso Cross-Tenant
Impedir que um usuário autenticado no Bar A tente acessar recursos do Bar B através de manipulação de URL/subdomínio.

---

## 💻 Implementação Técnica

### Arquivos Criados

```
backend/src/common/tenant/
├── repositories/
│   ├── base-tenant.repository.ts       # Repositório base com filtro automático
│   └── base-tenant.repository.spec.ts  # 12 testes
└── guards/
    ├── tenant.guard.ts                 # Guard de bloqueio cross-tenant
    └── tenant.guard.spec.ts            # 10 testes
```

---

## 🔒 BaseTenantRepository

### Métodos Sobrescritos (com filtro automático)

| Método | Descrição |
|--------|-----------|
| `find(options?)` | Busca múltiplos registros |
| `findOne(options)` | Busca um registro |
| `findById(id)` | Busca por ID |
| `findOneOrFail(options)` | Busca ou lança exceção |
| `count(options?)` | Conta registros |
| `exists(options)` | Verifica existência |
| `findAndCount(options?)` | Busca com paginação |

### Métodos de Escrita (com tenant automático)

| Método | Descrição |
|--------|-----------|
| `save(entity)` | Salva com tenant_id automático |
| `saveMany(entities)` | Salva múltiplos |
| `create(entityLike)` | Cria entidade (sem salvar) |
| `update(id, partial)` | Atualiza com verificação de tenant |
| `delete(id)` | Remove com verificação de tenant |
| `softDelete(id)` | Soft delete com verificação |

### QueryBuilder com Filtro

```typescript
// Query já inicia com WHERE tenant_id = ?
const produtos = await this.produtoRepository
  .createQueryBuilder('produto')
  .andWhere('produto.preco > :preco', { preco: 10 })
  .getMany();

// SQL gerado:
// SELECT * FROM produtos produto 
// WHERE produto.tenant_id = 'uuid-do-tenant' 
// AND produto.preco > 10
```

### Exemplo de Uso

```typescript
@Injectable()
export class ProdutoRepository extends BaseTenantRepository<Produto> {
  constructor(
    @InjectRepository(Produto) repository: Repository<Produto>,
    tenantContext: TenantContextService,
  ) {
    super(repository, tenantContext);
  }
}

// No service:
@Injectable()
export class ProdutoService {
  constructor(private readonly produtoRepository: ProdutoRepository) {}

  async findAll() {
    // Automaticamente filtrado pelo tenant do contexto
    return this.produtoRepository.find();
  }

  async findById(id: string) {
    // Retorna null se produto pertence a outro tenant
    return this.produtoRepository.findById(id);
  }

  async create(dto: CreateProdutoDto) {
    // tenant_id é preenchido automaticamente
    return this.produtoRepository.save(dto);
  }
}
```

---

## 🛡️ TenantGuard

### Fluxo de Validação

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUISIÇÃO HTTP                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣ Usuário autenticado?                                    │
│     └── NÃO → Permitir (JwtAuthGuard cuida)                 │
│     └── SIM → Continuar                                     │
│                                                             │
│  2️⃣ Tenant no contexto?                                     │
│     └── NÃO → Permitir (rota pública)                       │
│     └── SIM → Continuar                                     │
│                                                             │
│  3️⃣ Usuário tem tenant associado?                           │
│     └── NÃO → Permitir (admin global)                       │
│     └── SIM → Continuar                                     │
│                                                             │
│  4️⃣ JWT.empresaId === contexto.tenantId?                    │
│     └── SIM → ✅ PERMITIR                                    │
│     └── NÃO → ❌ 403 FORBIDDEN + LOG DE SEGURANÇA           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Resposta de Erro

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Acesso negado: você não tem permissão para acessar este estabelecimento",
  "details": {
    "reason": "CROSS_TENANT_ACCESS_DENIED",
    "userTenant": "uuid-bar-a",
    "requestedTenant": "uuid-bar-b"
  }
}
```

### Log de Segurança

```
🚨 TENTATIVA DE ACESSO CROSS-TENANT BLOQUEADA!
   Usuário: joao@bara.com (garcom-joao)
   Tenant do usuário: 550e8400-e29b-41d4-a716-446655440001
   Tenant alvo: 550e8400-e29b-41d4-a716-446655440002
   IP: 192.168.1.100
   URL: GET /produtos
```

### Decorator para Pular Validação

```typescript
// Para rotas que não precisam de validação de tenant
@SkipTenantGuard()
@Get('public')
async publicEndpoint() {
  // ...
}
```

---

## ✅ Critérios de Aceitação (QA)

### BaseTenantRepository

| Critério | Status |
|----------|--------|
| Buscar produto de outro tenant retorna 404 | ✅ |
| Todas as queries contêm filtro de tenant | ✅ |
| Save preenche tenant_id automaticamente | ✅ |
| Update/Delete verificam tenant | ✅ |

### TenantGuard

| Critério | Status |
|----------|--------|
| Usuário do Bar A acessando Bar B → 403 | ✅ |
| Log de auditoria registra tentativa | ✅ |
| Usuário do Bar A acessando Bar A → 200 | ✅ |
| Rotas públicas funcionam normalmente | ✅ |

---

## 📊 Testes Implementados

### BaseTenantRepository (12 testes)

- ✅ Adicionar filtro de tenant automaticamente
- ✅ Mesclar filtro com outras condições
- ✅ Adicionar tenant em array where
- ✅ findOne com filtro automático
- ✅ findById retorna null para outro tenant
- ✅ count apenas registros do tenant
- ✅ save adiciona tenant_id automaticamente
- ✅ create com tenant_id
- ✅ createQueryBuilder com filtro
- ✅ Erro ao buscar sem tenant definido
- ✅ Isolamento de dados entre tenants

### TenantGuard (10 testes)

- ✅ Permitir quando tenant coincide
- ✅ Bloquear quando tenant difere
- ✅ Retornar 403 com detalhes
- ✅ Permitir sem usuário autenticado
- ✅ Permitir sem tenant no contexto
- ✅ Permitir usuário sem tenant associado
- ✅ Suportar tenantId como alternativa
- ✅ SkipTenantGuard decorator
- ✅ Cenário: Bar A → Bar B (bloqueado)
- ✅ Cenário: Bar A → Bar A (permitido)

**Total:** 22 testes passando

---

## 🔧 Como Usar

### 1. Aplicar TenantGuard globalmente

```typescript
// main.ts
import { TenantGuard } from './common/tenant';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Aplicar guard globalmente
  app.useGlobalGuards(app.get(TenantGuard));
  
  await app.listen(3000);
}
```

### 2. Ou em controllers específicos

```typescript
import { TenantGuard } from './common/tenant';

@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('produtos')
export class ProdutoController {
  // ...
}
```

### 3. Criar repositório com filtro automático

```typescript
import { BaseTenantRepository } from './common/tenant';

@Injectable()
export class ProdutoRepository extends BaseTenantRepository<Produto> {
  constructor(
    @InjectRepository(Produto) repository: Repository<Produto>,
    tenantContext: TenantContextService,
  ) {
    super(repository, tenantContext);
  }

  // Métodos customizados herdam o filtro
  async findByCategoria(categoria: string) {
    return this.find({ where: { categoria } });
    // Automaticamente: WHERE tenant_id = ? AND categoria = ?
  }
}
```

---

## 🚀 Monitoramento (DevOps)

### Alertas para Full Table Scans

```sql
-- Query para identificar queries sem índice de tenant
SELECT 
  query,
  calls,
  mean_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%FROM produtos%'
  AND query NOT LIKE '%tenant_id%'
ORDER BY calls DESC;
```

### Métricas Prometheus

```yaml
# prometheus.yml
- job_name: 'pubsystem-tenant'
  metrics_path: '/metrics'
  static_configs:
    - targets: ['localhost:3000']
  
# Alertas
groups:
  - name: tenant-security
    rules:
      - alert: CrossTenantAttempt
        expr: increase(cross_tenant_attempts_total[5m]) > 0
        labels:
          severity: critical
```

---

## 📁 Arquivos

- `backend/src/common/tenant/repositories/base-tenant.repository.ts`
- `backend/src/common/tenant/repositories/base-tenant.repository.spec.ts`
- `backend/src/common/tenant/guards/tenant.guard.ts`
- `backend/src/common/tenant/guards/tenant.guard.spec.ts`
- `backend/src/common/tenant/index.ts` (atualizado)
- `backend/src/common/tenant/tenant.module.ts` (atualizado)

**Commit:** Pendente
