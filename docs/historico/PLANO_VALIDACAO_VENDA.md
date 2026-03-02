# 🎯 PLANO DE VALIDAÇÃO PARA VENDA - PUB SYSTEM

**Data:** 09/12/2025  
**Objetivo:** Validar sistema para comercialização  
**Duração:** 2 semanas (10 dias úteis)

---

## 📊 ANÁLISE DO ESTADO ATUAL vs PLANO ORIGINAL

### ✅ O QUE JÁ ESTÁ IMPLEMENTADO

| Item do Plano | Status Real | Evidência |
|---------------|-------------|-----------|
| Sangria > Saldo bloqueada | ✅ **IMPLEMENTADO** | `caixa.service.ts:245-248` - Valida saldo antes de sangria |
| RolesGuard no CaixaController | ✅ **CORRIGIDO HOJE** | `caixa.controller.ts:26-27` - JwtAuthGuard + RolesGuard |
| ExceptionFilter global | ✅ **IMPLEMENTADO** | `http-exception.filter.ts` - Mensagens amigáveis |
| Credenciais hardcoded removidas | ✅ **CORRIGIDO HOJE** | `login/page.tsx:25-26` - Campos vazios |
| CORS via variável ambiente | ✅ **CORRIGIDO HOJE** | `main.ts:27` - `process.env.FRONTEND_URL` |
| Script de Backup | ✅ **EXISTE** | `backend/scripts/backup.sh` - Completo com S3/GCS |
| Script de Restore | ✅ **EXISTE** | `backend/scripts/restore.sh` - Com backup de segurança |
| Decimal.js para cálculos | ✅ **IMPLEMENTADO** | Usado em `comanda.service.ts` |

### ⚠️ O QUE PRECISA VALIDAÇÃO/AJUSTE

| Item | Status | Ação Necessária |
|------|--------|-----------------|
| Fechamento sem movimentações | ❓ **VERIFICAR** | Testar se permite fechar caixa vazio |
| Senha de gerente para risco | ❌ **NÃO EXISTE** | Campo `autorizadoPor` existe mas não valida senha |
| console.log em produção | ⚠️ **PARCIAL** | Removidos 5 arquivos, restam ~31 |
| Teste de restore | ❌ **NÃO VALIDADO** | Script existe mas nunca foi testado |
| Teste de carga WebSocket | ❌ **NÃO FEITO** | Precisa simular múltiplos clientes |

---

## 📅 PLANO REVISADO - SEMANA 1: Blindagem Financeira

### Dia 1: Validações de Caixa (AJUSTADO)

**O que já funciona:**
- ✅ Sangria bloqueada quando > saldo

**O que testar/implementar:**
```typescript
// VERIFICAR: Fechamento sem movimentações é permitido?
// Arquivo: backend/src/modulos/caixa/caixa.service.ts

// Se permitir, adicionar validação:
if (movimentacoes.length === 0 && sangrias.length === 0) {
  throw new BadRequestException('Não é possível fechar caixa sem movimentações');
}
```

**Teste manual:**
1. Abrir caixa com R$ 100
2. Tentar sangria de R$ 150 → Deve bloquear ✅
3. Tentar fechar sem vendas → Verificar comportamento

---

### Dia 2: Segurança de Rotas (✅ JÁ FEITO)

**Status:** COMPLETO na correção de hoje

**Verificação:**
```bash
# Testar acesso como GARCOM ao /caixa
curl -X GET http://localhost:3000/caixa/aberto \
  -H "Authorization: Bearer <TOKEN_GARCOM>"
# Esperado: 403 Forbidden
```

---

### Dia 3: Tratamento de Erros (✅ JÁ EXISTE)

**Status:** `AllExceptionsFilter` já implementado

**Verificar se mensagens são amigáveis:**
- `BadRequestException` → Mostra mensagem customizada ✅
- `NotFoundException` → Mostra "não encontrado" ✅
- Erro 500 → Verificar se não expõe stack trace

---

### Dia 4: Limpeza de Código (PARCIAL)

**Já removidos (hoje):**
- `PedidoProntoCard.tsx`
- `PaginaEventoFormDialog.tsx`
- `VisualizadorMapa.tsx`
- `ConfiguradorMapa.tsx`
- `EventoFormDialog.tsx`
- `turnoService.ts`
- `authService.ts`
- `firstAccessService.ts`

**Comando para encontrar restantes:**
```bash
cd frontend
grep -r "console.log" src/components --include="*.tsx" | wc -l
```

---

### Dia 5: Teste de Fluxo Financeiro

**Cenário completo:**
1. Garçom abre comanda na Mesa 1
2. Adiciona 2x Cerveja (R$ 10 cada) = R$ 20
3. Adiciona 1x Porção (R$ 35) = R$ 35
4. Total esperado: R$ 55
5. Caixa fecha comanda com PIX
6. Verificar: Movimentação de R$ 55 registrada?
7. Verificar: Saldo do caixa aumentou R$ 55?

---

## 📅 PLANO REVISADO - SEMANA 2: Testes e Infraestrutura

### Dia 6: Teste de Backup/Restore (CRÍTICO)

**Scripts existem mas precisam ser testados!**

```bash
# 1. Criar backup
cd backend/scripts
./backup.sh

# 2. Verificar arquivo criado
ls -la /backups/postgres/

# 3. SIMULAR DESASTRE (em ambiente de dev!)
# Dropar uma tabela importante
docker exec pub_system_postgres psql -U postgres -d pub_system_db \
  -c "DROP TABLE comandas CASCADE;"

# 4. Restaurar
./restore.sh backup_pub_system_db_XXXXXXXX.sql.gz

# 5. Verificar se tabela voltou
docker exec pub_system_postgres psql -U postgres -d pub_system_db \
  -c "SELECT COUNT(*) FROM comandas;"
```

---

### Dia 7-8: Testes de Usabilidade

**Roteiro baseado em PLANO_TESTES_USABILIDADE_227.md:**

| Seção | Foco | Prioridade |
|-------|------|------------|
| 1 | Login/Autenticação | Alta |
| 2 | Check-in/Check-out | Alta |
| 3 | Mapa Visual | Média |
| 4 | Abertura de Comanda | Alta |
| 5 | Gestão de Pedidos | Alta |
| 6 | Rastreamento de Itens | Média |
| 7 | Fechamento de Comanda | **CRÍTICA** |
| 8 | Operações de Caixa | **CRÍTICA** |

---

### Dia 9: Teste de Carga WebSocket

**Cenário:**
1. Abrir 10 abas do navegador
2. 5 como GARCOM, 3 como COZINHA, 2 como CAIXA
3. Criar pedido em uma aba
4. Medir tempo até aparecer nas outras

**Métricas aceitáveis:**
- Latência < 500ms
- Sem perda de mensagens
- CPU do servidor < 80%

---

### Dia 10: Build de Produção

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm run start

# Verificar variáveis de ambiente
cat .env.production
# Deve conter:
# - FRONTEND_URL (não localhost)
# - DATABASE_URL (produção)
# - JWT_SECRET (forte)
```

---

## 🏁 CHECKLIST FINAL PARA VENDA

### Caixa Inquebrável
- [ ] Sangria > Saldo → Bloqueada
- [ ] Fechamento bate centavo por centavo
- [ ] Diferenças são registradas e visíveis
- [ ] Histórico de movimentações completo

### Segurança Ativa
- [ ] GARCOM não acessa /caixa (403)
- [ ] GARCOM não acessa /dashboard (403)
- [ ] Token expirado redireciona para login
- [ ] Sem credenciais no código

### Backup Funciona
- [ ] Script de backup executa sem erros
- [ ] Arquivo .sql.gz é criado
- [ ] Restore recupera dados corretamente
- [ ] Tempo de restore < 1 hora

### Extras Recomendados
- [ ] Build de produção funciona
- [ ] WebSocket estável com 10+ conexões
- [ ] Mensagens de erro são amigáveis
- [ ] Logs não expõem dados sensíveis

---

## 📝 NOTAS IMPORTANTES

### O que mudou do plano original:

1. **RolesGuard** - Já foi aplicado hoje no CaixaController
2. **ExceptionFilter** - Já existe e funciona
3. **Credenciais hardcoded** - Já foram removidas hoje
4. **Scripts de backup** - Existem e são completos, só precisam ser testados

### Riscos identificados:

1. **Senha de gerente para sangria** - Campo existe (`autorizadoPor`) mas não valida senha real
2. **Fechamento sem movimentações** - Precisa verificar se é permitido
3. **console.log restantes** - ~31 ainda no código

### Prioridade de correção:

1. 🔴 **CRÍTICO:** Testar backup/restore (Dia 6)
2. 🟠 **ALTO:** Validar fechamento de caixa (Dia 1)
3. 🟡 **MÉDIO:** Remover console.log restantes (Dia 4)
4. 🟢 **BAIXO:** Senha de gerente (pode ser v2)
