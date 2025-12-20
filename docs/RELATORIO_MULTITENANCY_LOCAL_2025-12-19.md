# Relatório: Configuração Multi-Tenancy Local

**Data:** 19 de Dezembro de 2025  
**Objetivo:** Configurar e validar o ambiente local para testes de multi-tenancy com subdomínios

---

## 1. Resumo Executivo

Sessão focada em configurar o ambiente local para simular multi-tenancy via subdomínios (`*.pubsystem.test`), criar tenants de teste e corrigir bugs de isolamento de dados.

**Status Final:** ✅ COMPLETO

---

## 2. Correções Implementadas

### 2.1. CORS para Subdomínios Locais

**Arquivo:** `backend/src/main.ts` (linhas 60-66)

**Problema:** Requisições de `bar-do-ze.pubsystem.test:3001` eram bloqueadas por CORS.

**Solução:**
```typescript
if (
  allowedOrigins.includes(origin) || 
  origin.endsWith('.vercel.app') || 
  origin.endsWith('.pubsystem.com.br') ||
  origin.endsWith('.pubsystem.test') ||  // Multi-tenancy local
  origin.includes('pubsystem.test')      // pubsystem.test:3001
) {
  return callback(null, true);
}
```

---

### 2.2. Prioridade do TenantId no Login

**Arquivo:** `backend/src/auth/auth.service.ts` (linha 63)

**Problema:** O `user.empresaId` era usado antes de `user.tenantId`, causando uso do ID errado.

**Antes:**
```typescript
const effectiveTenantId = tenantId || contextTenantId || user.empresaId || user.tenantId;
```

**Depois:**
```typescript
const effectiveTenantId = tenantId || contextTenantId || user.tenantId || user.empresaId;
```

---

### 2.3. TenantResolverService - Busca por tenant_id

**Arquivo:** `backend/src/common/tenant/tenant-resolver.service.ts` (método `resolveById`)

**Problema:** O método buscava empresa pelo `id` da empresa, mas o JWT contém o `tenantId` da tabela `tenants`.

**Solução:** Alterado para buscar primeiro por `tenantId`, com fallback para `id`:
```typescript
// Buscar empresa pelo tenant_id (não pelo id da empresa)
const empresa = await this.empresaRepository.findOne({
  where: { tenantId: id },
  select: ['id', 'slug', 'nomeFantasia', 'ativo', 'tenantId'],
});

if (!empresa) {
  // Fallback: tentar buscar pelo id da empresa (compatibilidade)
  const empresaById = await this.empresaRepository.findOne({
    where: { id },
    // ...
  });
}
```

---

### 2.4. EmpresaService - Isolamento por Tenant

**Arquivo:** `backend/src/modulos/empresa/empresa.service.ts`

**Problema:** O serviço não filtrava empresas por tenant, retornando a primeira empresa do banco.

**Solução:**
1. Adicionado `Scope.REQUEST` ao serviço
2. Injetado `REQUEST` para acessar `request.user.tenantId`
3. Implementado fallbacks para obter tenantId:

```typescript
@Injectable({ scope: Scope.REQUEST })
export class EmpresaService {
  constructor(
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @Optional() private readonly tenantContext?: TenantContextService,
    @Optional() @Inject(REQUEST) private readonly request?: any,
  ) {}

  async findOne(): Promise<Empresa> {
    let tenantId: string | null = null;
    
    // 1. TenantContextService
    try {
      tenantId = this.tenantContext?.getTenantId?.() ?? null;
    } catch {}
    
    // 2. request.user.tenantId (JWT)
    if (!tenantId && this.request?.user?.tenantId) {
      tenantId = this.request.user.tenantId;
    }
    
    // 3. request.tenant.id (TenantInterceptor)
    if (!tenantId && this.request?.tenant?.id) {
      tenantId = this.request.tenant.id;
    }

    const whereClause = tenantId ? { tenantId } : {};
    const empresa = await this.empresaRepository.findOneBy(whereClause);
    // ...
  }
}
```

---

### 2.5. AuditService - TenantId em Logs

**Arquivo:** `backend/src/modulos/audit/audit.service.ts`

**Problema:** Erro `NOT NULL constraint` ao criar log de auditoria sem `tenantId`.

**Solução:**
```typescript
async log(dto: CreateAuditLogDto): Promise<AuditLog> {
  const tenantId = dto.tenantId || dto.funcionario?.tenantId || null;
  
  const auditLog = this.auditLogRepository.create({
    ...dto,
    funcionarioEmail: dto.funcionario?.email || dto.funcionarioEmail,
    tenantId,
  });
  // ...
}
```

**Nota:** A coluna `tenant_id` em `audit_logs` foi alterada para `NULLABLE` temporariamente:
```sql
ALTER TABLE audit_logs ALTER COLUMN tenant_id DROP NOT NULL;
```

---

### 2.6. Tema Padrão - Modo Claro

**Arquivo:** `frontend/src/app/layout.tsx` (linha 27)

**Antes:**
```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
```

**Depois:**
```tsx
<ThemeProvider attribute="class" defaultTheme="light" enableSystem>
```

---

## 3. Dados de Teste Criados

### 3.1. Tenants

| ID | Nome | Slug | Plano |
|----|------|------|-------|
| `48ac7710-2f39-497b-8d29-a70952054221` | Hebert O Pereira | hebert-o-pereira | FREE |
| `d59f1c41-2427-45a9-8104-ba73e062ab2c` | Bar do Ze | bar-do-ze | BASIC |
| `33561e5a-ff60-4aa5-82d7-496ded76a134` | Pub da Hora | pub-da-hora | PRO |

### 3.2. Empresas

| ID | Nome | Slug | Tenant ID |
|----|------|------|-----------|
| `48ac7710-...` | Hebert O Pereira | hebert-o-pereira | `48ac7710-...` |
| `094b3097-1e23-45cf-88a2-4aa643592034` | Bar do Ze | bar-do-ze | `d59f1c41-...` |
| `8baa4486-d14b-4961-888d-5d38f302de97` | Pub da Hora | pub-da-hora | `33561e5a-...` |

### 3.3. Usuários de Teste

| Email | Nome | Cargo | Tenant | Senha |
|-------|------|-------|--------|-------|
| `admin@admin.com` | Administrador Padrão | ADMIN | Hebert O Pereira | `admin123` |
| `admin@bardoze.com` | Admin Bar do Ze | ADMIN | Bar do Ze | `admin123` |
| `admin@pubdahora.com` | Admin Pub da Hora | ADMIN | Pub da Hora | `admin123` |

---

## 4. Configuração do Ambiente Local

### 4.1. Arquivo Hosts

**Localização:** `C:\Windows\System32\drivers\etc\hosts`

**Entradas adicionadas:**
```
# PubSystem Multi-Tenancy Local
127.0.0.1  pubsystem.test
127.0.0.1  admin.pubsystem.test
127.0.0.1  bar-do-ze.pubsystem.test
127.0.0.1  pub-da-hora.pubsystem.test
127.0.0.1  boteco-do-joao.pubsystem.test
# End PubSystem
```

### 4.2. Scripts Criados

- `scripts/setup-local-hosts.ps1` - Configura arquivo hosts (requer Admin)
- `scripts/setup-ssl-mkcert.ps1` - Gera certificados SSL locais
- `scripts/create-test-empresas.sql` - SQL para criar dados de teste

---

## 5. URLs de Acesso

| URL | Tenant | Usuário |
|-----|--------|---------|
| `http://localhost:3001` | Padrão (Hebert) | `admin@admin.com` |
| `http://bar-do-ze.pubsystem.test:3001` | Bar do Zé | `admin@bardoze.com` |
| `http://pub-da-hora.pubsystem.test:3001` | Pub da Hora | `admin@pubdahora.com` |

---

## 6. Problemas Conhecidos / Pendências

### 6.1. Cache Redis
- O cache pode armazenar dados sem filtro de tenant
- **Solução temporária:** Executar `docker exec pub_system_redis redis-cli FLUSHALL` ao trocar de tenant

### 6.2. Coluna audit_logs.tenant_id
- Alterada para NULLABLE temporariamente
- **TODO:** Criar migration para reverter após garantir que todos os logs tenham tenantId

### 6.3. Outros Services
- Verificar se outros services (MesaService, ProdutoService, etc.) precisam da mesma correção do EmpresaService
- O `BaseTenantRepository` já implementa os fallbacks, mas services que usam `createQueryBuilder` diretamente podem precisar de ajustes

---

## 7. Comandos Úteis

```powershell
# Limpar cache Redis
docker exec pub_system_redis redis-cli FLUSHALL

# Verificar dados por tenant
docker exec pub_system_db psql -U postgres -d pub_system_db -c "SELECT t.nome, COUNT(p.id) as pedidos FROM tenants t LEFT JOIN pedidos p ON p.tenant_id = t.id GROUP BY t.nome;"

# Testar login via API
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"admin@bardoze.com","senha":"admin123"}'
```

---

## 8. Arquivos Modificados

| Arquivo | Tipo de Alteração |
|---------|-------------------|
| `backend/src/main.ts` | CORS |
| `backend/src/auth/auth.service.ts` | Prioridade tenantId |
| `backend/src/common/tenant/tenant-resolver.service.ts` | Busca por tenant_id |
| `backend/src/modulos/empresa/empresa.service.ts` | Scope.REQUEST + fallbacks |
| `backend/src/modulos/audit/audit.service.ts` | TenantId em logs |
| `frontend/src/app/layout.tsx` | Tema padrão light |
| `scripts/setup-local-hosts.ps1` | Novo arquivo |
| `scripts/setup-ssl-mkcert.ps1` | Novo arquivo |
| `scripts/create-test-empresas.sql` | Novo arquivo |
| `docs/SETUP_LOCAL_MULTITENANCY.md` | Documentação |

---

## 9. Próximos Passos Sugeridos

1. [ ] Revisar outros services para garantir isolamento por tenant
2. [ ] Criar migration para reverter `audit_logs.tenant_id` para NOT NULL
3. [ ] Implementar cache com chave por tenant (`ambientes:{tenantId}:all`)
4. [ ] Testar WebSocket isolation com dois browsers diferentes
5. [ ] Configurar Nginx local para simular produção
6. [ ] Gerar certificados SSL com mkcert para HTTPS local

---

**Autor:** Cascade AI  
**Revisado por:** [Pendente]
