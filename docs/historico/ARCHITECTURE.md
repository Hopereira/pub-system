---
# Arquitetura Pub System (v2.0.0)

## Visão Geral
- **Frontend**: Next.js 15 hospedado na Vercel.
- **DNS / WAF**: Cloudflare (controla `api.pubsystem.com.br` e domínios públicos).
- **VM Oracle (Always Free)**: Ubuntu 22.04 com Docker instalado.
  - `pub-backend`: container NestJS.
  - `pub-postgres`: PostgreSQL 17 rodando em `5432`.
  - `watchtower`: monitora e atualiza imagens.
- **Nginx (host)**: reverse proxy gerenciando TLS e encaminhando tráfego para `docker`.

```
Usuário → Cloudflare DNS/Proxy → Vercel (frontend) → Cloudflare DNS → Nginx (Oracle VM)
        → Docker Network `pub-system_default` → pub-backend → pub-postgres
```

## Fluxo Cloudflare → Nginx → Backend → PostgreSQL
1. O DNS da Cloudflare aponta `api.pubsystem.com.br` para o IP público da VM.
2. O tráfego HTTPS termina no Nginx instalado no host (fora de containers).
3. Nginx encaminha requisições HTTP internas para `pub-backend:3000` via rede bridge `pub-system_default`.
4. O backend acessa o banco via `DATABASE_URL=postgresql://pubuser:SenhaForte123@pub-postgres:5432/pubsystem`.
5. O container `pub-postgres` mantém os dados em um volume persistente (`pub_postgres_data`).

## Rede Docker
- Nome default gerado pelo Compose: **`pub-system_default`**.
- Serviços registrados:
  - `pub-backend` (porta interna 3000).
  - `pub-postgres` (porta interna 5432).
  - `watchtower` (sem exposição externa).
- O Nginx do host se comunica com `pub-backend` usando `http://localhost:3000` (porta mapeada) ou diretamente via `pub-backend:3000` quando configurado como rede host.

## Variáveis de Ambiente Obrigatórias
| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String oficial da conexão PostgreSQL (inclui usuário/senha/host/porta/db). |
| `DB_SSL` | Deve permanecer `false` (o banco está na mesma rede e não usa SSL). |
| `BACKEND_URL` | URL pública exposta pelo Nginx/Cloudflare. |
| `FRONTEND_URL` | URL do frontend (Vercel) usada para CORS e redirects. |
| `JWT_SECRET` | Segredo mínimo 32 caracteres. |
| `ADMIN_EMAIL` / `ADMIN_SENHA` | Credenciais da conta inicial. |
| `REDIS_HOST` / `REDIS_PORT` (se habilitado) | Caso o cache Redis local esteja em uso. |

> Dica: mantenha as variáveis no arquivo `.env` da raiz e reutilize via `docker compose --env-file`.

## Componentes de Infra
- **Docker Compose**: descrito em `infra/docker-compose.yml` (desenvolvimento) e `infra/docker-compose.prod.yml` (produção/VM).
- **Watchtower**: garante updates automáticos dos containers e deve ser configurado com `DOCKER_HOST=/var/run/docker.sock`.
- **Backups**: cron no host chama scripts dentro do container `pub-postgres` (ver documentação de deploy).

## Observações
- TODO tráfego de banco é interno; nunca exponha `pub-postgres` diretamente.
- Health-checks do backend estão em `/health` e são usados por Docker/Nginx.
- Sempre que o Docker compose subir, valide se o volume `pub_postgres_data` está montado.
