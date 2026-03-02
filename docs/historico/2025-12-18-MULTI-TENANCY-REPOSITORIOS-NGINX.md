# Multi-tenancy: Repositórios Tenant-Aware e Configuração Nginx

**Data:** 18 de dezembro de 2025  
**Sprint:** Multi-tenancy  
**Status:** ✅ Implementado

---

## 📖 Descrição

Implementação de repositórios tenant-aware para garantir isolamento automático de dados e configuração do Nginx para subdomínios curinga.

---

## 💻 Repositórios Criados

### Estrutura

```
backend/src/modulos/
├── ambiente/
│   └── ambiente.repository.ts
├── cliente/
│   └── cliente.repository.ts
├── comanda/
│   └── comanda.repository.ts
├── funcionario/
│   └── funcionario.repository.ts
├── mesa/
│   └── mesa.repository.ts
├── pedido/
│   └── pedido.repository.ts
└── produto/
    └── produto.repository.ts
```

### Exemplo de Uso

```typescript
// Antes (sem isolamento automático)
@Injectable()
export class ProdutoService {
  constructor(
    @InjectRepository(Produto)
    private readonly produtoRepository: Repository<Produto>,
  ) {}

  async findAll() {
    // ⚠️ PERIGO: Retorna produtos de TODOS os tenants!
    return this.produtoRepository.find();
  }
}

// Depois (com isolamento automático)
@Injectable()
export class ProdutoService {
  constructor(
    private readonly produtoRepository: ProdutoRepository,
  ) {}

  async findAll() {
    // ✅ SEGURO: Retorna apenas produtos do tenant atual
    return this.produtoRepository.find();
  }
}
```

---

## 🌐 Configuração Nginx

### Arquivo: `nginx/nginx.conf`

Configuração para subdomínios curinga `*.pubsystem.com.br`:

```nginx
# Wildcard Subdomains
server {
    listen 443 ssl http2;
    server_name *.pubsystem.com.br;
    
    # SSL com Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/pubsystem.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pubsystem.com.br/privkey.pem;
    
    # API Routes -> Backend
    location /api/ {
        proxy_pass http://backend/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
    }
    
    # Frontend
    location / {
        proxy_pass http://frontend;
    }
}
```

### Obter Certificado Wildcard (Let's Encrypt)

```bash
# Usando Certbot com DNS challenge
certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d pubsystem.com.br \
  -d *.pubsystem.com.br
```

---

## 🔒 Migration: tenant_id NOT NULL

### Arquivo: `1765464000000-MakeTenantIdNotNull.ts`

Esta migration torna `tenant_id` obrigatório em todas as tabelas.

**⚠️ IMPORTANTE:** Executar apenas após validar que todos os registros possuem `tenant_id`.

### Verificação Prévia

```sql
-- Verificar registros sem tenant_id
SELECT 'pedidos' as tabela, COUNT(*) as sem_tenant 
FROM pedidos WHERE tenant_id IS NULL
UNION ALL
SELECT 'comandas', COUNT(*) FROM comandas WHERE tenant_id IS NULL
UNION ALL
SELECT 'produtos', COUNT(*) FROM produtos WHERE tenant_id IS NULL
-- ... outras tabelas
```

### Executar Migration

```bash
npm run typeorm:migration:run
```

---

## ✅ Testes de Isolamento

### Arquivo: `tenant-isolation.e2e-spec.ts`

Cenários testados:

1. **Isolamento de Dados**
   - Produto do Tenant A não visível para Tenant B
   - Listagem retorna apenas dados do tenant atual

2. **TenantGuard - Bloqueio Cross-Tenant**
   - Usuário do Tenant A acessando Tenant B → 403
   - Usuário do Tenant A acessando Tenant A → 200

3. **Criação de Registros**
   - tenant_id preenchido automaticamente
   - Sem contexto → TenantNotSetError

---

## 📁 Arquivos Criados

### Repositórios
- `backend/src/modulos/ambiente/ambiente.repository.ts`
- `backend/src/modulos/cliente/cliente.repository.ts`
- `backend/src/modulos/comanda/comanda.repository.ts`
- `backend/src/modulos/funcionario/funcionario.repository.ts`
- `backend/src/modulos/mesa/mesa.repository.ts`
- `backend/src/modulos/pedido/pedido.repository.ts`
- `backend/src/modulos/produto/produto.repository.ts`

### Configuração
- `nginx/nginx.conf`

### Migrations
- `backend/src/database/migrations/1765464000000-MakeTenantIdNotNull.ts`

### Testes
- `backend/src/common/tenant/tests/tenant-isolation.e2e-spec.ts`

---

## 🔜 Próximos Passos

1. **Atualizar services** para usar os novos repositórios
2. **Configurar DNS** para `*.pubsystem.com.br`
3. **Executar migration** NOT NULL após validação
4. **Implementar testes E2E** completos com banco de dados
