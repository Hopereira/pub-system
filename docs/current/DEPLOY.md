# Deploy — Pub System

**Última atualização:** 2026-02-11  
**Fonte da verdade:** `docker-compose.yml`, `nginx/nginx.conf`, `backend/Dockerfile`, `frontend/Dockerfile`  
**Status:** Ativo

---

## Arquitetura de Produção

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   VERCEL        │     │   CLOUDFLARE     │     │   ORACLE VM     │
│   Frontend      │     │   SSL + CDN      │     │   134.65.248.235│
│   Next.js 15    │     │   Flexível       │     │   Backend+Nginx │
│   Gratuito      │     │   Gratuito       │     │   Gratuito      │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                 ┌────────┴────────┐
                                                 │   NEON          │
                                                 │   PostgreSQL    │
                                                 │   sa-east-1     │
                                                 │   Gratuito      │
                                                 └─────────────────┘
```

### URLs de Produção
| Serviço | URL |
|---------|-----|
| Frontend | https://pub-system.vercel.app |
| Backend API | https://api.pubsystem.com.br |
| Domínio | pubsystem.com.br |

### Custo Mensal
| Serviço | Custo |
|---------|-------|
| Oracle VM (Always Free) | Gratuito |
| Neon PostgreSQL (Free Tier) | Gratuito |
| Vercel (Hobby) | Gratuito |
| Cloudflare (Free) | Gratuito |
| Domínio (Registro.br) | ~R$40/ano (~R$3,33/mês) |
| **Total** | **~R$3,33/mês** |

---

## Frontend (Vercel)

### Configuração
- **Framework:** Next.js (detectado automaticamente)
- **Build command:** `npm run build`
- **Output directory:** `.next`
- **Node.js version:** 18.x

### Variáveis de Ambiente (Vercel Dashboard)
| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.pubsystem.com.br` |

### Deploy
Push para branch `main` → deploy automático via Vercel Git Integration.

---

## Backend (Oracle VM)

### Servidor
- **Instância:** Oracle Cloud Always Free (ARM ou AMD)
- **IP:** 134.65.248.235
- **OS:** Ubuntu 22.04+
- **Portas abertas:** 22 (SSH), 80 (HTTP), 3000 (API)

### Nginx como Proxy Reverso

**Fonte:** `nginx/nginx.conf` e `/etc/nginx/sites-available/api`

```nginx
server {
    listen 80;
    server_name api.pubsystem.com.br;

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
    }
}
```

**Importante:** WebSocket requer os headers `Upgrade` e `Connection`.

### Processo do Backend
O backend roda como processo Node.js. Recomendado usar PM2 ou systemd para manter ativo:

```bash
# Com PM2
pm2 start dist/main.js --name pub-system-backend
pm2 save
pm2 startup

# Ou com systemd
sudo systemctl enable pub-system
sudo systemctl start pub-system
```

### Variáveis de Ambiente (Produção)
```env
DB_HOST=ep-nameless-sea-ac0mpy6p-pooler.sa-east-1.aws.neon.tech
DB_PORT=5432
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=pub_system_db
DB_SSL=true

JWT_SECRET=segredo-forte-de-producao-com-32-caracteres-minimo

BACKEND_URL=https://api.pubsystem.com.br
FRONTEND_URL=https://pub-system.vercel.app

NODE_ENV=production
```

---

## Banco de Dados (Neon)

### Configuração
- **Provedor:** Neon (neon.tech)
- **Região:** sa-east-1 (São Paulo)
- **Plano:** Free Tier
- **SSL:** Obrigatório (`DB_SSL=true`)
- **Connection pooling:** Via endpoint `-pooler`

### Conexão
```
Host: ep-nameless-sea-ac0mpy6p-pooler.sa-east-1.aws.neon.tech
Port: 5432
SSL: Required
```

### Migrations em Produção
```bash
NODE_ENV=production npm run typeorm:migration:run
```

---

## Cloudflare

### Configuração DNS
| Tipo | Nome | Conteúdo | Proxy |
|------|------|----------|-------|
| A | `api` | 134.65.248.235 | ✅ (nuvem laranja) |
| CNAME | `www` | pubsystem.com.br | ✅ |

### SSL/TLS
- **Modo:** Flexível (Cloudflare→servidor via HTTP, usuário→Cloudflare via HTTPS)
- **Razão:** Oracle VM não tem certificado SSL próprio; Cloudflare termina o SSL

### Multi-Tenant DNS
Subdomínios de tenants são criados automaticamente via Cloudflare API:
```
casarao-pub.pubsystem.com.br → A → 134.65.248.235
```

Requer variáveis: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_BASE_DOMAIN`, `CLOUDFLARE_TARGET_IP`

---

## Oracle VM — Security List

Portas que devem estar abertas na Security List da Oracle Cloud:

| Porta | Protocolo | Descrição |
|-------|-----------|-----------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP (Nginx) |
| 3000 | TCP | API (opcional, se acessar direto) |

### iptables
```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save
```

---

## Checklist de Deploy

### Primeira vez
- [ ] Criar instância Oracle Cloud
- [ ] Configurar Security List (portas 22, 80)
- [ ] Instalar Node.js 18+, Nginx, Git
- [ ] Clonar repositório
- [ ] Configurar `.env` de produção
- [ ] Criar banco no Neon
- [ ] Executar migrations
- [ ] Configurar Nginx como proxy reverso
- [ ] Configurar Cloudflare DNS
- [ ] Deploy frontend no Vercel
- [ ] Testar health check: `curl https://api.pubsystem.com.br/health`

### Atualizações
```bash
cd pub-system
git pull origin main
cd backend
npm install
npm run build
npm run typeorm:migration:run
pm2 restart pub-system-backend
```

---

## Docker em Produção (Alternativa)

Se preferir usar Docker em produção:

```bash
docker compose -f docker-compose.prod.yml up -d
```

**Nota:** O `docker-compose.yml` atual é otimizado para desenvolvimento (watch mode, volumes montados). Para produção, criar `docker-compose.prod.yml` com build multi-stage e sem volumes de código.
