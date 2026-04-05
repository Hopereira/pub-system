# Docker — Problema de Rede e Volume em Produção

**Data do incidente:** 2026-04-04  
**Impacto:** Backend 502 Bad Gateway por ~2h  
**Status:** ✅ Resolvido

---

## O Problema

O `docker-compose.micro.yml` não declarava rede explícita. Isso causou uma situação
onde containers criados em momentos diferentes ficaram em redes distintas e não
conseguiam se comunicar por hostname.

### Histórico de criação dos containers

```
1. [remoto] infra/docker-compose.micro.yml up  → criou pub-postgres na rede infra_pub-network
2. [CI]     docker compose ... up --no-deps backend → criou pub-backend na rede pub-system_default
3. Backend tenta conectar em DB_HOST=postgres → DNS não resolve → EAI_AGAIN → 502
```

### Diagrama do problema

```
┌──────────────────────────┐    ┌──────────────────────────┐
│   rede: infra_pub-network │    │   rede: pub-system_default│
│                           │    │                           │
│  ┌─────────────────────┐  │    │  ┌─────────────────────┐  │
│  │    pub-postgres      │  │    │  │    pub-backend       │  │
│  │  alias: postgres     │  │    │  │  DB_HOST=postgres    │  │
│  └─────────────────────┘  │    │  └──────────┬──────────┘  │
│                           │    │             │              │
└──────────────────────────┘    │     EAI_AGAIN postgres     │
                                 └──────────────────────────┘
         REDES ISOLADAS — backend não enxerga o postgres
```

### Diagrama da solução

```
┌──────────────────────────────────────────────────┐
│                rede: pub-network                   │
│                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │    pub-postgres      │  │    pub-backend       │ │
│  │  alias: postgres     │◄─┤  DB_HOST=postgres    │ │
│  │  volume: infra_pg    │  │                     │ │
│  └─────────────────────┘  └─────────────────────┘ │
│                                                   │
└──────────────────────────────────────────────────┘
         MESMA REDE — hostname postgres resolve ✅
```

---

## Solução Permanente no docker-compose.micro.yml

```yaml
services:
  postgres:
    networks:
      - pub-network          # ← declarar explicitamente

  backend:
    networks:
      - pub-network          # ← mesma rede

  watchtower:
    networks:
      - pub-network          # ← mesma rede

volumes:
  infra_postgres_data:
    external: true           # ← volume real com dados de produção

networks:
  pub-network:
    name: pub-network        # ← nome fixo, não varia entre deploys
    driver: bridge
```

**Regras críticas:**
1. Sempre declarar `networks` explicitamente — nunca confiar na rede `default` do compose
2. Usar `name: pub-network` fixo — sem isso, Docker cria `<projeto>_pub-network` e o nome muda
3. Volume com `external: true` — garante que o compose não cria um volume vazio acidentalmente

---

## Diagnóstico Rápido (502 Bad Gateway)

```bash
# 1. Checar status dos containers
docker ps --format 'table {{.Names}}\t{{.Status}}'

# 2. Checar em qual rede cada container está
docker network inspect pub-network 2>&1 | grep -A3 '"Name"'

# 3. Ver logs do backend
docker logs pub-backend --tail 30

# Se aparecer "EAI_AGAIN postgres" → problema de rede
# Se aparecer "relation X does not exist" → problema de volume (banco vazio)
```

## Correção Manual (emergência)

```bash
# Caso backend e postgres estejam em redes diferentes:
docker network connect pub-network pub-postgres
docker restart pub-backend
# Aguardar ~60s e testar: curl http://localhost:3000/health

# Caso postgres esteja em volume errado (banco vazio):
docker stop pub-postgres && docker rm pub-postgres
docker run -d --name pub-postgres \
  --network pub-network --network-alias postgres \
  -e POSTGRES_USER=pubuser \
  -e POSTGRES_PASSWORD=PubS3nhaF0rte2026 \
  -e POSTGRES_DB=pubsystem \
  -v infra_postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 --restart unless-stopped \
  --health-cmd='pg_isready -U pubuser -d pubsystem' \
  --health-interval=10s --health-timeout=5s --health-retries=5 \
  postgres:17-alpine
```

---

## Volumes em Produção

A VM Oracle tem múltiplos volumes Docker criados por diferentes versões do compose ao longo do tempo:

| Volume | Status | Conteúdo |
|--------|--------|----------|
| `infra_postgres_data` | ✅ **EM USO** | Dados reais de produção |
| `pub_postgres_data` | ⚠️ Vazio | Criado pelo compose novo, sem dados |
| `pub-system_pub_postgres_data` | ⚠️ Legado | Não usar |
| `pub-system_postgres_data` | ⚠️ Legado | Não usar |
| `infra_postgres_data` | ✅ **EM USO** | Dados reais |

**NUNCA** apagar `infra_postgres_data` sem fazer backup antes.
