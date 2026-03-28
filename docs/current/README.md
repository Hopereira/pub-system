# Pub System — Documentação

**Atualizado:** 2026-02-11  
**Regra:** código é a verdade absoluta. Docs divergentes são corrigidas ou deletadas.

---

## Índice

| Documento | O que contém |
|-----------|-------------|
| [ARQUITETURA.md](./ARQUITETURA.md) | Stack, módulos, entidades, multi-tenancy, WebSocket, frontend |
| [SETUP_LOCAL.md](./SETUP_LOCAL.md) | Rodar o sistema localmente (Docker) |
| [ENV_VARS.md](./ENV_VARS.md) | Todas as variáveis de ambiente |
| [API.md](./API.md) | Mapa completo de ~130 endpoints com auth/roles |
| [REGRAS_NEGOCIO.md](./REGRAS_NEGOCIO.md) | Fluxos operacionais, regras de domínio |
| [SEGURANCA.md](./SEGURANCA.md) | Auth, JWT, refresh tokens, rate-limit, audit, multi-tenant isolation |
| [../deploy/production-deploy.md](../deploy/production-deploy.md) | Deploy produção (Vercel + Oracle + Docker + Cloudflare) |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Erros comuns e soluções |

---

## Links Rápidos

| Recurso | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000 |
| Swagger UI | http://localhost:3000/api (dev only) |
| PgAdmin | http://localhost:8080 |
| Login padrão | `admin@admin.com` / `admin123` |
