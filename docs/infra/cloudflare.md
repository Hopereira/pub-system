# Cloudflare e Nginx

## DNS

Registros configurados no painel Cloudflare:

| Tipo | Nome | Destino | Proxy |
|------|------|---------|-------|
| A | api | IP publico da VM Oracle | Ativado |
| CNAME | @ | cname.vercel-dns.com | DNS only |
| CNAME | www | cname.vercel-dns.com | DNS only |

O registro `api` com proxy ativado garante que o IP real da VM nao fique exposto.

Os registros `@` e `www` apontam para o Vercel sem proxy para que o Vercel gerencie o SSL do frontend.

## SSL/TLS

- Modo recomendado: **Full (Strict)** se o Nginx tiver certificado valido, ou **Full** com certificado autoassinado.
- O Nginx no host gerencia o TLS para conexoes vindas da Cloudflare.

## Nginx no Host

Arquivo de configuracao: `/etc/nginx/sites-available/pub-system`

```nginx
server {
    listen 80;
    server_name api.pubsystem.com.br;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.pubsystem.com.br;

    ssl_certificate /etc/letsencrypt/live/pubsystem.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pubsystem.com.br/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_set_header Host $host;
    }
}
```

### Ativar e Recarregar

```bash
sudo ln -sf /etc/nginx/sites-available/pub-system /etc/nginx/sites-enabled/pub-system
sudo nginx -t
sudo systemctl reload nginx
```

### Certificado SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.pubsystem.com.br -d pubsystem.com.br
```

Renovacao automatica via timer do certbot (verificar com `sudo certbot renew --dry-run`).

## Multi-tenancy com Subdomains

O repositorio inclui um arquivo `nginx/nginx.conf` com configuracao para wildcard subdomains (`*.pubsystem.com.br`). Essa configuracao e usada quando o frontend tambem roda em container Docker (nao no Vercel).

Na arquitetura atual com Vercel, o isolamento de tenant e feito via JWT no backend, sem necessidade de subdomains separados.

## Verificacao

```bash
# Testar se API responde
curl -I https://api.pubsystem.com.br/health

# Status do Nginx
sudo systemctl status nginx

# Logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```
