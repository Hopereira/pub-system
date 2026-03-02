# Issue #1: [F0.1] Implementação do TenantContext e Tipagem Global

**Data:** 18 de dezembro de 2025  
**Sprint:** Multi-tenancy  
**Status:** ✅ Implementado

---

## 📖 Descrição (PO)

Como plataforma SaaS, precisamos de um local centralizado e imutável para armazenar a identidade do inquilino durante todo o ciclo de vida da requisição, impedindo que os dados se misturem entre os bares.

---

## 💻 Implementação Técnica

### Arquivos Criados

```
backend/src/common/tenant/
├── index.ts                          # Exports centralizados
├── tenant.types.ts                   # Tipos e validações
├── tenant-context.service.ts         # Serviço principal (Scope.REQUEST)
├── tenant-context.service.spec.ts    # Testes unitários
├── tenant-logging.interceptor.ts     # Interceptor para logs
└── tenant.module.ts                  # Módulo global
```

### TenantContextService

```typescript
@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  // Métodos principais
  setTenantId(id: string, tenantName?: string): void
  getTenantId(): TenantId
  getTenantIdOrNull(): TenantId | null
  getTenantName(): string | undefined
  hasTenant(): boolean
  getContext(): Readonly<ITenantContext> | null
}
```

**Características:**
- ✅ **Escopo REQUEST:** Nova instância para cada requisição HTTP
- ✅ **Imutável:** Tenant não pode ser alterado após definido
- ✅ **Thread-safe:** Isolamento garantido entre requisições
- ✅ **Tipagem forte:** `TenantId` é um branded type (não aceita `any`)

### Tipagem Global

```typescript
// Branded type para evitar uso de any
type TenantId = string & { readonly __brand: 'TenantId' };

// Funções de validação
function createTenantId(id: string): TenantId  // Valida UUID
function isValidTenantId(id: unknown): id is TenantId

// Erro específico
class TenantNotSetError extends Error
```

### TenantLoggingInterceptor

Adiciona `tenant_id` em todos os logs para facilitar troubleshooting:

```
[tenant:550e8400-e29b-41d4-a716-446655440000] 📥 GET /produtos | IP: 192.168.1.1
[tenant:550e8400-e29b-41d4-a716-446655440000] 📤 GET /produtos | 45ms | OK
```

Para rotas públicas:
```
[tenant:public] 📥 GET /auth/login | IP: 192.168.1.1
```

---

## 🚀 Infraestrutura (DevOps)

### Logs PM2

O `TenantLoggingInterceptor` garante que todos os logs incluam o `tenant_id`:

```javascript
// ecosystem.config.js (PM2)
module.exports = {
  apps: [{
    name: 'pub-system-backend',
    script: 'dist/main.js',
    // Logs já incluem tenant_id automaticamente via interceptor
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
  }]
};
```

---

## ✅ Critérios de Aceitação (QA)

### 1. getTenantId deve retornar erro se tentarem acessar antes de definir

```typescript
// ✅ PASSA
it('deve lançar TenantNotSetError se tenant não foi definido', () => {
  const service = new TenantContextService();
  expect(() => service.getTenantId()).toThrow(TenantNotSetError);
});
```

### 2. Contexto deve ser isolado entre requisições simultâneas

```typescript
// ✅ PASSA - Teste de concorrência
it('deve manter contextos isolados entre instâncias', async () => {
  const service1 = await module.resolve<TenantContextService>(TenantContextService);
  const service2 = await module.resolve<TenantContextService>(TenantContextService);

  service1.setTenantId('tenant-1');
  service2.setTenantId('tenant-2');

  expect(service1.getTenantId()).toBe('tenant-1');
  expect(service2.getTenantId()).toBe('tenant-2');
});
```

### 3. Imutabilidade após definição

```typescript
// ✅ PASSA
it('deve lançar erro se tentar alterar tenant já definido', () => {
  service.setTenantId('tenant-1');
  expect(() => service.setTenantId('tenant-2')).toThrow(
    /Tentativa de alterar tenant já definido/
  );
});
```

---

## 📊 Testes Implementados

| Teste | Status |
|-------|--------|
| Definir tenant ID corretamente | ✅ |
| Definir tenant ID com nome | ✅ |
| Erro ao alterar tenant já definido | ✅ |
| Erro para UUID inválido | ✅ |
| Erro para ID vazio | ✅ |
| TenantNotSetError se não definido | ✅ |
| getTenantIdOrNull retorna null | ✅ |
| hasTenant retorna false/true | ✅ |
| getContext retorna cópia imutável | ✅ |
| Isolamento entre requisições | ✅ |
| 10 instâncias simultâneas | ✅ |

**Total:** 11 testes

---

## 🔧 Como Usar

### 1. Importar o módulo (já é global)

```typescript
// app.module.ts
import { TenantModule } from './common/tenant';

@Module({
  imports: [
    TenantModule, // Adicionar aos imports
    // ...
  ],
})
export class AppModule {}
```

### 2. Usar em qualquer serviço

```typescript
import { TenantContextService } from './common/tenant';

@Injectable()
export class ProdutoService {
  constructor(private readonly tenantContext: TenantContextService) {}

  async findAll() {
    const tenantId = this.tenantContext.getTenantId();
    return this.produtoRepository.find({
      where: { empresaId: tenantId }
    });
  }
}
```

### 3. Configurar o interceptor de logs

```typescript
// main.ts
import { TenantLoggingInterceptor } from './common/tenant';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Adicionar interceptor global
  app.useGlobalInterceptors(
    app.get(TenantLoggingInterceptor)
  );
  
  await app.listen(3000);
}
```

---

## 🔜 Próximos Passos

1. **Issue #2:** Criar `TenantMiddleware` para extrair tenant do JWT/header
2. **Issue #3:** Criar `TenantGuard` para validar acesso ao tenant
3. **Issue #4:** Integrar com TypeORM (filtro automático por tenant)

---

## 📁 Arquivos

- `backend/src/common/tenant/tenant.types.ts`
- `backend/src/common/tenant/tenant-context.service.ts`
- `backend/src/common/tenant/tenant-context.service.spec.ts`
- `backend/src/common/tenant/tenant-logging.interceptor.ts`
- `backend/src/common/tenant/tenant.module.ts`
- `backend/src/common/tenant/index.ts`

**Commit:** Pendente
