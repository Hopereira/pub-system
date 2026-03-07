# Documentacao Arquivada

**Data do arquivamento:** 2026-03-06
**Motivo:** Auditoria identificou documentos obsoletos, duplicados ou com credenciais expostas.

## Estrutura

```
docs/archive/
  historico/       ← 118 arquivos de sprints e sessoes anteriores (movidos de docs/historico/)
  relatorios/      ← 8 relatorios de auditorias anteriores (movidos de docs/relatorios/)
  raiz/            ← Arquivos obsoletos movidos da raiz do projeto
```

## Fonte da Verdade Atual

A documentacao valida esta em:

| Diretorio | Conteudo |
|-----------|----------|
| `docs/architecture/` | Arquitetura real, auditoria, estado atual |
| `docs/backend/` | Multi-tenancy, cache, rate-limit, arquitetura backend |
| `docs/current/` | API, setup local, permissoes, regras de negocio, troubleshooting |
| `docs/database/` | Schema, migrations, performance |
| `docs/infra/` | Deploy VM, Cloudflare, Nginx, banco de dados |
| `docs/operacao/` | Comandos uteis, troubleshooting |

## ATENCAO: Credenciais

Os seguintes arquivos contem credenciais em texto plano e devem ser REMOVIDOS do repositorio
(nao apenas movidos para archive):

- `DEPLOY_HIBRIDO.md` (raiz)
- `GUIA_RAPIDO_SERVIDORES.md` (raiz)
- `docs/historico/DEPLOY_HIBRIDO.md`
- `docs/historico/DEPLOY_HIBRIDO2.md`
- `docs/historico/GUIA_DEPLOY_HIBRIDO_COMPLETO.md`
- `docs/historico/GUIA_RAPIDO_SERVIDORES.md`

Apos remover, executar:
```bash
# Limpar do historico git
bfg --delete-files DEPLOY_HIBRIDO.md
bfg --delete-files GUIA_RAPIDO_SERVIDORES.md
bfg --delete-files DEPLOY_HIBRIDO2.md
bfg --delete-files GUIA_DEPLOY_HIBRIDO_COMPLETO.md
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```
