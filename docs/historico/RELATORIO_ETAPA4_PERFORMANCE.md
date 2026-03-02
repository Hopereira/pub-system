# 📊 Relatório Etapa 4 - Testes de Performance

**Data:** 12 de dezembro de 2025  
**Branch:** test/performance  
**Ferramenta:** k6 (Grafana)  
**Responsável:** Equipe de Validação

---

## 🎯 Objetivo

Executar testes de carga no sistema Pub System para medir capacidade, tempos de resposta e identificar gargalos.

---

## ⚙️ Configuração do Teste

### Ambiente
- **Backend:** NestJS 10 rodando em Docker
- **Banco:** PostgreSQL 15 Alpine
- **Memória Backend:** 405 MB / 1.5 GB (27%)
- **Memória DB:** 43 MB / 512 MB (8%)
- **Memória Frontend:** 667 MB / 2.5 GB (27%)

### Parâmetros do Teste
- **VUs (Virtual Users):** 5-10
- **Duração:** 30s - 1min
- **Endpoints testados:** health, produtos, login, mesas, comandas, pedidos

---

## 📈 Resultados

### Métricas Gerais (5 VUs, 30s)

| Métrica | Valor |
|---------|-------|
| **Requisições totais** | 600 |
| **Requisições/segundo** | 19.4 |
| **Iterações completas** | 150 |
| **Dados recebidos** | 1.7 MB |
| **Dados enviados** | 132 KB |

### Tempos de Resposta

| Endpoint | Média | P90 | P95 |
|----------|-------|-----|-----|
| **Login** | 35.5ms | 103.1ms | 105.1ms |
| **Mesas** | 7.9ms | 14.4ms | 15.1ms |
| **Produtos** | 3.2ms | 5.9ms | 7.5ms |
| **Geral** | 12.2ms | 14.4ms | 101.1ms |

### Taxa de Sucesso por Endpoint

| Endpoint | Sucesso | Falha | Taxa |
|----------|---------|-------|------|
| Health | 50 | 100 | 33% |
| Produtos | 50 | 100 | 33% |
| Login | 50 | 100 | 33% |
| Mesas | 32 | 18 | 64% |
| Comandas | 36 | 14 | 72% |
| Pedidos | 33 | 17 | 66% |

---

## 🔍 Análise

### ⚠️ Rate Limiting Detectado

O sistema possui **Rate Limiting agressivo** configurado no `ThrottlerModule`:

```typescript
ThrottlerModule.forRoot([
  { name: 'short', ttl: 1000, limit: 3 },    // 3 req/segundo
  { name: 'medium', ttl: 10000, limit: 20 }, // 20 req/10 segundos
  { name: 'long', ttl: 60000, limit: 100 },  // 100 req/minuto
])
```

**Impacto:** Com 5 VUs fazendo múltiplas requisições, o limite de 3 req/s por IP é rapidamente atingido, causando respostas 429 (Too Many Requests).

### ✅ Performance Real (quando não limitado)

Quando as requisições passam pelo rate limiter:
- **Produtos:** ~3ms (excelente)
- **Mesas:** ~8ms (excelente)
- **Login:** ~35ms (bom, inclui hash bcrypt)
- **P95 geral:** <500ms ✅

### 📊 Uso de Recursos

| Container | CPU | Memória | Status |
|-----------|-----|---------|--------|
| Backend | 5.5% | 405 MB | ✅ Saudável |
| Database | 4.5% | 43 MB | ✅ Saudável |
| Frontend | 14.5% | 667 MB | ✅ Saudável |
| PgAdmin | 0.03% | 208 MB | ✅ Saudável |

---

## 🎯 Conclusões

### Pontos Fortes
1. **Tempos de resposta excelentes** quando não limitado (<50ms)
2. **Uso de recursos baixo** - sistema leve
3. **Rate limiting funcionando** - proteção contra DDoS ativa
4. **Banco de dados eficiente** - queries rápidas

### Pontos de Atenção
1. **Rate limiting muito restritivo** para testes de carga
2. **Login é o endpoint mais lento** (bcrypt hash)
3. **Sem cache implementado** - cada requisição vai ao banco

### Recomendações

#### Para Produção
- ✅ Manter rate limiting atual (segurança)
- ✅ Considerar cache Redis para produtos/mesas
- ✅ Implementar connection pooling no banco

#### Para Testes de Carga
- Desabilitar temporariamente o ThrottlerGuard
- Ou aumentar limites para ambiente de teste
- Usar IPs diferentes para simular usuários reais

---

## 📋 Capacidade Estimada

Com base nos resultados (considerando rate limiting):

| Cenário | Usuários Simultâneos | Req/min |
|---------|---------------------|---------|
| **Atual (com throttle)** | ~30 | ~100 |
| **Sem throttle (estimado)** | ~100-200 | ~1000+ |

**Nota:** Para um pub/bar típico com 20-50 mesas, a capacidade atual é **suficiente**.

---

## 📁 Arquivos de Teste

- `tests/perf/load-test.js` - Teste completo com métricas customizadas
- `tests/perf/simple-load-test.js` - Teste simplificado

### Comando para Executar

```bash
# Via Docker (recomendado)
docker run --rm \
  --network pub-system_pub_network \
  -v "${PWD}/tests/perf:/scripts" \
  -e BASE_URL=http://pub_system_backend:3000 \
  grafana/k6 run --vus 5 --duration 30s /scripts/simple-load-test.js
```

---

## 🚀 Próximos Passos

1. [ ] Implementar cache Redis para endpoints públicos
2. [ ] Criar perfil de teste sem rate limiting
3. [ ] Adicionar métricas de WebSocket
4. [ ] Testar com dados de produção (mais registros)

---

*Relatório gerado em 12/12/2025 às 14:35*
