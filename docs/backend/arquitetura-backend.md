# Arquitetura do Backend

## Stack

| Tecnologia | Versao | Funcao |
|------------|--------|--------|
| NestJS | 10.x | Framework principal |
| TypeORM | 0.3.x | ORM e migrations |
| PostgreSQL | 17 | Banco de dados |
| Socket.IO | - | WebSocket (tempo real) |
| Joi | - | Validacao de variaveis de ambiente |
| Decimal.js | - | Calculos monetarios precisos |
| Passport/JWT | - | Autenticacao |

## Estrutura de Modulos

```
backend/src/
  auth/                  # Autenticacao JWT, refresh tokens, guards
  cache/                 # Modulo de cache (in-memory ou Redis)
  common/
    guards/              # CustomThrottlerGuard
    logger/              # Logger customizado
    monitoring/          # Rate limit monitor
    tenant/              # Multi-tenancy (interceptor, guard, resolver)
  database/
    data-source.ts       # Configuracao TypeORM para migrations
    migrations/          # Arquivos de migracao
    seeder.module.ts     # Seed de dados iniciais
  health/                # Endpoint /health
  jobs/                  # Jobs agendados (ScheduleModule)
  modulos/
    ambiente/            # Ambientes (Salao, Varanda, etc.)
    analytics/           # Dashboard analitico
    audit/               # Auditoria de acoes
    avaliacao/           # Avaliacoes de clientes
    caixa/               # Operacoes de caixa
    cliente/             # Cadastro de clientes
    comanda/             # Comandas (abertura, fechamento, itens)
    empresa/             # Empresa/Tenant principal
    evento/              # Eventos
    funcionario/         # Funcionarios e cargos
    medalha/             # Sistema de medalhas/gamificacao
    mesa/                # Mesas e status
    pagina-evento/       # Paginas publicas de eventos
    payment/             # Pagamentos (Mercado Pago, PagSeguro, PicPay)
    pedido/              # Pedidos (CRUD + WebSocket gateway)
    ponto-entrega/       # Pontos de entrega
    produto/             # Cardapio e produtos
    turno/               # Turnos de trabalho
  shared/
    storage/             # Upload de imagens (GCS ou local)
```

## Conexao com Banco

Configurada em `app.module.ts` via `TypeOrmModule.forRootAsync`:

- Le variaveis `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE` via `ConfigService`
- SSL controlado por `DB_SSL` (deve ser `false` para PostgreSQL local)
- `autoLoadEntities: true` carrega todas as entidades registradas nos modulos
- `synchronize` controlado por `DB_SYNC` (usar apenas no primeiro deploy)

Para migrations, o arquivo `database/data-source.ts` usa as mesmas variaveis para criar o `DataSource` do TypeORM CLI.

## Validacao de Ambiente

O `ConfigModule` valida todas as variaveis obrigatorias na inicializacao:

| Variavel | Regra |
|----------|-------|
| `DB_HOST` | Obrigatoria |
| `DB_USER` | Obrigatoria |
| `DB_PASSWORD` | Obrigatoria |
| `DB_DATABASE` | Obrigatoria |
| `JWT_SECRET` | Obrigatoria, minimo 32 caracteres |
| `FRONTEND_URL` | Obrigatoria, URL valida |
| `ADMIN_EMAIL` | Opcional, formato email |
| `ADMIN_SENHA` | Opcional, minimo 8 caracteres |

Se alguma variavel obrigatoria estiver ausente, o backend nao inicia.

## Healthcheck

Endpoint: `GET /health`

Retorna status do backend e conexao com o banco. Usado pelo Docker Compose (`depends_on: condition: service_healthy`) e pelo Nginx para verificacao.

## WebSocket

O modulo de pedidos expoe um gateway Socket.IO para atualizacoes em tempo real (novos pedidos, mudancas de status). O CORS do WebSocket e restrito a `FRONTEND_URL`.

## Rate Limiting

Tres camadas configuradas globalmente via `ThrottlerModule`:

| Camada | Janela | Limite |
|--------|--------|--------|
| short | 1 segundo | 30 requisicoes |
| medium | 10 segundos | 200 requisicoes |
| long | 1 minuto | 1000 requisicoes |

Guard global: `CustomThrottlerGuard`.

## Jobs Agendados

O `ScheduleModule` do NestJS esta habilitado. Jobs definidos em `jobs/jobs.module.ts` executam tarefas periodicas (limpeza, notificacoes, etc.).
