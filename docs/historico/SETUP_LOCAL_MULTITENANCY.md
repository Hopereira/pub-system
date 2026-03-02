# 🏢 Configuração Local para Multi-Tenancy

Este guia explica como configurar seu ambiente de desenvolvimento para simular o roteamento multi-tenant (subdomínios e slugs).

## 1. Configuração do Arquivo hosts

### Windows
Abra o Notepad como **Administrador** e edite:
```
C:\Windows\System32\drivers\etc\hosts
```

Adicione as seguintes linhas:
```
# PubSystem Multi-Tenancy Local
127.0.0.1  pubsystem.test
127.0.0.1  admin.pubsystem.test
127.0.0.1  bar-do-ze.pubsystem.test
127.0.0.1  pub-da-hora.pubsystem.test
127.0.0.1  boteco-do-joao.pubsystem.test
```

### Linux/Mac
```bash
sudo nano /etc/hosts
```

Adicione as mesmas linhas acima.

---

## 2. Certificado SSL Local (mkcert)

### Instalação do mkcert

**Windows (via Chocolatey):**
```powershell
choco install mkcert
```

**Windows (via Scoop):**
```powershell
scoop install mkcert
```

**Mac:**
```bash
brew install mkcert
```

**Linux:**
```bash
sudo apt install libnss3-tools
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
```

### Gerar Certificados

```bash
# Instalar CA raiz local (uma vez)
mkcert -install

# Gerar certificado wildcard para pubsystem.test
mkcert "*.pubsystem.test" pubsystem.test localhost 127.0.0.1 ::1

# Os arquivos serão criados:
# - _wildcard.pubsystem.test+4.pem (certificado)
# - _wildcard.pubsystem.test+4-key.pem (chave privada)
```

Mova os certificados para a pasta do projeto:
```bash
mkdir -p backend/certs
mv _wildcard.pubsystem.test+4*.pem backend/certs/
```

---

## 3. Configuração do Backend (NestJS)

### Habilitar HTTPS no main.ts

```typescript
// backend/src/main.ts
import * as fs from 'fs';
import * as https from 'https';

async function bootstrap() {
  const httpsOptions = process.env.NODE_ENV === 'development' ? {
    key: fs.readFileSync('./certs/_wildcard.pubsystem.test+4-key.pem'),
    cert: fs.readFileSync('./certs/_wildcard.pubsystem.test+4.pem'),
  } : undefined;

  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    httpsOptions ? { httpsOptions } : undefined
  );
  // ...
}
```

### Variáveis de Ambiente (.env)

```env
# Multi-tenancy
TENANT_DOMAIN=pubsystem.test
TENANT_RESOLVE_BY=subdomain,slug,jwt

# URLs
BACKEND_URL=https://pubsystem.test:3000
FRONTEND_URL=https://pubsystem.test:3001
```

---

## 4. Validação da Identificação Híbrida

### Via Subdomínio (Staff)
```bash
# Acesse no navegador:
https://bar-do-ze.pubsystem.test:3000/api/health

# O TenantInterceptor deve identificar:
# - Tenant: bar-do-ze
# - Source: subdomain
```

### Via Slug na URL (Cliente QR Code)
```bash
# Acesse no navegador:
https://pubsystem.test:3000/menu/bar-do-ze

# O TenantInterceptor deve identificar:
# - Tenant: bar-do-ze
# - Source: slug
```

### Via JWT (Rotas Protegidas)
```bash
# Login e use o token:
curl -X GET https://pubsystem.test:3000/api/pedidos \
  -H "Authorization: Bearer <token_com_empresaId>"

# O TenantInterceptor deve identificar:
# - Tenant: <empresaId do JWT>
# - Source: jwt
```

---

## 5. Isolamento de WebSockets

### Teste de Isolamento

1. Abra duas abas anônimas:
   - Aba 1: `https://bar-do-ze.pubsystem.test:3000`
   - Aba 2: `https://pub-da-hora.pubsystem.test:3000`

2. Conecte ao Socket.io em ambas

3. Faça um pedido na Aba 1

4. **Verificar:** A Aba 2 NÃO deve receber a notificação

### Logs Esperados (Backend)

```
[PedidosGateway] 🔌 Cliente conectado: socket123 | Tenant: bar-do-ze
[PedidosGateway] 📦 Novo pedido | Room: tenant:bar-do-ze | Pedido: abc123
```

---

## 6. Google Cloud Storage (Desenvolvimento)

### Opção A: Bucket de Desenvolvimento

```env
# .env
GCS_BUCKET_NAME=pubsystem-dev-uploads
GOOGLE_APPLICATION_CREDENTIALS=./gcs-credentials.json
```

### Opção B: GCS Emulator (Local)

```bash
# Instalar fake-gcs-server
docker run -d --name fake-gcs \
  -p 4443:4443 \
  fsouza/fake-gcs-server -scheme http

# Configurar no .env
GCS_EMULATOR_HOST=http://localhost:4443
GCS_BUCKET_NAME=local-uploads
```

### Estrutura de Pastas Esperada

```
gs://pubsystem-dev-uploads/
├── tenants/
│   ├── uuid-bar-do-ze/
│   │   ├── produtos/
│   │   │   ├── produto-123.jpg
│   │   │   └── produto-456.jpg
│   │   └── logo/
│   │       └── logo.png
│   └── uuid-pub-da-hora/
│       └── produtos/
│           └── ...
```

### Verificar Metadados

```bash
# Via gsutil
gsutil stat gs://pubsystem-dev-uploads/tenants/uuid-bar-do-ze/produtos/produto-123.jpg

# Deve mostrar:
# Metadata:
#   tenantId: uuid-bar-do-ze
#   uploadedBy: user-id
#   uploadedAt: 2025-12-19T...
```

---

## 7. Nginx Local (Opcional)

### docker-compose.nginx.yml

```yaml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./backend/certs:/etc/nginx/certs:ro
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

### nginx/nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    # Upstream para o backend NestJS
    upstream backend {
        server host.docker.internal:3000;
    }

    # Upstream para o frontend Next.js
    upstream frontend {
        server host.docker.internal:3001;
    }

    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name *.pubsystem.test pubsystem.test;
        return 301 https://$host$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl;
        server_name *.pubsystem.test pubsystem.test;

        ssl_certificate /etc/nginx/certs/_wildcard.pubsystem.test+4.pem;
        ssl_certificate_key /etc/nginx/certs/_wildcard.pubsystem.test+4-key.pem;

        # API Backend
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket
        location /socket.io {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### Iniciar Nginx

```bash
docker-compose -f docker-compose.nginx.yml up -d
```

---

## 8. Checklist de Validação

### Resolução de Inquilino
- [ ] Arquivo hosts configurado com domínios de teste
- [ ] Certificado SSL local gerado com mkcert
- [ ] Subdomínio `bar-do-ze.pubsystem.test` resolve para o tenant correto
- [ ] Slug `/menu/bar-do-ze` resolve para o tenant correto

### Tempo Real
- [ ] WebSocket conecta com tenant_id no handshake
- [ ] Mensagens isoladas por Room (tenant)
- [ ] Duas abas de bares diferentes não recebem mensagens cruzadas

### Storage
- [ ] Uploads vão para `tenants/{tenant_id}/...`
- [ ] Metadados incluem `tenantId`
- [ ] Bucket de dev configurado no .env

---

## Troubleshooting

### Erro: "NET::ERR_CERT_AUTHORITY_INVALID"
```bash
# Reinstalar CA raiz
mkcert -install
# Reiniciar navegador
```

### Erro: "Tenant não identificado"
```bash
# Verificar logs do TenantInterceptor
# Confirmar que o Host header está sendo passado corretamente
```

### WebSocket não conecta
```bash
# Verificar se o Nginx está fazendo upgrade de conexão
# Verificar CORS no backend
```
