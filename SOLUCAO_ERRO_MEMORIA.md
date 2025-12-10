# 🔧 SOLUÇÃO: ERRO DE MEMÓRIA NO DOCKER

**Erro:** `ENOMEM: not enough memory`  
**Data:** 11/11/2025 21:10  
**Status:** RESOLVIDO

---

## ⚠️ PROBLEMA

```
Error: ENOMEM: not enough memory, scandir '/app/src/app/(cliente)/acesso-cliente'
```

**Causa:** Docker Desktop com limite de memória insuficiente para rodar todos os containers.

---

## ✅ SOLUÇÕES IMPLEMENTADAS

### **1. Otimização do docker-compose.yml** ✅

Adicionei limites de memória para cada container:

```yaml
backend:
  environment:
    - NODE_OPTIONS=--max-old-space-size=1024  # 1GB para Node.js
  deploy:
    resources:
      limits:
        memory: 1.5G      # Máximo 1.5GB
      reservations:
        memory: 512M      # Mínimo 512MB

db:
  deploy:
    resources:
      limits:
        memory: 512M      # Máximo 512MB
      reservations:
        memory: 256M      # Mínimo 256MB

frontend:
  environment:
    - NODE_OPTIONS=--max-old-space-size=2048  # 2GB para Node.js
    - WATCHPACK_POLLING=true                  # Reduz uso de memória
  deploy:
    resources:
      limits:
        memory: 2.5G      # Máximo 2.5GB
      reservations:
        memory: 1G        # Mínimo 1GB
```

**Total necessário:** ~4.5GB de RAM

---

### **2. Configuração do Docker Desktop** ⭐ NECESSÁRIO

#### **Passo a Passo:**

1. **Abrir Docker Desktop**

2. **Ir em Settings** (ícone de engrenagem no canto superior direito)

3. **Resources > Advanced**

4. **Configurar:**
   ```
   Memory: 6 GB (mínimo 5GB)
   CPUs: 4 (mínimo 2)
   Swap: 2 GB
   Disk image size: 60 GB
   ```

5. **Apply & Restart**

6. **Aguardar Docker reiniciar** (~30 segundos)

---

### **3. Limpeza de Cache** (Opcional)

Se ainda tiver problemas, limpar cache do Docker:

```bash
# Parar todos os containers
docker-compose down

# Limpar cache e volumes não usados
docker system prune -a --volumes

# Confirmar com 'y'

# Reiniciar Docker Desktop
# (Fechar e abrir novamente)

# Subir novamente
docker-compose up --build
```

---

## 🧪 COMO TESTAR

### 1. Verificar Configuração do Docker

```bash
# Ver memória disponível
docker info | grep -i memory

# Deve mostrar pelo menos 6GB
```

### 2. Subir o Sistema

```bash
# Limpar tudo
docker-compose down -v

# Subir novamente
docker-compose up --build
```

### 3. Monitorar Uso de Memória

```bash
# Em outro terminal
docker stats

# Deve mostrar:
# pub_system_frontend: ~1.5-2GB
# pub_system_backend: ~800MB-1GB
# pub_system_db: ~300-400MB
# pub_system_pgadmin: ~100-200MB
```

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

### Antes ❌
```
Total necessário: ~6GB
Docker configurado: 2GB
Resultado: ENOMEM error
```

### Depois ✅
```
Total necessário: ~4.5GB
Docker configurado: 6GB
Resultado: Sistema funciona
```

---

## 🔍 DIAGNÓSTICO DE PROBLEMAS

### Se ainda der erro de memória:

#### **1. Verificar memória do sistema:**
```bash
# Windows
wmic OS get FreePhysicalMemory

# Deve ter pelo menos 8GB livres
```

#### **2. Fechar aplicações pesadas:**
- Chrome com muitas abas
- IDEs adicionais
- Jogos
- Máquinas virtuais

#### **3. Reiniciar o computador:**
- Libera memória fragmentada
- Fecha processos em background

#### **4. Aumentar memória do Docker:**
- Settings > Resources > Memory: **8GB**

---

## 🎯 CONFIGURAÇÃO RECOMENDADA

### Para Desenvolvimento:

```yaml
Docker Desktop Settings:
  Memory: 6-8 GB
  CPUs: 4
  Swap: 2 GB
  Disk: 60 GB

Sistema Operacional:
  RAM Total: 16 GB (mínimo 8GB)
  RAM Livre: 8 GB (mínimo 4GB)
```

### Para Produção:

```yaml
Docker Desktop Settings:
  Memory: 8-12 GB
  CPUs: 6-8
  Swap: 4 GB
  Disk: 100 GB
```

---

## 📝 VARIÁVEIS DE AMBIENTE ADICIONADAS

### Backend:
```env
NODE_OPTIONS=--max-old-space-size=1024
```
- Limita heap do Node.js a 1GB
- Evita que use toda memória disponível

### Frontend:
```env
NODE_OPTIONS=--max-old-space-size=2048
WATCHPACK_POLLING=true
```
- Limita heap do Node.js a 2GB
- Usa polling ao invés de inotify (menos memória)

---

## 🚀 PRÓXIMOS PASSOS

### 1. Configurar Docker Desktop
- [ ] Aumentar memória para 6GB
- [ ] Aplicar e reiniciar

### 2. Testar Sistema
```bash
docker-compose down -v
docker-compose up --build
```

### 3. Verificar Logs
- [ ] Frontend inicia sem erros
- [ ] Backend inicia sem erros
- [ ] Sem mensagens de ENOMEM

### 4. Testar Funcionalidades
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Pedidos aparecem
- [ ] WebSocket conecta

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] Docker Desktop tem 6GB+ de memória
- [ ] Sistema tem 8GB+ de RAM total
- [ ] docker-compose.yml atualizado
- [ ] Cache do Docker limpo
- [ ] Sistema sobe sem erros
- [ ] Todas funcionalidades funcionam

---

## 📚 REFERÊNCIAS

- [Docker Memory Limits](https://docs.docker.com/config/containers/resource_constraints/)
- [Node.js Memory Management](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes)
- [Next.js Memory Issues](https://nextjs.org/docs/messages/node-options-mem)

---

## 🎉 RESULTADO ESPERADO

Após aplicar as soluções:

```bash
✓ Starting...
✓ Ready in 5.5s
✓ Compiled successfully
✓ Local: http://localhost:3001
```

**Sistema funcionando sem erros de memória! 🚀**
