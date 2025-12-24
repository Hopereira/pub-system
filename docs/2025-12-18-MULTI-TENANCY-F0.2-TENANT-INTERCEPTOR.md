# Issue #2: [F0.2] TenantInterceptor - Captura Híbrida (Staff vs Cliente)

**Data:** 18 de dezembro de 2025  
**Sprint:** Multi-tenancy  
**Status:** ✅ Implementado

---

## 📖 Descrição (PO)

Precisamos que o sistema identifique automaticamente qual bar está sendo acessado, seja pelo subdomínio (uso interno do staff) ou pelo slug na URL (uso do cliente via QR Code).

---

## 💻 Implementação Técnica

### Arquivos Criados/Modificados

```
backend/src/common/tenant/
├── tenant-resolver.service.ts        # Resolve slug/ID para tenant
├── tenant-resolver.service.spec.ts   # Testes do resolver
├── tenant.interceptor.ts             # Captura híbrida
├── tenant.module.ts                  # Atualizado com novos providers
└── index.ts                          # Exports atualizados

backend/src/modulos/empresa/entities/
└── empresa.entity.ts                 # Adicionado slug e ativo

backend/src/database/migrations/
└── 1765462000000-AddSlugToEmpresas.ts # Migration para slug
```

### Fluxo de Captura Híbrida

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUISIÇÃO HTTP                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣ SUBDOMÍNIO (Staff)                                      │
│     bar-do-ze.pubsystem.com.br                              │
│     ↓                                                       │
│     Extrai: "bar-do-ze"                                     │
│     ↓                                                       │
│     Busca no banco por slug                                 │
│                                                             │
│  2️⃣ SLUG NA URL (Cliente via QR Code)                       │
│     pubsystem.com/menu/bar-do-ze                            │
│     ↓                                                       │
│     Extrai: "bar-do-ze"                                     │
│     ↓                                                       │
│     Busca no banco por slug                                 │
│                                                             │
│  3️⃣ JWT (Rotas Protegidas)                                  │
│     Authorization: Bearer eyJ...                            │
│     ↓                                                       │
│     Extrai: empresaId do payload                            │
│     ↓                                                       │
│     Busca no banco por ID                                   │
│                                                             │
│  4️⃣ HEADER (API Externa)                                    │
│     X-Tenant-ID: uuid-do-tenant                             │
│     ↓                                                       │
│     Busca no banco por ID                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Prioridade de Resolução

| Prioridade | Fonte | Uso |
|------------|-------|-----|
| 1 | Subdomínio | Staff interno |
| 2 | Slug na URL | Cliente via QR Code |
| 3 | JWT payload | Rotas protegidas |
| 4 | Header X-Tenant-ID | Integrações externas |

### TenantResolverService

```typescript
@Injectable()
export class TenantResolverService {
  // Resolve por slug (subdomínio ou URL)
  async resolveBySlug(slug: string): Promise<ResolvedTenant>
  
  // Resolve por ID (JWT)
  async resolveById(id: string): Promise<ResolvedTenant>
  
  // Extrai slug do hostname
  extractSlugFromHostname(hostname: string): string | null
  
  // Extrai slug do path
  extractSlugFromPath(path: string): string | null
}
```

### TenantInterceptor

```typescript
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    // 1. Tentar subdomínio
    // 2. Tentar slug na URL
    // 3. Tentar JWT
    // 4. Tentar header
    // 5. Validar JWT vs URL (segurança)
    // 6. Definir contexto
  }
}
```

---

## 🚀 Configuração Nginx (DevOps)

### Subdomínios Curinga

```nginx
# /etc/nginx/sites-available/pubsystem.conf

# Servidor principal
server {
    listen 80;
    listen 443 ssl http2;
    
    # Aceita subdomínios curinga
    server_name pubsystem.com.br *.pubsystem.com.br;
    
    ssl_certificate /etc/letsencrypt/live/pubsystem.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pubsystem.com.br/privkey.pem;
    
    # Proxy para o backend
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Proxy para o frontend
    location / {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Certificado SSL Wildcard (Let's Encrypt)

```bash
# Gerar certificado wildcard
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d pubsystem.com.br \
  -d *.pubsystem.com.br

# Renovação automática
sudo certbot renew --dry-run
```

### DNS (Cloudflare/Route53)

```
# Registros DNS necessários
A       pubsystem.com.br        -> IP_DO_SERVIDOR
A       *.pubsystem.com.br      -> IP_DO_SERVIDOR (wildcard)
CNAME   www.pubsystem.com.br    -> pubsystem.com.br
```

---

## ✅ Critérios de Aceitação (QA)

### 1. Subdomínio define contexto

```bash
# ✅ PASSA
curl -H "Host: bar-do-ze.pubsystem.com.br" http://localhost:3000/produtos
# Logs: [tenant:uuid-bar-do-ze] 📥 GET /produtos
```

### 2. Slug na URL define mesmo contexto

```bash
# ✅ PASSA
curl http://localhost:3000/menu/bar-do-ze/produtos
# Logs: [tenant:uuid-bar-do-ze] 📥 GET /menu/bar-do-ze/produtos
```

### 3. Subdomínio inexistente retorna 404

```bash
# ✅ PASSA
curl -H "Host: bar-inexistente.pubsystem.com.br" http://localhost:3000/produtos
# Response: { "statusCode": 404, "message": "Estabelecimento não encontrado: bar-inexistente" }
```

### 4. Tenant inativo retorna 404

```bash
# ✅ PASSA
# (tenant com ativo=false no banco)
curl -H "Host: bar-fechado.pubsystem.com.br" http://localhost:3000/produtos
# Response: { "statusCode": 404, "message": "Estabelecimento não disponível: bar-fechado" }
```

### 5. JWT vs URL mismatch retorna 401

```bash
# ✅ PASSA
# JWT com empresaId=A, acessando subdomínio do tenant B
curl -H "Host: bar-b.pubsystem.com.br" \
     -H "Authorization: Bearer TOKEN_DO_TENANT_A" \
     http://localhost:3000/produtos
# Response: { "statusCode": 401, "message": "Acesso negado: você não tem permissão..." }
```

---

## 📊 Testes Implementados

| Teste | Status |
|-------|--------|
| Resolver tenant por slug | ✅ |
| Normalizar slug para lowercase | ✅ |
| NotFoundException se não encontrado | ✅ |
| NotFoundException se inativo | ✅ |
| Cache na segunda chamada | ✅ |
| Resolver tenant por ID | ✅ |
| Extrair slug de subdomínio | ✅ |
| Extrair slug de path /menu/ | ✅ |
| Extrair slug de path /evento/ | ✅ |
| Ignorar subdomínios especiais (www, api) | ✅ |
| Invalidar cache | ✅ |

**Total:** 11+ testes

---

## 🎨 Página de Erro (Frontend)

```tsx
// frontend/src/app/estabelecimento-nao-encontrado/page.tsx

export default function EstabelecimentoNaoEncontrado() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800">404</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mt-4">
          Estabelecimento não encontrado
        </h2>
        <p className="text-gray-500 mt-2">
          O bar ou restaurante que você está procurando não existe ou não está disponível.
        </p>
        <a href="https://pubsystem.com.br" className="mt-6 inline-block bg-primary text-white px-6 py-3 rounded-lg">
          Voltar ao início
        </a>
      </div>
    </div>
  );
}
```

---

## 🔧 Como Usar

### 1. Registrar o interceptor globalmente

```typescript
// main.ts
import { TenantInterceptor } from './common/tenant';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Registrar interceptor global
  app.useGlobalInterceptors(app.get(TenantInterceptor));
  
  await app.listen(3000);
}
```

### 2. Acessar tenant em qualquer serviço

```typescript
import { TenantContextService } from './common/tenant';

@Injectable()
export class ProdutoService {
  constructor(private readonly tenantContext: TenantContextService) {}

  async findAll() {
    const tenantId = this.tenantContext.getTenantId();
    // Filtrar por tenant automaticamente
    return this.produtoRepository.find({
      where: { empresaId: tenantId }
    });
  }
}
```

---

## 🔜 Próximos Passos

| Issue | Descrição |
|-------|-----------|
| **#3** | TenantGuard - Validar permissões por tenant |
| **#4** | Integração TypeORM - Filtro automático por tenant |
| **#5** | Middleware de redirecionamento para página de erro |

---

## 📁 Arquivos

- `backend/src/common/tenant/tenant-resolver.service.ts`
- `backend/src/common/tenant/tenant-resolver.service.spec.ts`
- `backend/src/common/tenant/tenant.interceptor.ts`
- `backend/src/common/tenant/tenant.module.ts`
- `backend/src/common/tenant/index.ts`
- `backend/src/modulos/empresa/entities/empresa.entity.ts`
- `backend/src/database/migrations/1765462000000-AddSlugToEmpresas.ts`

**Commit:** Pendente
