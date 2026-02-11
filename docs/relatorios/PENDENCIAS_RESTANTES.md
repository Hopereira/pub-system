# Pendências Restantes

**Data:** 2026-02-11  
**Contexto:** Após execução das correções P0/P1/P2 da auditoria de segurança

---

## Crítico (requer ação manual)

### 1. SSH key no histórico git

**Risco:** A chave `ssh-key-2025-12-11.key` foi removida do HEAD mas ainda existe no histórico de commits.  
**Ação:**
```bash
# Opção 1: BFG Repo Cleaner (recomendado)
java -jar bfg.jar --delete-files ssh-key-2025-12-11.key
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force

# Opção 2: git filter-repo
git filter-repo --path ssh-key-2025-12-11.key --invert-paths
git push --force
```
**Após reescrita:** Todos os colaboradores devem re-clonar o repositório.  
**Revogar:** A chave SSH deve ser revogada no servidor Oracle VM (`~/.ssh/authorized_keys`).

---

### ~~2. Frontend: migrar para httpOnly cookies~~ ✅ RESOLVIDO

Implementado em `api.ts`, `authService.ts`, `AuthContext.tsx`. Auto-refresh transparente no 401, logout revoga no backend.

---

## Alto (melhorias recomendadas)

### 2. Testes E2E completos

**Status:** Criado `auth.e2e-spec.ts`. Existem `caixa.e2e-spec.ts`, `pedido.e2e-spec.ts`, `fluxo-financeiro.e2e-spec.ts`.  
**Falta:**
- Teste de isolamento multi-tenant (criar 2 tenants, verificar que dados não vazam)
- Teste de feature guard (tenant FREE não acessa endpoint PRO)
- Executar e validar todos os testes existentes

### 4. npm audit fix

**Status:** 9 vulnerabilidades reportadas (3 high, 3 moderate, 3 low).  
**Ação:** `cd backend && npm audit fix --legacy-peer-deps`  
**Bloqueio:** Conflito de peer deps com `@nestjs/swagger@11.2.5` vs `@nestjs/common@10.x`. Requer upgrade coordenado do NestJS ou downgrade do Swagger.

### 5. Scan de secrets no histórico

**Ação:**
```bash
# Instalar gitleaks
brew install gitleaks  # ou choco install gitleaks

# Scan completo
gitleaks detect --source . --verbose
```

---

## Médio (próximas sprints)

### 6. Deploy do pipeline CI/CD

O arquivo `.github/workflows/ci.yml` foi criado mas precisa ser testado no GitHub Actions. Verificar:
- Secrets configurados no repo (se necessário)
- Cache de node_modules funcionando
- Testes passando no CI

### 7. Backup automatizado em produção

O script `scripts/backup-db.sh` foi criado mas precisa ser:
- Copiado para o servidor Oracle VM
- Configurado como cron job: `0 */6 * * * /path/to/backup-db.sh >> /var/log/backup.log 2>&1`
- Testado com restore: `gunzip -c backup.sql.gz | psql -U postgres -d pub_system_db`

### 8. Credenciais padrão em produção

**Risco:** `admin@admin.com / admin123` é a credencial padrão do seeder.  
**Ação:** Alterar senha do admin em produção. Considerar desabilitar seeder quando `NODE_ENV=production`.

### 9. Monitoramento externo

**Sugestão:** Configurar UptimeRobot (gratuito) para monitorar:
- `https://api.pubsystem.com.br/health` — backend
- `https://pub-system.vercel.app` — frontend

---

## Baixo (nice to have)

### 10. Role GERENTE sem uso

O enum `Cargo.GERENTE` existe mas não é usado em nenhum `@Roles()` decorator.  
**Opções:** Remover do enum ou implementar permissões específicas para gerente.

### 11. Dark mode

Frontend tem `dark mode ready` mas não ativado. Baixa prioridade.
