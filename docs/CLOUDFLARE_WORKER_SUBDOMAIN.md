# Configuração de Subdomínios Wildcard com Cloudflare Worker

## Arquitetura

```
Usuário (casarao-pub-423.pubsystem.com.br)
    │
    ▼
Cloudflare (DNS + Worker)
    │
    ▼
Vercel (pub-system.vercel.app)
    │
    ▼
Next.js Middleware (rewrite para /t/[slug])
```

## Passo 1: Configurar DNS no Cloudflare

1. Acesse o painel do Cloudflare
2. Vá em **DNS** > **Records**
3. Adicione um registro:
   - **Tipo:** A
   - **Nome:** `*` (asterisco)
   - **IP:** `76.76.21.21` (IP da Vercel)
   - **Proxy:** ✅ Ativado (nuvem laranja)

## Passo 2: Criar o Cloudflare Worker

1. No painel Cloudflare, vá em **Workers & Pages**
2. Clique em **Create Worker**
3. Dê um nome: `subdomain-proxy`
4. Cole o código abaixo:

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    
    // Extrair subdomínio
    const subdomain = hostname.replace('.pubsystem.com.br', '');
    
    // Ignorar www, api e domínio principal
    if (subdomain === 'www' || subdomain === 'api' || subdomain === 'pubsystem') {
      // Redirecionar para Vercel normalmente
      const vercelUrl = new URL(request.url);
      vercelUrl.hostname = 'pub-system.vercel.app';
      
      return fetch(new Request(vercelUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      }));
    }
    
    // Para subdomínios de tenant, passar para Vercel com header customizado
    const vercelUrl = new URL(request.url);
    vercelUrl.hostname = 'pub-system.vercel.app';
    
    const newHeaders = new Headers(request.headers);
    newHeaders.set('X-Tenant-Subdomain', subdomain);
    newHeaders.set('Host', 'pub-system.vercel.app');
    
    return fetch(new Request(vercelUrl, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
    }));
  }
}
```

5. Clique em **Save and Deploy**

## Passo 3: Configurar Rotas do Worker

1. Após criar o Worker, vá em **Settings** > **Triggers**
2. Em **Routes**, adicione:
   - `*.pubsystem.com.br/*`
3. Salve

## Passo 4: Verificar Middleware no Next.js

O middleware já foi criado em `frontend/src/middleware.ts`.

Ele detecta o subdomínio e reescreve internamente para `/t/[slug]`.

## Teste

1. Acesse: `https://casarao-pub-423.pubsystem.com.br`
2. O Cloudflare Worker encaminha para Vercel
3. O Middleware Next.js reescreve para `/t/casarao-pub-423`
4. A página do tenant é exibida

## Alternativa: Usar Oracle Cloud como Proxy

Se preferir usar a Oracle Cloud ao invés do Cloudflare Worker:

### Nginx na Oracle (`/etc/nginx/sites-available/wildcard`):

```nginx
server {
    listen 80;
    server_name *.pubsystem.com.br;

    location / {
        proxy_pass https://pub-system.vercel.app;
        proxy_set_header Host pub-system.vercel.app;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Tenant-Subdomain $host;
        proxy_ssl_server_name on;
    }
}
```

### DNS no Cloudflare:
- **Tipo:** A
- **Nome:** `*`
- **IP:** `134.65.248.235` (IP da Oracle)
- **Proxy:** ✅ Ativado

## Custos

| Serviço | Limite Gratuito |
|---------|-----------------|
| Cloudflare Worker | 100.000 req/dia |
| Oracle Cloud | Always Free |
| Vercel | 100GB bandwidth/mês |

## Troubleshooting

### Erro 522 (Connection timed out)
- Verifique se o Worker está ativo
- Verifique se a rota está configurada corretamente

### Página em branco
- Verifique o middleware no Next.js
- Verifique os logs do Vercel

### Subdomínio não reconhecido
- Verifique se o DNS wildcard está configurado
- Aguarde propagação (até 5 minutos)
