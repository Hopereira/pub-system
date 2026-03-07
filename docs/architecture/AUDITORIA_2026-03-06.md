# Auditoria Completa — Pub System

**Data:** 2026-03-06
**Auditor:** Arquiteto de Software
**Escopo:** Codigo, Infraestrutura, Docker, CI/CD, Documentacao, Seguranca
**Metodo:** Leitura sistematica de toda documentacao + mapeamento real do codigo + comparacao

---

# SECAO 1 — Arquitetura Documentada

A documentacao do projeto esta espalhada em multiplos locais com informacoes conflitantes.
Existem pelo menos **3 versoes diferentes** da arquitetura documentada:

## Versao 1: "Hibrida com Neon" (DEPLOY_HIBRIDO.md, GUIA_RAPIDO_SERVIDORES.md)
- Backend: Docker na VM Oracle (docker-compose.micro.yml)
- Banco: Neon PostgreSQL (cloud, sa-east-1)
- Frontend: Vercel
- Tunnel: Cloudflare Quick Tunnel (URL muda a cada restart!)
- Criada em: Dezembro 2025

## Versao 2: "Full Docker Local" (docs/infra/deploy-vm.md, docs/infra/arquitetura-atual.md)
- Backend: Docker na VM Oracle (infra/docker-compose.prod.yml)
- Banco: PostgreSQL 17 em Docker na VM
- Frontend: Vercel
- DNS: Cloudflare com dominio proprio
- Criada em: ~Janeiro 2026

## Versao 3: "PM2 + Neon" (docs/current/DEPLOY.md)
- Backend: PM2 ou systemd na VM Oracle (sem Docker!)
- Banco: Neon PostgreSQL (cloud)
- Frontend: Vercel
- Criada em: Fevereiro 2026

## Versao 4: "CI/CD Pipeline" (.github/workflows/ci.yml)
- Backend: PM2 na VM Oracle
- Deploy: SSH + git pull + npm ci + npm run build + pm2 restart
- Path: dist/main.js (errado)

**Nenhuma das 4 versoes corresponde exatamente ao estado real do servidor.**

---

# SECAO 2 — Arquitetura Real do Codigo

Documentada em detalhe em `docs/architecture/current-system.md`.

## Resumo

| Componente | Real |
|------------|------|
| Frontend | Next.js 15 na Vercel, dominio pubsystem.com.br |
| Backend | NestJS (mix v10/v11) em Docker na VM Oracle |
| Banco | PostgreSQL 17 em Docker na VM Oracle |
| Cache | In-memory (sem Redis em producao) |
| Proxy | Nginx no host da VM |
| DNS/SSL | Cloudflare modo Flexivel |
| CI/CD | GitHub Actions (deploy via SSH + PM2, NAO Docker) |
| Docker Compose | 6 arquivos duplicados/divergentes |
| Deploy real | docker-compose.micro.yml (mas com .env inconsistente) |

---

# SECAO 3 — Divergencias Encontradas

## 3.1 CRITICAS (Impedem funcionamento ou comprometem seguranca)

| # | Divergencia | Documentacao | Codigo Real | Impacto |
|---|------------|-------------|-------------|---------|
| D1 | **Credenciais em arquivos commitados** | DEPLOY_HIBRIDO.md, GUIA_RAPIDO_SERVIDORES.md | Senhas, JWT secret, IPs expostos no repo | Qualquer pessoa com acesso ao repo pode comprometer o sistema |
| D2 | **CI/CD deploy usa PM2, servidor usa Docker** | ci.yml usa `pm2 start dist/main.js` | Servidor roda containers Docker | Deploy automatizado NUNCA funciona corretamente |
| D3 | **Path de build errado** | ci.yml: `dist/main.js`, package.json: `dist/main` | Compilacao gera `dist/src/main.js` | Backend NAO inicia com Dockerfile.prod ou CI/CD |
| D4 | **Migration de isolamento NAO executada** | RELATORIO diz "18/18 testes passando" | tenant_id ainda nullable em prod | Isolamento depende APENAS da aplicacao, sem enforcement de banco |
| D5 | **NestJS version mismatch** | Docs dizem "NestJS 10" | common=10, core=11, platform=11 | Erros imprevisiveis de compatibilidade |
| D6 | **.env path no docker-compose** | infra/docker-compose.prod.yml: `./backend/.env` | .env esta em `~/pub-system/.env` | Container NAO consegue ler variaveis de ambiente |

## 3.2 ALTAS (Funcionamento degradado ou risco de dados)

| # | Divergencia | Documentacao | Codigo Real | Impacto |
|---|------------|-------------|-------------|---------|
| D7 | **Versao PostgreSQL inconsistente** | README: 17, docs/current: 15 | docker-compose.yml: 15, infra: 17, servidor: 17 | Confusao; dev e prod podem ter comportamento diferente |
| D8 | **Redis em producao** | docs/current/ENV_VARS.md: "obrigatorio" | Nao existe container Redis em prod | Cache funciona in-memory apenas |
| D9 | **Banco: Neon vs Local** | 3 docs dizem Neon, 2 dizem local | Servidor roda PostgreSQL local em Docker | app.module.ts tem config especifica para Neon que nao se aplica |
| D10 | **Rate limit values** | docs/current/SEGURANCA.md: 3/s, 20/10s, 100/min | app.module.ts: 30/s, 200/10s, 1000/min | Doc errada, limites reais sao 10x maiores |
| D11 | **empresaId ainda no codigo** | multitenancy.md: "empresaId removido" | Funcionario.entity.ts ainda tem empresaId | Coluna legada confunde |
| D12 | **6 docker-compose duplicados** | Cada doc referencia um diferente | 6 arquivos, 3 na raiz + 3 em infra/ | Impossivel saber qual usar |

## 3.3 MEDIAS (Documentacao desatualizada, causa confusao)

| # | Divergencia | Documentacao | Codigo Real |
|---|------------|-------------|-------------|
| D13 | schema.md diz "empresaId" | docs/database/schema.md | Sistema usa tenant_id |
| D14 | banco-de-dados.md diz "empresaId" | docs/infra/banco-de-dados.md | Sistema usa tenant_id |
| D15 | SEGURANCA.md: JWT payload com empresaId | docs/current/SEGURANCA.md | JWT tem tenantId |
| D16 | DEPLOY.md: Frontend URL pub-system.vercel.app | docs/current/DEPLOY.md | URL real: pubsystem.com.br |
| D17 | Diagrama prod mostra Neon | docs/current/ARQUITETURA.md | Banco e PostgreSQL local |
| D18 | 30+ arquivos .sql/.ps1 na raiz | Nao documentados | Lixo acumulado de sprints |
| D19 | docs/historico/ com 118 arquivos | Referencia historica | Maioria obsoleta |

---

# SECAO 4 — Riscos Tecnicos

## P0 — Criticos (Resolver IMEDIATAMENTE)

| # | Risco | Detalhe | Acao |
|---|-------|---------|------|
| R1 | **Credenciais no repositorio** | Senhas Neon, JWT secret, admin password em markdown commitado | Remover arquivos, rotacionar TODAS as credenciais, limpar historico git |
| R2 | **SSH key no historico git** | Pendente desde Dez/2025 | Executar BFG, revogar chave no servidor |
| R3 | **JWT Secret previsivel** | "pub-system-jwt-secret-2024-production" — se for esse em prod | Gerar novo segredo aleatorio: `openssl rand -base64 64` |
| R4 | **CI/CD deploy quebrado** | PM2 vs Docker, path errado | Alinhar ci.yml com deploy Docker real |

## P1 — Altos (Resolver esta semana)

| # | Risco | Detalhe | Acao |
|---|-------|---------|------|
| R5 | **Migration multi-tenant NAO executada** | tenant_id nullable em prod | Backup + executar migration + validar |
| R6 | **NestJS version mismatch** | common@10 vs core@11 | Alinhar todos para @11 |
| R7 | **Dockerfile.prod path errado** | start:prod referencia dist/main | Corrigir para dist/src/main.js |
| R8 | **docker-compose .env path** | infra/docker-compose.prod.yml aponta para path errado | Corrigir env_file ou estrutura |
| R9 | **Sem Redis em producao** | Cache apenas in-memory | OK para escala atual, documentar decisao |

## P2 — Medios (Resolver neste mes)

| # | Risco | Detalhe | Acao |
|---|-------|---------|------|
| R10 | Documentacao obsoleta confunde operacao | 3 versoes de arquitetura | Consolidar em docs/architecture/ |
| R11 | Duplicacao de docker-compose | 6 arquivos | Manter 2: dev + prod |
| R12 | Arquivos soltos na raiz | 30+ .sql, .ps1, .json | Mover para scripts/ ou remover |
| R13 | Backup nao configurado | Sem cron de backup em producao | Configurar pg_dump diario |
| R14 | Monitoramento inexistente | Sem UptimeRobot ou similar | Configurar monitoramento basico |

---

# SECAO 5 — Componentes Criticos para Refatoracao

## 5.1 CI/CD Pipeline (PRIORIDADE MAXIMA)

**Problema:** O pipeline de deploy nao funciona. Usa PM2 + path errado.

**Refatoracao:**
```yaml
# ci.yml deploy step deve ser:
ssh -i ~/.ssh/deploy_key $SSH_USER@$SSH_HOST << 'ENDSSH'
  cd /home/ubuntu/pub-system
  git pull origin main
  cp .env infra/backend/.env
  docker compose --env-file .env -f infra/docker-compose.prod.yml up -d --build
  sleep 30
  curl -f http://localhost:3000/health || exit 1
ENDSSH
```

## 5.2 Docker Compose (Consolidacao)

**Problema:** 6 arquivos duplicados com configuracoes divergentes.

**Refatoracao:**
- Manter `docker-compose.yml` (raiz) para desenvolvimento
- Manter `infra/docker-compose.prod.yml` para producao
- Remover `docker-compose.prod.yml` (raiz) — duplicata
- Remover `docker-compose.micro.yml` (raiz) — obsoleto
- Remover `infra/docker-compose.micro.yml` — duplicata
- Corrigir env_file em `infra/docker-compose.prod.yml`

## 5.3 Dockerfile.prod (Path Fix)

**Problema:** `start:prod` referencia `dist/main` mas build gera `dist/src/main.js`.

**Opcao A:** Corrigir package.json:
```json
"start:prod": "node dist/src/run-migrations.js && node dist/src/main"
```

**Opcao B:** Alterar tsconfig/nest-cli para compilar na raiz de dist/.

## 5.4 Seguranca (Credenciais)

**Acao imediata:**
1. Remover DEPLOY_HIBRIDO.md e GUIA_RAPIDO_SERVIDORES.md do repo
2. Rotacionar JWT_SECRET em producao
3. Rotacionar senha do banco
4. Rotacionar senha do admin
5. Executar BFG para limpar historico git
6. Executar gitleaks para scan completo

## 5.5 NestJS Version Alignment

**Problema:** @nestjs/common@10 misturado com @nestjs/core@11.

**Refatoracao:**
```bash
npm install @nestjs/common@^11.0.0 --legacy-peer-deps
```

---

# SECAO 6 — Plano de Acao Priorizado

## Semana 1 (Emergencial)

- [ ] Remover credenciais de arquivos .md commitados
- [ ] Rotacionar JWT_SECRET, DB password, admin password em producao
- [ ] Executar BFG para limpar historico git
- [ ] Corrigir path em Dockerfile.prod e package.json (start:prod)
- [ ] Corrigir env_file em infra/docker-compose.prod.yml
- [ ] Rebuild e deploy via Docker

## Semana 2 (Estabilizacao)

- [ ] Alinhar NestJS versions (tudo para @11)
- [ ] Consolidar docker-compose (manter 2, remover 4)
- [ ] Atualizar ci.yml para deploy via Docker
- [ ] Configurar backup automatico (pg_dump cron)
- [ ] Limpar arquivos soltos da raiz

## Semana 3 (Fortalecimento)

- [ ] Executar migration multi-tenant (com backup pre-deploy)
- [ ] Remover coluna empresaId das entidades
- [ ] Validar isolamento em producao
- [ ] Configurar monitoramento (UptimeRobot)
- [ ] Atualizar toda documentacao

## Semana 4 (Documentacao)

- [ ] Arquivar docs obsoletos em docs/archive/
- [ ] Consolidar docs/current/ com docs/architecture/
- [ ] Validar que docs/architecture/current-system.md e a fonte da verdade
- [ ] Criar runbook operacional unico

---

# SECAO 7 — Plano de Auditorias Seguintes

## Auditoria Mensal (Automatizada)

| Verificacao | Ferramenta | Frequencia |
|-------------|-----------|-----------|
| Vulnerabilidades npm | `npm audit` | Mensal |
| Secrets no codigo | `gitleaks detect` | Mensal |
| Docker images | `docker scout` | Mensal |
| Dependencias desatualizadas | `npm outdated` | Mensal |

## Auditoria Trimestral (Manual)

| Verificacao | Responsavel |
|-------------|-------------|
| Docs vs Codigo | Arquiteto |
| Isolamento multi-tenant | Seguranca |
| Performance (queries lentas) | DBA |
| Backup e restore test | DevOps |

## Auditoria Semestral (Completa)

| Verificacao | Responsavel |
|-------------|-------------|
| Penetration test | Seguranca |
| Disaster recovery drill | DevOps |
| Capacidade e escala | Arquiteto |
| Custo e otimizacao | Gestor |
