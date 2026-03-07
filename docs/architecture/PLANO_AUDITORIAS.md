# Plano de Auditorias — Pub System

**Criado:** 2026-03-06
**Proxima auditoria completa:** 2026-06-06

---

## Auditoria Semanal (Automatizada via CI)

Incluir no pipeline CI/CD:

```yaml
# Adicionar ao ci.yml
- name: Security scan
  run: |
    cd backend && npm audit --audit-level=high
    npx gitleaks detect --source . --no-git
```

| Verificacao | Comando | Criterio de falha |
|-------------|---------|-------------------|
| npm audit backend | `npm audit --audit-level=high` | High ou Critical |
| npm audit frontend | `npm audit --audit-level=high` | High ou Critical |
| Secrets scan | `gitleaks detect` | Qualquer match |

---

## Auditoria Mensal (Manual — 1h)

**Responsavel:** Dev lead
**Checklist:**

- [ ] `npm outdated` em backend/ e frontend/ — atualizar patches
- [ ] `docker images` — remover imagens nao usadas
- [ ] Verificar logs de erro em producao: `docker logs pub-backend --since 720h | grep ERROR | wc -l`
- [ ] Verificar uso de disco: `df -h` na VM
- [ ] Verificar backup: `ls -lh ~/backups/ | tail -5`
- [ ] Verificar certificado SSL: `curl -vI https://api.pubsystem.com.br 2>&1 | grep expire`

---

## Auditoria Trimestral (Manual — 4h)

**Responsavel:** Arquiteto / Dev Senior
**Checklist:**

### Codigo
- [ ] Verificar se `docs/architecture/current-system.md` ainda reflete o codigo
- [ ] Buscar `@InjectRepository` fora de platform-level services
- [ ] Buscar `server.emit(` sem tenant room isolation
- [ ] Verificar que todos os repos herdam BaseTenantRepository
- [ ] Conferir Joi schema vs variaveis reais do .env

### Infraestrutura
- [ ] Testar restore de backup: `pg_restore -U pubuser -d pubsystem_test < backup.dump`
- [ ] Verificar que Nginx esta com config atualizada
- [ ] Verificar que Cloudflare DNS records estao corretos
- [ ] Conferir que Docker images estao atualizadas
- [ ] Verificar uptime e performance com `curl -w "%{time_total}" https://api.pubsystem.com.br/health`

### Seguranca
- [ ] Executar `gitleaks detect --source . --verbose`
- [ ] Verificar que ENABLE_SETUP=false em producao
- [ ] Verificar que Swagger esta desabilitado em producao
- [ ] Testar isolamento multi-tenant: login tenant A, acessar dados tenant B

### Documentacao
- [ ] Revisar docs/architecture/ vs implementacao real
- [ ] Verificar que nenhum doc novo contem credenciais

---

## Auditoria Semestral (Completa — 8h)

**Responsavel:** Equipe completa
**Escopo:** Tudo acima + items abaixo

### Performance
- [ ] Identificar queries lentas: `SELECT * FROM pg_stat_user_tables ORDER BY n_live_tup DESC`
- [ ] Verificar indices: `SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0`
- [ ] Load test basico: `ab -n 1000 -c 10 https://api.pubsystem.com.br/health`
- [ ] Verificar tamanho do banco: `SELECT pg_size_pretty(pg_database_size('pubsystem'))`

### Disaster Recovery
- [ ] Simular falha do backend: `docker stop pub-backend` + verificar restore
- [ ] Simular falha do banco: restore de backup em ambiente de teste
- [ ] Verificar tempo de recovery

### Compliance
- [ ] Verificar LGPD: dados pessoais criptografados ou com acesso controlado
- [ ] Verificar retencao de logs: nao manter logs infinitamente
- [ ] Verificar que audit_log registra acessos a dados sensiveis

---

## Registro de Auditorias Executadas

| Data | Tipo | Auditor | Resultado | Relatorio |
|------|------|---------|-----------|-----------|
| 2026-02-11 | Completa | Cascade AI | 7 riscos P0 resolvidos | docs/relatorios/AUDITORIA_FINAL.md |
| 2026-03-02 | Multi-tenant | Cascade AI | 29 vulnerabilidades corrigidas | docs/RELATORIO_ISOLAMENTO_MULTITENANT.md |
| 2026-03-06 | Completa | Cascade AI | 19 divergencias, 14 riscos | docs/architecture/AUDITORIA_2026-03-06.md |
