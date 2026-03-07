# Relatorio Infraestrutura — Pub System

**Data:** 2026-03-06
**Metodo:** Leitura de docker-compose*, Dockerfile*, nginx.conf, ci.yml, scripts/, env.micro.example
**Regra:** Baseado APENAS no que existe no codigo

---

## 1. Arquitetura de Producao (Real)

```
Internet
  │
  ├── pubsystem.com.br → Cloudflare CNAME → Vercel (Frontend Next.js 16)
  │
  └── api.pubsystem.com.br → Cloudflare A record → 134.65.248.235
        │
        ▼
  Oracle VM E2.1.Micro (Ubuntu 22.04, 1 vCPU, 1GB RAM)
        │
        ├── Nginx (host) :80 → proxy_pass localhost:3000
        │
        ├── Docker: pub-backend (Dockerfile.micro) :3000 [512MB limit]
        │     └── NestJS mix v10/v11
        │
        ├── Docker: pub-postgres (postgres:17) :5432 [volume: postgres_data]
        │
        └── Docker: watchtower :— [64MB limit, poll 24h]
```

### Custo

| Servico | Custo |
|---------|-------|
| Oracle VM (Always Free) | R$0 |
| Vercel (Hobby) | R$0 |
| Cloudflare (Free) | R$0 |
| Dominio | ~R$40/ano |
| **Total** | **~R$3,33/mes** |

---

## 2. Docker Compose — Inventario

### 2.1 Seis Arquivos (3 duplicados)

| Arquivo | Usado | Servicos | PG | Redis | Frontend |
|---------|-------|----------|-----|-------|----------|
| `docker-compose.yml` | **DEV** | backend, redis, db, pgadmin, frontend | 15 | Sim | Sim |
| `docker-compose.micro.yml` | **PROD** | backend, watchtower | — | Nao | Nao |
| `docker-compose.prod.yml` | **Nao** | backend, frontend, postgres | 15 | Nao | Sim |
| `infra/docker-compose.yml` | **Nao** | Copia exata da raiz | 15 | Sim | Sim |
| `infra/docker-compose.prod.yml` | **Nao** | Variante divergente | **17** | Nao | Sim |
| `infra/docker-compose.micro.yml` | **Nao** | Variante sem CF vars | — | Nao | Nao |

### 2.2 Problemas nos Compose Files

| # | Problema | Arquivo | Severidade |
|---|---------|---------|-----------|
| 1 | Pasta `infra/` inteira e duplicata sem valor | infra/*.yml | ALTO |
| 2 | PG 15 no dev, PG 17 em prod — divergencia | docker-compose.yml vs micro | ALTO |
| 3 | `env_file: ./backend/.env` path errado | docker-compose.prod.yml | ALTO |
| 4 | `NEXT_PUBLIC_API_URL: http://backend:3000` (nome Docker interno) | docker-compose.prod.yml | ALTO |
| 5 | `docker-compose.prod.yml` nunca e usado | raiz | MEDIO |
| 6 | Redis ausente em prod | docker-compose.micro.yml | ALTO |

### 2.3 docker-compose.yml (Dev) — Detalhes

```yaml
services:
  backend:    1.5GB RAM, port 3000, volumes mount, start:dev (watch)
  redis:      256MB RAM, port 6379, Redis 7 alpine
  db:         512MB RAM, port 5432, PG 15 alpine, volume postgres_data
  pgadmin:    ~256MB, port 8080
  frontend:   2.5GB RAM, port 3001, Turbopack
```

Total: ~5GB RAM necessarios para dev local.

### 2.4 docker-compose.micro.yml (Prod) — Detalhes

```yaml
services:
  backend:
    build: ./backend -f Dockerfile.micro
    mem_limit: 512m
    env_file: ./.env
    restart: unless-stopped
    ports: "3000:3000"
    dns: [8.8.8.8, 1.1.1.1]  # Para resolver Neon (legado)
    healthcheck: wget http://localhost:3000/health

  watchtower:
    image: containrrr/watchtower
    mem_limit: 64m
    poll-interval: 86400  # 24h
```

**Nota:** O compose micro foi criado para arquitetura com Neon Cloud. Hoje o banco e local (Docker PG 17 rodando separado ou no mesmo compose com override).

---

## 3. Dockerfiles — Inventario

### 3.1 Backend

| Dockerfile | Base | Stages | Usado | CMD | Tamanho |
|-----------|------|--------|-------|-----|---------|
| `Dockerfile` | node:20-alpine | 1 | DEV | `npm run start:dev` | ~1GB |
| `Dockerfile.micro` | node:20-alpine | 2 | **PROD** | `node dist/src/main.js` | ~150MB |
| `Dockerfile.prod` | node:20-alpine | 2 | Nao | `npm run start:prod` | ~200MB |

**Problemas:**

| # | Problema | Arquivo | Severidade |
|---|---------|---------|-----------|
| 1 | `npm install --force` mascara NestJS mismatch | Dockerfile | ALTO |
| 2 | `Dockerfile.prod` usa `start:prod` que tem path errado | Dockerfile.prod | ALTO |
| 3 | `Dockerfile.micro` hardcoda `--max-old-space-size=384` | Dockerfile.micro | MEDIO |

**start:prod path incorreto:**
```json
// backend/package.json
"start:prod": "node dist/run-migrations.js && node dist/main"
// Real: deveria ser dist/src/main.js (nest-cli sourceRoot: "src")
```

O `Dockerfile.micro` contorna isso com CMD direto `node dist/src/main.js`.

### 3.2 Frontend

| Dockerfile | Base | Stages | Usado | CMD | Tamanho |
|-----------|------|--------|-------|-----|---------|
| `Dockerfile` | node:20 (Debian) | 1 | DEV | `npm run dev` | ~2GB |
| `Dockerfile.prod` | node:20-alpine | 3 | Nao | `node server.js` | ~300MB |

**Problemas:**

| # | Problema | Arquivo | Severidade |
|---|---------|---------|-----------|
| 1 | Instala Cypress (sistema usa Playwright) — +500MB | Dockerfile | ALTO |
| 2 | Dockerfile.prod nunca e usado (frontend no Vercel) | Dockerfile.prod | MEDIO |

---

## 4. Nginx

### 4.1 Template (nginx/nginx.conf)

O arquivo `nginx/nginx.conf` e um template completo com:
- SSL com certificados (Let's Encrypt paths)
- HTTP → HTTPS redirect
- gzip compression
- Security headers
- proxy_pass para backend (:3000) e frontend (:3001)
- Wildcard subdomains para multi-tenancy

### 4.2 Producao Real

O Nginx real no servidor e **muito mais simples**:
- Apenas HTTP (:80) — SSL termina no Cloudflare
- proxy_pass localhost:3000 (apenas backend)
- Frontend nao e servido pelo Nginx (esta no Vercel)

**Divergencia:** O template nginx.conf NAO e usado em producao. A config real e manual no servidor.

---

## 5. CI/CD Pipeline

### 5.1 GitHub Actions (.github/workflows/ci.yml)

| Job | Trigger | Steps | Status |
|-----|---------|-------|--------|
| **backend** | push/PR main | checkout → setup node 20 → npm ci → lint → build → pg service → migration → test | **FUNCIONA** |
| **frontend** | push/PR main | checkout → setup node 20 → npm ci → lint → build | **FUNCIONA** |
| **security** | apos backend+frontend | npm audit (backend+frontend) | **INUTIL** (`\|\| true`) |
| **deploy-staging** | push main (apos security) | SSH → git pull → npm ci → pm2 restart | **QUEBRADO** |

### 5.2 Deploy Job — Analise Detalhada

```yaml
deploy-staging:
  runs-on: ubuntu-latest
  needs: [security]
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  steps:
    - name: Deploy to Oracle VM
      uses: appleboy/ssh-action@v1
      with:
        host: ${{ secrets.ORACLE_HOST }}
        username: ${{ secrets.ORACLE_USER }}
        key: ${{ secrets.ORACLE_SSH_KEY }}
        script: |
          cd ~/pub-system
          git pull origin main
          cd backend && npm ci --only=production
          pm2 restart pub-backend || pm2 start dist/main.js --name pub-backend
          sleep 5
          curl -f http://localhost:3000/health || (pm2 stop pub-backend && exit 1)
  continue-on-error: true
```

**8 problemas identificados:**

| # | Problema | Impacto |
|---|---------|---------|
| 1 | Usa `pm2` — servidor usa Docker | Deploy nao funciona |
| 2 | Path `dist/main.js` — real e `dist/src/main.js` | Crash |
| 3 | `npm ci --only=production` — typeorm em devDeps | Falha se typeorm necessario |
| 4 | `continue-on-error: true` | Falhas sao ignoradas silenciosamente |
| 5 | Nao faz backup do banco | Risco de dados |
| 6 | Nao faz docker compose build | Imagem nao atualiza |
| 7 | Health check apenas 1 tentativa | Pode pegar cold start |
| 8 | Rollback apenas `pm2 stop` | Nao restaura versao anterior |

### 5.3 Security Audit — Inutil

```yaml
- name: Backend audit
  run: cd backend && npm audit --audit-level=high || true
```

O `|| true` faz o job SEMPRE passar, mesmo com vulnerabilidades criticas.

### 5.4 Deploy Real (Manual)

Frontend: push main → Vercel auto-deploy.
Backend: SSH manual + `scripts/deploy.sh`.

---

## 6. Scripts de Deploy

### 6.1 Inventario

| Script | Tipo | Funcao | Status |
|--------|------|--------|--------|
| `scripts/deploy.sh` | Bash | Deploy seguro com backup e rollback | Criado (auditoria anterior) |
| `scripts/backup.sh` | Bash | Backup PG (deploy/daily/weekly) | Criado (auditoria anterior) |
| `scripts/rollback.sh` | Bash | Rollback codigo e/ou banco | Criado (auditoria anterior) |
| `scripts/backup-db.sh` | Bash | Backup PG simples | Original |
| `scripts/restore-db.sh` | Bash | Restore PG | Original |
| `scripts/health-monitor.sh` | Bash | Monitoramento continuo | Original |
| `scripts/test-backup-restore.sh` | Bash | Teste de backup/restore | Original |
| `scripts/deploy/setup.ps1` | PowerShell | Setup local (Windows) | Original |
| `scripts/deploy/docker-start.ps1` | PowerShell | Start containers | Original |
| `scripts/deploy/docker-rebuild.ps1` | PowerShell | Rebuild containers | Original |

### 6.2 Scripts Duplicados na Raiz (Devem ser removidos)

```
docker-rebuild.ps1    → duplicata de scripts/deploy/docker-rebuild.ps1
docker-start.ps1      → duplicata de scripts/deploy/docker-start.ps1
setup.ps1             → duplicata de scripts/deploy/setup.ps1
verify-setup.ps1      → sem equivalente em scripts/
reset-sistema.ps1     → sem equivalente em scripts/
instalar-dependencias.ps1 → sem equivalente
```

---

## 7. Cloudflare

### 7.1 DNS

| Tipo | Nome | Destino | Proxy |
|------|------|---------|-------|
| A | api | 134.65.248.235 | Ativado (orange cloud) |
| CNAME | @ | cname.vercel-dns.com | DNS only |
| CNAME | www | cname.vercel-dns.com | DNS only |

### 7.2 SSL/TLS

Modo: **Flexivel**

```
Navegador ←→ HTTPS ←→ Cloudflare ←→ HTTP ←→ Nginx :80 ←→ Backend :3000
```

**Risco:** Trafego entre Cloudflare e servidor nao e criptografado. Em redes nao confiaveis, e um problema. Na Oracle Cloud VCN, o risco e menor.

### 7.3 Alternativa Recomendada

Mudar para SSL **Full (Strict)** com certificado origin do Cloudflare:
1. Gerar Origin Certificate no Cloudflare Dashboard
2. Instalar no Nginx
3. Configurar Nginx para HTTPS :443
4. Mudar SSL mode para Full (Strict)

---

## 8. Oracle VM

### 8.1 Specs

| Item | Valor |
|------|-------|
| Shape | VM.Standard.E2.1.Micro |
| vCPU | 1 (AMD EPYC) |
| RAM | 1GB |
| Disco | 47GB (boot volume) |
| OS | Ubuntu 22.04 |
| IP Publico | 134.65.248.235 |
| VCN | Default com Security Lists |

### 8.2 Security List (Portas Abertas)

| Protocolo | Porta | Origem | Uso |
|-----------|-------|--------|-----|
| TCP | 22 | 0.0.0.0/0 | SSH |
| TCP | 80 | 0.0.0.0/0 | HTTP (Nginx) |

**Nota:** Porta 443 NAO esta aberta porque SSL termina no Cloudflare.

### 8.3 RAM Budget

| Processo | RAM |
|---------|-----|
| Ubuntu OS | ~150MB |
| Nginx | ~10MB |
| Docker daemon | ~100MB |
| pub-backend (NestJS) | ~384MB (heap limit) + overhead |
| pub-postgres (PG 17) | ~100MB shared_buffers |
| watchtower | ~64MB |
| **Total estimado** | **~850MB / 1024MB** |

**Margem:** ~170MB livres. Sob carga, pode usar swap e degradar performance.

---

## 9. Divergencias Documentacao vs Codigo

| Documento | Afirmacao | Realidade |
|-----------|----------|-----------|
| DEPLOY_HIBRIDO.md | Neon Cloud + Cloudflare Tunnel | PG Docker local + CF Flexivel |
| GUIA_RAPIDO_SERVIDORES.md | docker-compose.micro.yml (sem PG local) | PG roda em Docker separado |
| docs/current/DEPLOY.md | PM2, systemd | Docker |
| docs/current/SETUP_LOCAL.md | `infra/docker-compose.yml` | `docker-compose.yml` (raiz) |
| README.md | `infra/docker-compose.yml` | `docker-compose.yml` (raiz) |
| nginx/nginx.conf | SSL com Let's Encrypt | CF Flexivel (sem SSL no servidor) |

---

## 10. Correcoes Propostas

### Fase 1 — Limpeza (Sem Risco)

| # | Correcao | Esforco |
|---|---------|---------|
| 1 | Deletar pasta `infra/` inteira | 5min |
| 2 | Deletar `docker-compose.prod.yml` (raiz) | 5min |
| 3 | Mover scripts duplicados da raiz para scripts/ ou deletar | 30min |
| 4 | Remover libs Cypress do frontend/Dockerfile | 15min |
| 5 | Deletar `Dockerfile.prod` (frontend — usa Vercel) | 5min |

### Fase 2 — Correcoes de Config

| # | Correcao | Esforco |
|---|---------|---------|
| 6 | Alinhar PG para v17 no docker-compose.yml (dev) | 10min |
| 7 | Corrigir `start:prod` path no package.json | 5min |
| 8 | Remover `--force` do npm install nos Dockerfiles | 5min |
| 9 | Mover typeorm para dependencies | 5min |
| 10 | Adicionar Redis ao docker-compose.micro.yml | 30min |

### Fase 3 — CI/CD

| # | Correcao | Esforco |
|---|---------|---------|
| 11 | Reescrever deploy job: Docker em vez de PM2 | 2h |
| 12 | Remover `continue-on-error: true` | 5min |
| 13 | Remover `\|\| true` do security audit | 5min |
| 14 | Adicionar backup pre-deploy no CI | 1h |
| 15 | Adicionar health check com retry | 30min |

### Fase 4 — Seguranca

| # | Correcao | Esforco |
|---|---------|---------|
| 16 | Rotacionar JWT Secret | 30min |
| 17 | Rotacionar DB Password | 30min |
| 18 | Remover credenciais do Git (BFG) | 2h |
| 19 | Mudar SSL para Full (Strict) | 1h |
| 20 | Restringir SSH a IP especifico | 15min |
