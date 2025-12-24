# Relatório de Desenvolvimento - 24 de Dezembro de 2025

## 📋 Resumo Executivo

Sessão focada na implementação de **subdomínios wildcard** para o sistema multi-tenant do Pub System. O objetivo era permitir que cada pub registrado tivesse seu próprio subdomínio (ex: `casarao-pub-423.pubsystem.com.br`) ao invés de usar rotas como `/t/slug`.

---

## 🎯 Objetivo Principal

Corrigir o problema de roteamento de subdomínios no frontend. Quando um novo pub é registrado, um subdomínio é criado, mas acessá-lo resultava em 404. A meta era configurar o frontend para lidar corretamente com subdomínios dinâmicos.

---

## 🔧 Implementações Realizadas

### 1. Análise do Problema Inicial

- **Problema:** Vercel no plano gratuito (Hobby) não suporta subdomínios wildcard (`*.pubsystem.com.br`)
- **Solução adotada:** Usar Cloudflare Worker como proxy para reescrever URLs

### 2. Criação do Middleware Next.js

**Arquivo:** `frontend/src/middleware.ts`

```typescript
// Detecta subdomínio e reescreve para /t/[slug]
const originalHost = request.headers.get('x-original-host') || 
                     request.headers.get('x-forwarded-host') || 
                     request.headers.get('host') || '';

const subdomain = originalHost.replace('.pubsystem.com.br', '');

if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
  const newPath = `/t/${subdomain}${url.pathname === '/' ? '' : url.pathname}`;
  return NextResponse.rewrite(new URL(newPath, request.url));
}
```

### 3. Criação das Rotas de Tenant

**Estrutura criada:**
```
frontend/src/app/t/[slug]/
├── page.tsx          # Página inicial do pub
├── layout.tsx        # Layout com sidebar
├── login/page.tsx    # Login específico do tenant
└── dashboard/page.tsx # Dashboard do tenant
```

**Funcionalidades:**
- Página inicial com nome do pub e botões de ação
- Login específico salvando contexto do tenant no localStorage
- Dashboard com estatísticas e ações rápidas
- Sidebar responsiva com menu mobile

### 4. Configuração do Cloudflare Worker

**Worker:** `subdomain-proxy`

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const originalHost = url.hostname;
    const originalPath = url.pathname;
    
    const subdomain = originalHost.replace('.pubsystem.com.br', '');
    
    // Não reescrever arquivos estáticos
    if (originalPath.startsWith('/_next/') || 
        originalPath.startsWith('/api/') ||
        originalPath.includes('.') && !originalPath.endsWith('/')) {
      const vercelUrl = new URL(request.url);
      vercelUrl.hostname = 'pub-system.vercel.app';
      return fetch(new Request(vercelUrl.toString(), request));
    }
    
    // Para páginas de tenant, reescrever para /t/[slug]
    const newPath = `/t/${subdomain}${originalPath === '/' ? '' : originalPath}`;
    
    const vercelUrl = new URL(request.url);
    vercelUrl.hostname = 'pub-system.vercel.app';
    vercelUrl.pathname = newPath;
    
    return fetch(new Request(vercelUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    }));
  }
}
```

**Rota configurada:** `*.pubsystem.com.br/*`

### 5. Configuração DNS no Cloudflare

| Tipo | Nome | Conteúdo | Proxy |
|------|------|----------|-------|
| A | * | 76.76.21.21 (Vercel) | ✅ Ativado |
| A | api | 134.65.248.235 (Oracle) | ✅ Ativado |
| A | www | 76.76.21.21 (Vercel) | ✅ Ativado |

### 6. Tentativa de Configuração SSL (Let's Encrypt)

**Objetivo:** Habilitar WebSocket que não funciona com SSL Flexível do Cloudflare

**Comandos executados na Oracle VM:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.pubsystem.com.br
```

**Status:** Rate limit atingido (5 tentativas falhas). Necessário aguardar 1 hora para tentar novamente.

**Causa:** Cloudflare estava interceptando as requisições de verificação do Let's Encrypt.

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `frontend/src/middleware.ts` | Middleware para detectar subdomínios |
| `frontend/src/app/t/[slug]/page.tsx` | Página inicial do tenant |
| `frontend/src/app/t/[slug]/layout.tsx` | Layout com sidebar |
| `frontend/src/app/t/[slug]/login/page.tsx` | Login do tenant |
| `frontend/src/app/t/[slug]/dashboard/page.tsx` | Dashboard do tenant |
| `docs/CLOUDFLARE_WORKER_SUBDOMAIN.md` | Documentação do Worker |

### Arquivos Modificados

| Arquivo | Modificação |
|---------|-------------|
| `backend/src/common/tenant/controllers/public-registration.controller.ts` | Endpoint público para buscar tenant por slug |

---

## 🌐 Arquitetura Final de Subdomínios

```
┌─────────────────────────────────────────────────────────────┐
│                         USUÁRIO                              │
│         casarao-pub-423.pubsystem.com.br                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Worker: subdomain-proxy                 │    │
│  │  - Detecta subdomínio                               │    │
│  │  - Reescreve URL para /t/[slug]                     │    │
│  │  - Passa arquivos estáticos sem modificar           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       VERCEL                                 │
│              pub-system.vercel.app                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Next.js App Router                      │    │
│  │  /t/casarao-pub-423 → Página do tenant              │    │
│  │  /t/casarao-pub-423/login → Login                   │    │
│  │  /t/casarao-pub-423/dashboard → Dashboard           │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Status Final

| Componente | Status |
|------------|--------|
| Cloudflare Worker | ✅ Configurado e funcionando |
| Rota wildcard `*.pubsystem.com.br/*` | ✅ Ativa |
| Middleware Next.js | ✅ Implementado |
| Rotas `/t/[slug]/*` | ✅ Funcionando |
| Arquivos estáticos | ✅ Carregando corretamente |
| Subdomínio acessível | ✅ `casarao-pub-423.pubsystem.com.br` |
| WebSocket | ⚠️ Pendente (requer SSL Full) |
| Let's Encrypt | ⏳ Aguardando rate limit |

---

## 🔜 Próximos Passos

1. **Aguardar rate limit do Let's Encrypt** (até 18:37 UTC)
2. **Gerar certificado SSL:**
   ```bash
   sudo certbot --nginx -d api.pubsystem.com.br
   ```
3. **Mudar SSL no Cloudflare** de "Flexível" para "Full"
4. **Testar WebSocket** funcionando

---

## 🧪 Como Testar

### Subdomínio do Tenant
```
https://casarao-pub-423.pubsystem.com.br
```

### Login do Tenant
```
https://casarao-pub-423.pubsystem.com.br/login
```

### Dashboard do Tenant
```
https://casarao-pub-423.pubsystem.com.br/dashboard
```

### Verificar via curl
```bash
curl -s -o /dev/null -w "%{http_code}" "https://casarao-pub-423.pubsystem.com.br"
# Deve retornar: 200

curl -s -o /dev/null -w "%{http_code}" "https://casarao-pub-423.pubsystem.com.br/login"
# Deve retornar: 200
```

---

## 📊 Commits Realizados

1. `feat: adicionar middleware para subdomínios wildcard + documentação Cloudflare Worker`
2. `fix: middleware ler X-Original-Host do Cloudflare Worker`
3. `fix: recriar estrutura /t/[slug] com layout e dashboard corretos`
4. `feat: criar dashboard completo com sidebar para tenants em /t/[slug]/dashboard`

---

## 💡 Lições Aprendidas

1. **Vercel Hobby não suporta wildcard subdomains** - necessário usar Cloudflare Worker como proxy
2. **Cloudflare Worker precisa tratar arquivos estáticos** - não reescrever paths que começam com `/_next/`
3. **Let's Encrypt não funciona com proxy Cloudflare ativo** - necessário desativar temporariamente
4. **Rate limit do Let's Encrypt** - máximo 5 tentativas falhas por hora

---

## 📝 Notas Técnicas

### Problema do WebSocket
O Cloudflare no modo SSL Flexível não suporta WebSocket corretamente. A solução é:
1. Instalar certificado SSL na Oracle VM (Let's Encrypt)
2. Mudar SSL do Cloudflare para "Full" ou "Full (strict)"

### Fluxo de Autenticação do Tenant
1. Usuário acessa `slug.pubsystem.com.br`
2. Worker reescreve para `/t/slug`
3. Página carrega e mostra botão "Entrar no Sistema"
4. Login salva `tenant_slug` e `tenant_id` no localStorage
5. Redirecionamento para `/t/slug/dashboard`

---

**Data:** 24 de Dezembro de 2025
**Duração:** ~2 horas
**Autor:** Cascade AI + Hebert
