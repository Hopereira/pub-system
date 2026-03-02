# 🚀 Deploy Sprint 1-2: Paginação + N+1 Queries + Cache Redis

**Data:** 17 de Dezembro de 2025  
**Ambiente:** Oracle E2.1.Micro (Backend) + Vercel (Frontend) + Neon (Database)  
**Tempo Estimado:** 30-45 minutos

---

## 📋 Pré-requisitos

- ✅ Backend rodando no Oracle Cloud
- ✅ Acesso SSH ao servidor
- ✅ PM2 gerenciando a aplicação
- ✅ Git configurado no servidor

---

## 🔄 PARTE 1: Atualizar Código no Servidor

### Passo 1.1: Conectar ao Servidor

```bash
# Conectar via SSH
ssh ubuntu@SEU_IP_ORACLE

# Verificar status atual
pm2 status
pm2 logs pub-system-backend --lines 20
```

### Passo 1.2: Fazer Backup

```bash
# Criar backup do código atual
cd /var/www/pub-system
sudo tar -czf ~/backup-pub-system-$(date +%Y%m%d-%H%M%S).tar.gz backend/

# Verificar backup criado
ls -lh ~/backup-pub-system-*.tar.gz
```

### Passo 1.3: Atualizar Código via Git

```bash
# Navegar para o diretório
cd /var/www/pub-system

# Verificar branch atual
git branch

# Fazer pull das atualizações
git pull origin main

# Ou se preferir, fazer fetch + merge
git fetch origin
git merge origin/main

# Verificar se atualizou
git log --oneline -5
```

**Arquivos que devem aparecer como atualizados:**
- `backend/src/common/dto/pagination.dto.ts` (novo)
- `backend/src/cache/cache.module.ts` (novo)
- `backend/src/modulos/produto/produto.service.ts` (modificado)
- `backend/src/modulos/produto/produto.controller.ts` (modificado)
- `backend/src/modulos/pedido/pedido.service.ts` (modificado)

---

## 📦 PARTE 2: Instalar Redis Server

### Passo 2.1: Instalar Redis

```bash
# Atualizar repositórios
sudo apt update

# Instalar Redis
sudo apt install redis-server -y

# Verificar instalação
redis-cli --version
# Deve retornar: redis-cli 7.x.x
```

### Passo 2.2: Configurar Redis para Produção

```bash
# Fazer backup da configuração original
sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.backup

# Editar configuração
sudo nano /etc/redis/redis.conf
```

**Alterações necessárias:**

```conf
# 1. Bind apenas localhost (segurança)
bind 127.0.0.1 ::1

# 2. Habilitar persistência
appendonly yes
appendfsync everysec

# 3. Configurar memória máxima (256MB para E2.1.Micro)
maxmemory 256mb
maxmemory-policy allkeys-lru

# 4. Desabilitar comandos perigosos (adicionar no final)
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
```

**Salvar:** `Ctrl+O` → `Enter` → `Ctrl+X`

### Passo 2.3: Iniciar Redis

```bash
# Reiniciar serviço
sudo systemctl restart redis-server

# Habilitar inicialização automática
sudo systemctl enable redis-server

# Verificar status
sudo systemctl status redis-server
# Deve mostrar: active (running)

# Testar conexão
redis-cli ping
# Deve retornar: PONG
```

---

## 📦 PARTE 3: Instalar Dependências Node.js

### Passo 3.1: Parar Aplicação

```bash
# Parar backend
pm2 stop pub-system-backend

# Verificar que parou
pm2 status
```

### Passo 3.2: Instalar Dependências de Cache

```bash
# Navegar para o backend
cd /var/www/pub-system/backend

# Instalar dependências
npm install @nestjs/cache-manager cache-manager cache-manager-redis-store redis

# Verificar instalação
npm list @nestjs/cache-manager cache-manager cache-manager-redis-store redis
```

**Saída esperada:**
```
├── @nestjs/cache-manager@2.1.1
├── cache-manager@5.2.4
├── cache-manager-redis-store@3.0.1
└── redis@4.6.10
```

---

## ⚙️ PARTE 4: Configurar Variáveis de Ambiente

### Passo 4.1: Adicionar Variáveis Redis

```bash
# Editar .env
nano /var/www/pub-system/backend/.env
```

**Adicionar no final do arquivo:**

```env
# ============================================
# REDIS CACHE
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Salvar:** `Ctrl+O` → `Enter` → `Ctrl+X`

### Passo 4.2: Verificar Configuração

```bash
# Verificar variáveis Redis
cat /var/www/pub-system/backend/.env | grep REDIS

# Deve mostrar:
# REDIS_HOST=localhost
# REDIS_PORT=6379
```

---

## 🔧 PARTE 5: Atualizar AppModule

### Passo 5.1: Editar app.module.ts

```bash
# Editar arquivo
nano /var/www/pub-system/backend/src/app.module.ts
```

### Passo 5.2: Adicionar Import

**No início do arquivo, após os outros imports, adicionar:**

```typescript
import { AppCacheModule } from './cache/cache.module';
```

### Passo 5.3: Adicionar ao Array de Imports

**Dentro do `@Module({ imports: [ ... ] })`, adicionar como PRIMEIRO item:**

```typescript
@Module({
  imports: [
    AppCacheModule, // ✅ ADICIONAR AQUI (primeira linha)
    ConfigModule.forRoot({
      // ... resto da configuração
    }),
    TypeOrmModule.forRootAsync({
      // ... resto
    }),
    // ... outros módulos
  ],
})
export class AppModule {}
```

**Salvar:** `Ctrl+O` → `Enter` → `Ctrl+X`

---

## 🏗️ PARTE 6: Rebuild e Restart

### Passo 6.1: Build da Aplicação

```bash
# Navegar para o backend
cd /var/www/pub-system/backend

# Limpar build anterior
rm -rf dist/

# Build
npm run build

# Verificar se build foi bem-sucedido
ls -lh dist/main.js
# Deve mostrar o arquivo com tamanho > 0
```

**Se houver erro de build:**
```bash
# Ver erro completo
npm run build 2>&1 | tee build-error.log

# Verificar sintaxe do TypeScript
npm run lint
```

### Passo 6.2: Reiniciar Aplicação

```bash
# Reiniciar com PM2
pm2 restart pub-system-backend

# Aguardar 5 segundos
sleep 5

# Verificar status
pm2 status
# Status deve ser: online

# Ver logs iniciais
pm2 logs pub-system-backend --lines 50
```

**Logs esperados (sucesso):**
```
✅ Connected to Redis
✅ TypeORM connection initialized
✅ Application is running on: http://0.0.0.0:3000
```

**Se houver erro:**
```bash
# Ver apenas erros
pm2 logs pub-system-backend --err --lines 100

# Reiniciar em modo debug
pm2 restart pub-system-backend --update-env

# Ver logs em tempo real
pm2 logs pub-system-backend --lines 0
```

---

## 🧪 PARTE 7: Testar Implementações

### Teste 7.1: Health Check

```bash
# Testar se backend está respondendo
curl -I https://api.pubsystem.com.br/health

# Deve retornar: HTTP/1.1 200 OK
```

### Teste 7.2: Testar Paginação

```bash
# Teste 1: Paginação padrão
curl -s "https://api.pubsystem.com.br/produtos" | jq '.meta'

# Deve retornar:
# {
#   "total": 150,
#   "page": 1,
#   "limit": 20,
#   "totalPages": 8,
#   "hasNext": true,
#   "hasPrev": false
# }

# Teste 2: Página específica
curl -s "https://api.pubsystem.com.br/produtos?page=2&limit=10" | jq '.meta'

# Teste 3: Ordenação
curl -s "https://api.pubsystem.com.br/produtos?sortBy=preco&sortOrder=DESC" | jq '.data[0].preco'
```

### Teste 7.3: Testar Cache Redis

```bash
# Teste 1: Primeira requisição (Cache MISS)
time curl -s "https://api.pubsystem.com.br/produtos?page=1&limit=10" > /dev/null
# Tempo esperado: ~100-200ms

# Teste 2: Segunda requisição (Cache HIT)
time curl -s "https://api.pubsystem.com.br/produtos?page=1&limit=10" > /dev/null
# Tempo esperado: ~20-50ms (5x mais rápido!)

# Teste 3: Verificar logs de cache
pm2 logs pub-system-backend --lines 20 | grep -i cache
# Deve mostrar: 🎯 Cache HIT ou ❌ Cache MISS
```

### Teste 7.4: Verificar Redis Diretamente

```bash
# Conectar ao Redis CLI
redis-cli

# Listar todas as chaves
KEYS *

# Deve mostrar algo como:
# 1) "produtos:page:1:limit:20:sort:nome:ASC"
# 2) "produtos:page:1:limit:10:sort:nome:ASC"
# 3) "produtos:all:ativos"

# Ver conteúdo de uma chave (exemplo)
GET "produtos:page:1:limit:20:sort:nome:ASC"

# Ver TTL (tempo restante em segundos)
TTL "produtos:page:1:limit:20:sort:nome:ASC"
# Deve retornar número entre 0 e 3600 (1 hora)

# Sair
exit
```

### Teste 7.5: Testar N+1 Queries (Opcional)

```bash
# Habilitar log de queries no backend
# Editar: /var/www/pub-system/backend/src/app.module.ts
# TypeOrmModule.forRootAsync({ logging: true })

# Criar pedido com 10 itens via API
# Verificar logs: deve mostrar apenas 2 queries SQL
# 1. SELECT comanda
# 2. SELECT produtos WHERE id IN (...)
```

---

## 📊 PARTE 8: Monitoramento

### Passo 8.1: Monitorar Aplicação

```bash
# Status do PM2
pm2 status

# Monitoramento em tempo real (CPU, RAM)
pm2 monit

# Logs em tempo real
pm2 logs pub-system-backend --lines 0

# Filtrar logs de cache
pm2 logs pub-system-backend | grep -i cache
```

### Passo 8.2: Monitorar Redis

```bash
# Estatísticas do Redis
redis-cli INFO stats

# Comandos executados
redis-cli INFO commandstats

# Uso de memória
redis-cli INFO memory | grep used_memory_human

# Monitorar comandos em tempo real
redis-cli MONITOR
# Ctrl+C para sair
```

### Passo 8.3: Verificar Performance

```bash
# Teste de carga (100 requisições)
for i in {1..100}; do
  curl -s "https://api.pubsystem.com.br/produtos" > /dev/null &
done
wait

# Ver estatísticas do Redis
redis-cli INFO stats | grep total_commands_processed

# Ver hit rate do cache
redis-cli INFO stats | grep keyspace_hits
redis-cli INFO stats | grep keyspace_misses
```

---

## 🔍 PARTE 9: Troubleshooting

### Problema 9.1: Backend Não Inicia

**Sintomas:** PM2 mostra status "errored"

**Solução:**
```bash
# Ver logs de erro
pm2 logs pub-system-backend --err --lines 100

# Verificar se Redis está rodando
sudo systemctl status redis-server

# Verificar conexão Redis
redis-cli ping

# Verificar variáveis de ambiente
cat /var/www/pub-system/backend/.env | grep REDIS

# Rebuild
cd /var/www/pub-system/backend
npm run build
pm2 restart pub-system-backend
```

### Problema 9.2: Redis Não Conecta

**Sintomas:** Logs mostram "ECONNREFUSED 127.0.0.1:6379"

**Solução:**
```bash
# Verificar se Redis está rodando
sudo systemctl status redis-server

# Se não estiver, iniciar
sudo systemctl start redis-server

# Verificar porta
sudo netstat -tulpn | grep 6379

# Testar conexão
redis-cli ping
```

### Problema 9.3: Cache Não Funciona

**Sintomas:** Sempre mostra "Cache MISS" nos logs

**Solução:**
```bash
# Verificar se AppCacheModule foi importado
grep -n "AppCacheModule" /var/www/pub-system/backend/src/app.module.ts

# Verificar se dependências foram instaladas
npm list @nestjs/cache-manager

# Limpar cache do Redis
redis-cli FLUSHALL

# Reiniciar aplicação
pm2 restart pub-system-backend
```

### Problema 9.4: Paginação Não Funciona

**Sintomas:** Retorna todos os produtos sem paginar

**Solução:**
```bash
# Verificar se código foi atualizado
git log --oneline -5

# Verificar se build foi feito
ls -lh /var/www/pub-system/backend/dist/modulos/produto/produto.service.js

# Rebuild
cd /var/www/pub-system/backend
npm run build
pm2 restart pub-system-backend
```

---

## ✅ PARTE 10: Validação Final

### Checklist de Validação

- [ ] Backend está online (PM2 status: online)
- [ ] Redis está rodando (systemctl status redis-server)
- [ ] Health check responde 200 OK
- [ ] Paginação funciona (retorna meta com total, page, etc)
- [ ] Cache funciona (segunda requisição é mais rápida)
- [ ] Logs mostram "Cache HIT" após segunda requisição
- [ ] Redis tem chaves armazenadas (KEYS *)
- [ ] Sem erros nos logs do PM2
- [ ] Sem erros nos logs do Redis

### Comandos de Validação Rápida

```bash
# Validação em 1 comando
echo "=== PM2 Status ===" && \
pm2 status && \
echo -e "\n=== Redis Status ===" && \
sudo systemctl status redis-server --no-pager && \
echo -e "\n=== Health Check ===" && \
curl -I https://api.pubsystem.com.br/health && \
echo -e "\n=== Cache Test ===" && \
redis-cli KEYS "produtos:*" && \
echo -e "\n=== Logs Recentes ===" && \
pm2 logs pub-system-backend --lines 10 --nostream
```

---

## 📈 Resultados Esperados

### Performance

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Listagem 500 produtos | 2000ms | 20ms (cache) | **99%** ⚡ |
| Criar pedido (10 itens) | 1100ms | 150ms | **86%** ⚡ |
| Queries por pedido | 11 | 2 | **82%** ⚡ |
| Uso de memória | 50MB | 5MB | **90%** 💾 |

### Custos

| Item | Economia Mensal |
|------|-----------------|
| Queries Neon | $200 |
| Servidor (RAM) | $20 |
| Bandwidth | $300 |
| **Total** | **$520/mês** 💰 |

---

## 🎉 Conclusão

Se todos os testes passaram, o deploy da **Sprint 1-2** foi concluído com sucesso!

**Melhorias Implementadas:**
- ✅ Paginação em endpoints de listagem
- ✅ Resolução de N+1 queries
- ✅ Cache Redis para dados estáticos

**Próximos Passos:**
- Monitorar performance nas próximas 24-48h
- Aplicar paginação em outros endpoints (comandas, pedidos)
- Implementar Sprint 3-4 (Refresh Tokens + Auditoria)

---

## 📞 Suporte

**Em caso de problemas:**
1. Verificar logs: `pm2 logs pub-system-backend --err`
2. Verificar Redis: `sudo systemctl status redis-server`
3. Fazer rollback: Restaurar backup criado no Passo 1.2
4. Contato: pereira_hebert@msn.com

---

*Documento gerado em 17/12/2025*
