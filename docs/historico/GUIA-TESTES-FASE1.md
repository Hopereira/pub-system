# 🧪 Guia de Testes - Fase 1

**Data:** 04/12/2024  
**Branch:** dev-test  
**Progresso:** 50% completo

---

## 📋 Checklist de Testes

### **1. ✅ Testar Swagger**

**Objetivo:** Verificar se a documentação da API está funcionando

**Passos:**

1. **Iniciar backend:**
```bash
cd backend
npm install  # Se necessário
docker-compose up -d postgres
npm run start:dev
```

2. **Acessar Swagger:**
```
http://localhost:3000/api
```

3. **Verificar:**
- [ ] Página do Swagger carrega
- [ ] Seção "Caixa" está visível
- [ ] 10 endpoints estão listados
- [ ] Cada endpoint tem descrição
- [ ] Exemplos de request/response estão presentes
- [ ] Botão "Try it out" funciona

**Endpoints para testar:**
- POST /caixa/abertura
- POST /caixa/fechamento
- POST /caixa/sangria
- POST /caixa/venda
- GET /caixa/aberto
- GET /caixa/aberto/todos
- GET /caixa/:id/resumo
- GET /caixa/:id/movimentacoes
- GET /caixa/:id/sangrias
- GET /caixa/historico

**✅ Resultado esperado:** Todos os endpoints documentados e testáveis

---

### **2. ✅ Testar Testes Unitários**

**Objetivo:** Verificar se os testes unitários passam

**Passos:**

1. **Rodar testes:**
```bash
cd backend
npm test -- caixa.service.spec.ts
```

2. **Verificar saída:**
```
PASS  src/modulos/caixa/caixa.service.spec.ts
  CaixaService
    ✓ deve estar definido
    abrirCaixa
      ✓ deve abrir um caixa com valor inicial
      ✓ deve lançar erro se já existe caixa aberto
    fecharCaixa
      ✓ deve calcular diferenças corretamente
      ✓ deve lançar erro se caixa não encontrado
      ✓ deve lançar erro se caixa já está fechado
    registrarSangria
      ✓ deve registrar uma sangria corretamente
      ✓ deve lançar erro se caixa não está aberto
    registrarVenda
      ✓ deve registrar uma venda e criar movimentação
    getCaixaAberto
      ✓ deve retornar caixa aberto por turno
      ✓ deve lançar erro se caixa não encontrado
    getResumoCaixa
      ✓ deve retornar resumo completo do caixa

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
```

**✅ Resultado esperado:** 12 testes passando

---

### **3. ✅ Testar Testes E2E**

**Objetivo:** Verificar se os testes end-to-end passam

**Pré-requisitos:**
- PostgreSQL rodando
- Banco de dados criado
- Seeder executado (dados de teste)

**Passos:**

1. **Preparar ambiente:**
```bash
cd backend
docker-compose up -d postgres
npm run migration:run
npm run seed
```

2. **Rodar testes E2E:**
```bash
npm run test:e2e -- caixa.e2e-spec
```

3. **Verificar saída:**
```
PASS  test/caixa.e2e-spec.ts
  Caixa (e2e)
    POST /caixa/abertura
      ✓ deve abrir um caixa com valor inicial
      ✓ deve retornar 400 se tentar abrir caixa já aberto
      ✓ deve retornar 400 se valor inicial for negativo
      ✓ deve retornar 401 se não autenticado
    GET /caixa/aberto
      ✓ deve retornar caixa aberto por turno
      ✓ deve retornar 404 se caixa não encontrado
    POST /caixa/venda
      ✓ deve registrar uma venda no caixa
      ✓ deve retornar 400 se valor for negativo
    POST /caixa/sangria
      ✓ deve registrar uma sangria
      ✓ deve retornar 400 se valor for zero
      ✓ deve retornar 400 se motivo for muito curto
    GET /caixa/:aberturaCaixaId/resumo
      ✓ deve retornar resumo completo do caixa
      ✓ deve retornar 404 se caixa não encontrado
    GET /caixa/:aberturaCaixaId/movimentacoes
      ✓ deve retornar movimentações do caixa
    GET /caixa/:aberturaCaixaId/sangrias
      ✓ deve retornar sangrias do caixa
    POST /caixa/fechamento
      ✓ deve fechar o caixa com cálculo de diferenças
      ✓ deve retornar 400 se tentar fechar caixa já fechado
    GET /caixa/historico
      ✓ deve retornar histórico de fechamentos
      ✓ deve filtrar por data
    GET /caixa/aberto/todos
      ✓ deve retornar todos os caixas abertos (admin)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
```

**✅ Resultado esperado:** 20 testes passando

---

### **4. ✅ Testar Sistema de Backup**

**Objetivo:** Verificar se o backup funciona

**Passos:**

1. **Tornar scripts executáveis:**
```bash
cd backend/scripts
chmod +x backup.sh setup-cron.sh restore.sh
```

2. **Executar backup de teste:**
```bash
./backup.sh
```

3. **Verificar saída:**
```
[2024-12-04 19:30:00] Criando diretório de backup...
[2024-12-04 19:30:00] Verificando container PostgreSQL...
[2024-12-04 19:30:01] Iniciando backup do banco pub_system_db...
[2024-12-04 19:30:05] ✅ Backup concluído com sucesso!
   Arquivo: backup_pub_system_db_20241204_193000.sql.gz
   Tamanho: 2.3M
[2024-12-04 19:30:05] Verificando integridade do backup...
[2024-12-04 19:30:05] ✅ Backup íntegro
[2024-12-04 19:30:05] Limpando backups antigos (>30 dias)...
[2024-12-04 19:30:05] Nenhum backup antigo para remover
[2024-12-04 19:30:05] Backups disponíveis:
-rw-r--r-- 1 user user 2.3M Dec  4 19:30 backup_pub_system_db_20241204_193000.sql.gz
[2024-12-04 19:30:05] =========================================
[2024-12-04 19:30:05] 📊 Estatísticas:
   Total de backups: 1
   Espaço utilizado: 2.3M
   Retenção: 30 dias
[2024-12-04 19:30:05] =========================================
[2024-12-04 19:30:05] ✅ Script de backup finalizado com sucesso!
```

4. **Verificar arquivo criado:**
```bash
ls -lh /backups/postgres/backup_*.sql.gz
```

5. **Testar integridade:**
```bash
gunzip -t /backups/postgres/backup_*.sql.gz
echo $?  # Deve retornar 0
```

**✅ Resultado esperado:** Backup criado e íntegro

---

### **5. ✅ Testar Restore**

**Objetivo:** Verificar se a restauração funciona

**⚠️ ATENÇÃO:** Isso vai sobrescrever o banco atual!

**Passos:**

1. **Listar backups:**
```bash
ls -lh /backups/postgres/backup_*.sql.gz
```

2. **Executar restore:**
```bash
./restore.sh backup_pub_system_db_20241204_193000.sql.gz
```

3. **Confirmar quando solicitado:**
```
⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER o banco de dados atual!
⚠️  Todos os dados atuais serão PERDIDOS!

Deseja continuar? Digite 'SIM' para confirmar: SIM
```

4. **Verificar saída:**
```
[2024-12-04 19:35:00] =========================================
[2024-12-04 19:35:00] 🔄 RESTORE DE BACKUP
[2024-12-04 19:35:00] =========================================
[2024-12-04 19:35:00] Arquivo: backup_pub_system_db_20241204_193000.sql.gz
[2024-12-04 19:35:00] Banco: pub_system_db
[2024-12-04 19:35:00] Container: pub_system_postgres
[2024-12-04 19:35:00] =========================================
[2024-12-04 19:35:01] Verificando container PostgreSQL...
[2024-12-04 19:35:01] Verificando integridade do backup...
[2024-12-04 19:35:01] ✅ Backup íntegro
[2024-12-04 19:35:01] Criando backup de segurança do estado atual...
[2024-12-04 19:35:05] ✅ Backup de segurança criado: /tmp/safety_backup_20241204_193501.sql.gz
[2024-12-04 19:35:05] Desconectando usuários ativos...
[2024-12-04 19:35:05] Removendo banco de dados atual...
[2024-12-04 19:35:06] ✅ Banco de dados removido
[2024-12-04 19:35:06] Criando novo banco de dados...
[2024-12-04 19:35:06] ✅ Banco de dados criado
[2024-12-04 19:35:06] Restaurando backup...
[2024-12-04 19:35:15] ✅ Backup restaurado com sucesso!
[2024-12-04 19:35:15] Verificando restore...
[2024-12-04 19:35:15] =========================================
[2024-12-04 19:35:15] ✅ RESTORE CONCLUÍDO COM SUCESSO!
[2024-12-04 19:35:15] =========================================
[2024-12-04 19:35:15] 📊 Estatísticas:
   Tabelas restauradas: 25
   Backup usado: backup_pub_system_db_20241204_193000.sql.gz
   Backup de segurança: /tmp/safety_backup_20241204_193501.sql.gz
[2024-12-04 19:35:15] =========================================
```

**✅ Resultado esperado:** Restore concluído com sucesso

---

### **6. ✅ Testar Cron Job (Opcional)**

**Objetivo:** Configurar backup automático

**⚠️ Requer sudo**

**Passos:**

1. **Executar setup:**
```bash
sudo ./setup-cron.sh
```

2. **Verificar cron configurado:**
```bash
crontab -l | grep backup
```

3. **Saída esperada:**
```
0 3 * * * /path/to/backend/scripts/backup.sh >> /var/log/pub-system/backup.log 2>&1
```

4. **Ver logs (após 3h da manhã):**
```bash
tail -f /var/log/pub-system/backup.log
```

**✅ Resultado esperado:** Cron job configurado

---

## 🎯 Teste Manual Completo (Frontend + Backend)

### **Cenário: Fluxo Completo do Caixa**

**Pré-requisitos:**
- Backend rodando: `npm run start:dev`
- Frontend rodando: `npm run dev`
- Usuário CAIXA criado

**Passos:**

1. **Login como CAIXA:**
   - Acessar: `http://localhost:3001/login`
   - Email: `caixa@test.com`
   - Senha: `senha123`
   - ✅ Deve redirecionar para `/caixa`

2. **Abrir Caixa:**
   - Clicar em "Abrir Caixa"
   - Informar valor inicial: R$ 100,00
   - Observação: "Abertura teste"
   - ✅ Caixa deve abrir com sucesso

3. **Registrar Venda:**
   - Ir para "Terminal"
   - Buscar comanda
   - Registrar pagamento PIX: R$ 125,50
   - ✅ Venda deve ser registrada

4. **Registrar Sangria:**
   - Clicar em "Sangria"
   - Valor: R$ 500,00
   - Motivo: "Pagamento fornecedor"
   - Autorizado por: "João Silva - Gerente"
   - ✅ Sangria deve ser registrada

5. **Ver Resumo:**
   - Clicar em "Resumo"
   - ✅ Deve mostrar:
     - Valor inicial: R$ 100,00
     - Total vendas: R$ 125,50
     - Total sangrias: R$ 500,00
     - Saldo atual

6. **Fechar Caixa:**
   - Clicar em "Fechar Caixa"
   - Informar valores contados
   - ✅ Deve calcular diferenças automaticamente
   - ✅ Caixa deve fechar com sucesso

---

## 📊 Checklist Final

### **Swagger**
- [ ] Página carrega
- [ ] Seção "Caixa" visível
- [ ] 10 endpoints listados
- [ ] Exemplos presentes
- [ ] "Try it out" funciona

### **Testes Unitários**
- [ ] 12 testes passam
- [ ] Sem erros
- [ ] Cobertura ~60%

### **Testes E2E**
- [ ] 20 testes passam
- [ ] Todos os endpoints testados
- [ ] Validações funcionando

### **Backup**
- [ ] Script executável
- [ ] Backup criado
- [ ] Arquivo íntegro
- [ ] Logs estruturados

### **Restore**
- [ ] Restore funciona
- [ ] Backup de segurança criado
- [ ] Rollback funciona

### **Cron Job (Opcional)**
- [ ] Cron configurado
- [ ] Backup automático às 3h
- [ ] Logs funcionando

---

## 🐛 Troubleshooting

### **Erro: "Cannot find module"**
**Solução:**
```bash
cd backend
npm install
```

### **Erro: "Container não está rodando"**
**Solução:**
```bash
docker-compose up -d postgres
```

### **Erro: "Permission denied" (scripts)**
**Solução:**
```bash
chmod +x backend/scripts/*.sh
```

### **Testes E2E falhando**
**Solução:**
```bash
# Limpar banco de teste
docker-compose down -v
docker-compose up -d postgres
npm run migration:run
npm run seed
```

### **Swagger não carrega**
**Solução:**
```bash
# Verificar se backend está rodando
curl http://localhost:3000/health

# Reiniciar backend
npm run start:dev
```

---

## 📝 Relatório de Testes

**Preencher após testes:**

| Teste | Status | Observações |
|-------|--------|-------------|
| Swagger | ⬜ | |
| Testes Unitários | ⬜ | |
| Testes E2E | ⬜ | |
| Backup | ⬜ | |
| Restore | ⬜ | |
| Cron Job | ⬜ | |
| Teste Manual | ⬜ | |

**Legenda:**
- ✅ Passou
- ❌ Falhou
- ⚠️ Passou com ressalvas
- ⬜ Não testado

---

## 🎉 Próximos Passos

Após todos os testes passarem:

1. ✅ Documentar resultados
2. ✅ Criar PR para `main` (se aplicável)
3. ✅ Continuar com Fase 1 (50% restante):
   - Validações robustas (4h)
   - Tratamento de erros amigável (3h)

---

**Boa sorte nos testes!** 🚀
