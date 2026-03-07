# Relatorio de Refatoracao — Pub System

**Data:** 2026-03-06
**Metodo:** Consolidacao dos relatorios de auditoria geral, multi-tenant, banco e infra
**Regra:** NENHUM codigo alterado. Apenas planejamento.

---

## 1. Resumo de Problemas

| Severidade | Qtd | Areas |
|-----------|-----|-------|
| P0 — Critico | 10 | Seguranca (3), Multi-tenant (4), Infra (2), Deps (1) |
| P1 — Alto | 15 | Banco (5), Docker (4), CI/CD (2), Codigo (4) |
| P2 — Medio | 8 | Docs (3), Organizacao (3), Config (2) |
| **Total** | **33** | — |

---

## 2. Plano de Correcoes — 4 Semanas

### Semana 1 — Seguranca e Multi-Tenant (URGENTE)

**Objetivo:** Eliminar vulnerabilidades que permitem acesso indevido a dados.

| # | Tarefa | Arquivo(s) | Risco | Esforco | Teste |
|---|--------|-----------|-------|---------|-------|
| 1.1 | Rotacionar JWT Secret em producao | .env (servidor) | Sessoes existentes invalidadas | 30min | Login funciona |
| 1.2 | Rotacionar DB Password em producao | .env + PG | Restart necessario | 30min | Health check |
| 1.3 | Remover credenciais do Git history | BFG Repo-Cleaner | Force push necessario | 2h | Grep no history |
| 1.4 | Corrigir QuaseProntoScheduler — filtrar por tenant | quase-pronto.scheduler.ts | Logica muda | 2h | Test unitario |
| 1.5 | Corrigir MedalhaScheduler — filtrar por tenant | medalha.scheduler.ts | Logica muda | 2h | Test unitario |
| 1.6 | Tornar tenantId obrigatorio em validateRefreshToken | refresh-token.service.ts | Refresh pode quebrar se caller nao enviar | 1h | Test auth |
| 1.7 | Rejeitar WebSocket sem JWT valido | base-tenant.gateway.ts | Clientes sem token desconectados | 1h | Test WS |
| 1.8 | Alinhar @nestjs/common para v11 | backend/package.json | Pode quebrar imports | 2h | npm run build |

**Criterio de conclusao:** Todas vulnerabilidades P0 de seguranca e multi-tenant eliminadas. Build e testes passando.

---

### Semana 2 — Banco de Dados

**Objetivo:** Enforcement de multi-tenant no banco. Integridade referencial.

| # | Tarefa | Arquivo(s) | Risco | Esforco | Teste |
|---|--------|-----------|-------|---------|-------|
| 2.1 | Verificar dados orfaos (tenant_id IS NULL) | SQL direto no PG | Nenhum (read-only) | 30min | — |
| 2.2 | Atribuir/deletar dados orfaos | SQL + backup antes | Perda de dados se errado | 1h | Contagem antes/depois |
| 2.3 | Migration: tenant_id NOT NULL em 24 tabelas | Nova migration | Falha se orfaos existirem | 2h | migration:run |
| 2.4 | Migration: FKs tenant_id → tenants(id) CASCADE | Nova migration | Falha se dados invalidos | 2h | migration:run |
| 2.5 | Migration: 7 indices compostos | Nova migration | Nenhum (additive) | 1h | migration:run |
| 2.6 | Migration: Cliente.cpf UNIQUE [cpf, tenant_id] | Nova migration | Drop UNIQUE existente | 1h | Test com 2 tenants |
| 2.7 | Migration: Funcionario.email UNIQUE [email, tenant_id] | Nova migration | Drop UNIQUE existente | 1h | Test com 2 tenants |
| 2.8 | Herdar TenantAwareEntity em todas entities | 24 entity files | Pode alterar schema | 4h | migration:run + build |
| 2.9 | Remover empresaId de Funcionario e PontoEntrega | 2 entity files + migration | Coluna removida | 1h | Build + migration |
| 2.10 | Mover typeorm de devDeps para deps | backend/package.json | Nenhum | 5min | npm run build |

**Criterio de conclusao:** Banco com NOT NULL, FKs, indices. Nenhum dado orfao. Build passando.

**IMPORTANTE:** Fazer backup ANTES de cada migration. Testar em ambiente local primeiro.

---

### Semana 3 — Infraestrutura e CI/CD

**Objetivo:** Limpar duplicatas, corrigir CI/CD, alinhar ambientes.

| # | Tarefa | Arquivo(s) | Risco | Esforco | Teste |
|---|--------|-----------|-------|---------|-------|
| 3.1 | Deletar pasta infra/ | infra/ | Nenhum (nao usado) | 5min | docker compose up |
| 3.2 | Deletar docker-compose.prod.yml (raiz) | docker-compose.prod.yml | Nenhum (nao usado) | 5min | — |
| 3.3 | Deletar frontend/Dockerfile.prod | frontend/Dockerfile.prod | Nenhum (Vercel) | 5min | — |
| 3.4 | Remover libs Cypress do frontend/Dockerfile | frontend/Dockerfile | Imagem menor | 15min | docker compose up |
| 3.5 | Alinhar PG para v17 no docker-compose.yml | docker-compose.yml | Dados dev podem precisar recreate | 30min | docker compose up |
| 3.6 | Corrigir start:prod path | backend/package.json | — | 5min | npm run start:prod |
| 3.7 | Remover --force do npm install | backend/Dockerfile | Build pode falhar se mismatch persistir | 10min | docker build |
| 3.8 | Adicionar Redis ao docker-compose.micro.yml | docker-compose.micro.yml | Precisa config no backend | 30min | docker compose up |
| 3.9 | Reescrever deploy job no CI/CD | .github/workflows/ci.yml | Deploy muda completamente | 2h | Push + verificar |
| 3.10 | Remover continue-on-error e \|\| true | ci.yml | Jobs passam a falhar (correto) | 10min | Push |
| 3.11 | Mover 29 arquivos da raiz | Raiz do projeto | Nenhum | 1h | — |
| 3.12 | Remover package.json da raiz | package.json | node_modules fantasma | 10min | Build frontend |

**Criterio de conclusao:** Repositorio limpo, CI/CD funcional com Docker, ambientes alinhados.

---

### Semana 4 — Documentacao e Testes

**Objetivo:** Documentacao reflete realidade. Testes cobrem correcoes.

| # | Tarefa | Arquivo(s) | Risco | Esforco | Teste |
|---|--------|-----------|-------|---------|-------|
| 4.1 | Atualizar README.md | README.md | — | 1h | Leitura |
| 4.2 | Atualizar docs/current/DEPLOY.md | DEPLOY.md | — | 1h | Leitura |
| 4.3 | Atualizar docs/current/ARQUITETURA.md | ARQUITETURA.md | — | 1h | Leitura |
| 4.4 | Atualizar docs/current/SETUP_LOCAL.md | SETUP_LOCAL.md | — | 30min | Seguir passos |
| 4.5 | Deletar DEPLOY_HIBRIDO.md | DEPLOY_HIBRIDO.md | Credenciais removidas | 5min | — |
| 4.6 | Deletar GUIA_RAPIDO_SERVIDORES.md | GUIA_RAPIDO_SERVIDORES.md | Credenciais removidas | 5min | — |
| 4.7 | Escrever testes para schedulers (tenant isolation) | *.spec.ts | — | 3h | npm test |
| 4.8 | Escrever testes para refresh token (cross-tenant) | *.spec.ts | — | 2h | npm test |
| 4.9 | Escrever teste E2E multi-tenant | e2e/ | — | 4h | npm run test:e2e |
| 4.10 | Deploy final na VM | scripts/deploy.sh | Risco padrao de deploy | 1h | Health check |

**Criterio de conclusao:** Docs atualizados, testes cobrindo correcoes criticas, deploy bem-sucedido.

---

## 3. Detalhamento Tecnico das Correcoes

### 3.1 Scheduler Cross-Tenant (Tarefa 1.4 e 1.5)

**Problema atual:**
```typescript
// medalha.scheduler.ts
const garcons = await this.funcionarioRepository.find({
  where: { cargo: Cargo.GARCOM },
});
// Retorna garcons de TODOS os tenants
```

**Correcao proposta:**
```typescript
// Opcao A: Iterar por tenant
@Inject() private tenantService: TenantService;

async verificarMedalhasGarcons() {
  const tenants = await this.tenantService.findAllActive();
  for (const tenant of tenants) {
    const garcons = await this.funcionarioRepository
      .createQueryBuilder('f')
      .where('f.cargo = :cargo', { cargo: Cargo.GARCOM })
      .andWhere('f.tenant_id = :tenantId', { tenantId: tenant.id })
      .getMany();
    
    for (const garcom of garcons) {
      // ... logica existente
    }
  }
}
```

**Mesmo padrao para QuaseProntoScheduler.**

### 3.2 RefreshToken Cross-Tenant (Tarefa 1.6)

**Problema atual:**
```typescript
async validateRefreshToken(token: string, tenantId?: string) {
  // Se tenantId for undefined, check e PULADO
  if (tenantId && refreshToken.tenantId && refreshToken.tenantId !== tenantId) {
```

**Correcao proposta:**
```typescript
async validateRefreshToken(token: string, tenantId: string) {
  // tenantId agora e obrigatorio
  if (refreshToken.tenantId !== tenantId) {
    throw new ForbiddenException('...');
  }
```

**Callers que precisam atualizar:**
- `auth.service.ts` → `refreshAccessToken()` deve sempre enviar tenantId
- Extrair tenantId do JWT expirado ou do subdomain

### 3.3 WebSocket JWT (Tarefa 1.7)

**Problema atual:** `BaseTenantGateway.joinTenantRoom()` aceita fallback via query param.

**Correcao proposta:**
```typescript
joinTenantRoom(client: Socket): string | null {
  const token = client.handshake.auth?.token;
  if (!token) {
    client.disconnect();
    return null;
  }
  try {
    const payload = this.jwtService.verify(token);
    if (!payload.tenantId) {
      client.disconnect();
      return null;
    }
    client.join(`tenant_${payload.tenantId}`);
    return payload.tenantId;
  } catch {
    client.disconnect();
    return null;
  }
}
```

### 3.4 Migration tenant_id NOT NULL (Tarefa 2.3)

```typescript
export class MakeTenantIdNotNull implements MigrationInterface {
  private tables = [
    'ambientes', 'avaliacoes', 'abertura_caixa', 'clientes',
    'comandas', 'comanda_agregados', 'empresas', 'eventos',
    'funcionarios', 'item_pedido', 'medalhas', 'medalha_funcionario',
    'mesas', 'paginas_evento', 'pagina_evento_media', 'pedidos',
    'pontos_entrega', 'produtos', 'subscription', 'payment_transactions',
    'turnos', 'audit_logs',
  ];

  async up(queryRunner: QueryRunner) {
    // Verificar orfaos ANTES
    for (const table of this.tables) {
      const count = await queryRunner.query(
        `SELECT COUNT(*) as c FROM "${table}" WHERE tenant_id IS NULL`
      );
      if (count[0].c > 0) {
        throw new Error(`Tabela ${table} tem ${count[0].c} registros sem tenant_id. Corrija antes.`);
      }
    }
    // Aplicar NOT NULL
    for (const table of this.tables) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN tenant_id SET NOT NULL`
      );
    }
  }

  async down(queryRunner: QueryRunner) {
    for (const table of this.tables) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN tenant_id DROP NOT NULL`
      );
    }
  }
}
```

### 3.5 CI/CD Deploy Job (Tarefa 3.9)

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
          ./scripts/deploy.sh
      # Sem continue-on-error — falha real e reportada
```

O `scripts/deploy.sh` ja faz: backup, git pull, docker build, health check, rollback.

---

## 4. Ordem de Execucao (Checklist)

### Pre-requisitos

- [ ] Backup completo do banco de producao
- [ ] Acesso SSH ao servidor Oracle
- [ ] Acesso ao Cloudflare Dashboard
- [ ] Branch `fix/auditoria-2026-03` criada

### Semana 1 — Seguranca

- [ ] 1.1 Rotacionar JWT Secret
- [ ] 1.2 Rotacionar DB Password
- [ ] 1.3 BFG Repo-Cleaner para credenciais
- [ ] 1.4 Corrigir QuaseProntoScheduler
- [ ] 1.5 Corrigir MedalhaScheduler
- [ ] 1.6 RefreshToken tenantId obrigatorio
- [ ] 1.7 WebSocket rejeitar sem JWT
- [ ] 1.8 Alinhar @nestjs/common v11
- [ ] **Teste: npm run build + npm test + docker compose up**

### Semana 2 — Banco

- [ ] 2.1 Verificar dados orfaos
- [ ] 2.2 Limpar dados orfaos
- [ ] 2.3 Migration NOT NULL
- [ ] 2.4 Migration FKs
- [ ] 2.5 Migration indices compostos
- [ ] 2.6 Migration cpf UNIQUE composto
- [ ] 2.7 Migration email UNIQUE composto
- [ ] 2.8 Herdar TenantAwareEntity
- [ ] 2.9 Remover empresaId
- [ ] 2.10 Mover typeorm para deps
- [ ] **Teste: migration:run + npm run build + teste local completo**

### Semana 3 — Infraestrutura

- [ ] 3.1 Deletar infra/
- [ ] 3.2 Deletar docker-compose.prod.yml
- [ ] 3.3 Deletar frontend/Dockerfile.prod
- [ ] 3.4 Remover Cypress do Dockerfile
- [ ] 3.5 PG v17 no dev
- [ ] 3.6 Corrigir start:prod
- [ ] 3.7 Remover --force
- [ ] 3.8 Adicionar Redis ao micro
- [ ] 3.9 Reescrever CI/CD deploy
- [ ] 3.10 Remover continue-on-error
- [ ] 3.11 Mover arquivos soltos
- [ ] 3.12 Remover package.json raiz
- [ ] **Teste: docker compose up (dev) + push CI**

### Semana 4 — Docs e Deploy

- [ ] 4.1-4.6 Atualizar documentacao
- [ ] 4.7-4.9 Escrever testes
- [ ] 4.10 Deploy final
- [ ] **Teste: Health check + smoke test manual**

---

## 5. Riscos e Mitigacao

| Risco | Probabilidade | Mitigacao |
|-------|--------------|-----------|
| Migration falha em prod (dados orfaos) | Alta | Verificar/limpar orfaos ANTES |
| NestJS v11 quebra algo | Media | Rodar testes completos antes de merge |
| CI/CD deploy falha | Baixa | Deploy manual via scripts/deploy.sh como fallback |
| Redis em prod causa OOM | Media | Limitar memoria do Redis, monitorar |
| BFG corrompe history | Baixa | Backup do repo antes, force push coordenado |
| UNIQUE composto quebra dados existentes | Media | Verificar duplicatas antes da migration |

---

## 6. Metricas de Sucesso

Apos completar as 4 semanas:

| Metrica | Antes | Depois |
|---------|-------|--------|
| Vulnerabilidades P0 | 10 | 0 |
| Vulnerabilidades P1 | 15 | 0 |
| Docker Compose files | 6 | 2 (dev + micro) |
| Arquivos soltos na raiz | 29 | 0 |
| tenant_id nullable | 24 tabelas | 0 |
| FKs para tenants | 0 | 24 |
| Indices compostos | 0 | 7+ |
| CI/CD deploy funcional | Nao | Sim |
| Docs atualizados | 40% | 100% |
| Testes multi-tenant | 0 | 5+ |
