# 🚀 Próximos Passos - Pub System

**Data:** 23 de outubro de 2025  
**Status Atual:** ✅ Críticos Completos | 🟡 Médios em Andamento

---

## 📋 Checklist Imediato

### 1. Instalar Dependências ⚠️ OBRIGATÓRIO

```powershell
# Opção 1: Usar o script automatizado
.\instalar-dependencias.ps1

# Opção 2: Manual
cd backend
npm install
cd ..

cd frontend
npm install
cd ..
```

**Por quê?** O `decimal.js` foi adicionado ao `package.json` e precisa ser instalado.

---

### 2. Configurar Variável de Ambiente ⚠️ OBRIGATÓRIO

**Arquivo:** `backend/.env`

```env
# Adicionar esta linha
FRONTEND_URL=http://localhost:3001
```

**Por quê?** O WebSocket agora valida a origem das conexões.

---

### 3. Testar Correções Críticas 🧪 RECOMENDADO

#### Teste A: Race Condition em Comanda

**Objetivo:** Verificar que duas requisições simultâneas não criam duas comandas na mesma mesa.

```bash
# Terminal 1
curl -X POST http://localhost:3000/comandas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"mesaId": "ID_DA_MESA"}'

# Terminal 2 (executar ao mesmo tempo)
curl -X POST http://localhost:3000/comandas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"mesaId": "ID_DA_MESA"}'
```

**Resultado Esperado:**
- ✅ Uma requisição: Status 201 (sucesso)
- ✅ Outra requisição: Status 400 "Mesa já está ocupada"

---

#### Teste B: Validação de Quantidade Máxima

**Objetivo:** Verificar que não é possível pedir mais de 100 unidades.

```bash
curl -X POST http://localhost:3000/pedidos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "comandaId": "ID_DA_COMANDA",
    "itens": [
      {
        "produtoId": "ID_DO_PRODUTO",
        "quantidade": 101
      }
    ]
  }'
```

**Resultado Esperado:**
- ✅ Status 400
- ✅ Mensagem: "Quantidade máxima é 100 unidades por item"

---

#### Teste C: Cálculos com Decimal.js

**Objetivo:** Verificar precisão em cálculos monetários.

**Passos:**
1. Criar pedido com 3 itens de R$ 12,50 cada
2. Verificar total: R$ 37,50 (exato)
3. Criar pedido com valores decimais variados
4. Verificar que não há perda de centavos

**Resultado Esperado:**
- ✅ Totais sempre corretos
- ✅ Sem arredondamentos incorretos
- ✅ Centavos preservados

---

#### Teste D: WebSocket CORS

**Objetivo:** Verificar que apenas o frontend autorizado pode conectar.

**Passos:**
1. Abrir console do navegador em `http://localhost:3001`
2. Verificar que WebSocket conecta com sucesso
3. Tentar conectar de outra origem (ex: `http://localhost:3002`)
4. Deve falhar com erro de CORS

**Resultado Esperado:**
- ✅ Frontend autorizado: Conecta
- ✅ Outras origens: Erro de CORS

---

#### Teste E: Timeout em Requisições

**Objetivo:** Verificar que requisições não ficam pendentes indefinidamente.

**Passos:**
1. Simular endpoint lento no backend (adicionar `setTimeout` de 35 segundos)
2. Fazer requisição do frontend
3. Após 30 segundos, deve dar timeout

**Resultado Esperado:**
- ✅ Timeout após 30 segundos
- ✅ Mensagem de erro apropriada

---

## 📝 Correções Pendentes

### Médias (5 restantes)

#### 1. Remover Polling Redundante
**Arquivo:** `frontend/src/app/(protected)/dashboard/operacional/[ambienteId]/OperacionalClientPage.tsx`

**Problema:** Polling a cada 30s mesmo com WebSocket ativo.

**Solução:**
```typescript
// Adicionar estado de conexão no hook
const { isConnected } = useAmbienteNotification(ambienteId);

useEffect(() => {
  fetchDados();
  
  // Polling apenas se WebSocket desconectado
  if (!isConnected) {
    const intervalId = setInterval(fetchDados, 30000);
    return () => clearInterval(intervalId);
  }
}, [ambienteId, isConnected]);
```

---

#### 2. Adicionar Debounce na Busca
**Arquivo:** `frontend/src/app/(protected)/dashboard/operacional/caixa/page.tsx`

**Problema:** Busca dispara a cada tecla digitada.

**Solução:**
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (value: string) => {
    searchComandas(value);
  },
  500  // 500ms de debounce
);

<Input onChange={(e) => debouncedSearch(e.target.value)} />
```

**Nota:** `use-debounce` já está instalado!

---

#### 3. Implementar Paginação
**Arquivos:**
- `backend/src/modulos/pedido/pedido.service.ts`
- `backend/src/modulos/pedido/pedido.controller.ts`
- `backend/src/modulos/pedido/dto/pagination.dto.ts` (criar)

**Problema:** Retorna todos os pedidos sem limite.

**Solução:** Ver `PLANO_CORRECAO_BUGS.md` seção "Tarefa 2.5"

---

#### 4. Adicionar Índices no Banco
**Arquivo:** Criar nova migration

**Problema:** Queries lentas em colunas frequentemente buscadas.

**Solução:**
```sql
CREATE INDEX idx_comanda_status ON comanda(status);
CREATE INDEX idx_pedido_data ON pedido(data);
CREATE INDEX idx_cliente_cpf ON cliente(cpf);
CREATE INDEX idx_item_pedido_status ON item_pedido(status);
```

---

#### 5. Melhorar Tratamento de Erros
**Arquivo:** `frontend/src/components/comandas/AddItemDrawer.tsx`

**Problema:** Erro só loga no console, não notifica usuário.

**Solução:**
```typescript
const [errorProdutos, setErrorProdutos] = useState<string | null>(null);

useEffect(() => {
  if (isOpen) {
    setErrorProdutos(null);
    getProdutos()
      .then(setProdutos)
      .catch(err => {
        setErrorProdutos('Falha ao carregar produtos');
        toast.error('Falha ao carregar produtos');
      });
  }
}, [isOpen]);

// No JSX
{errorProdutos && <p className="text-red-500">{errorProdutos}</p>}
```

---

### Baixas (6 pendentes)

1. **Remover console.logs** - Substituir por logger
2. **Loading states** - Adicionar spinners em botões
3. **Validação de email** - Usar Zod no frontend
4. **Animações** - Usar Framer Motion
5. **Confirmações** - AlertDialog em ações destrutivas
6. **Validação de CPF** - Deixar comentada para testes

---

### Melhorias (4 pendentes)

1. **Retry logic** - axios-retry
2. **Cache** - React Query
3. **Soft delete** - DeleteDateColumn
4. **Health check** - @nestjs/terminus

---

## 🎯 Roadmap Sugerido

### Hoje (23/10/2025)
- [x] ✅ Corrigir 5 problemas críticos
- [x] ✅ Corrigir 3 problemas médios
- [x] ✅ Criar documentação completa
- [ ] ⏳ Instalar dependências
- [ ] ⏳ Testar correções

### Amanhã (24/10/2025)
- [ ] Implementar 5 correções médias restantes
- [ ] Adicionar testes automatizados básicos
- [ ] Code review

### Esta Semana
- [ ] Implementar 6 correções baixas
- [ ] Criar migrations para índices
- [ ] Testes em staging

### Próximas 2 Semanas
- [ ] Implementar 4 melhorias
- [ ] Testes de carga
- [ ] Deploy em produção

---

## 📚 Documentação Disponível

### Para Desenvolvedores
1. **ANALISE_BUGS_E_PROBLEMAS.md** - Análise técnica completa
2. **PLANO_CORRECAO_BUGS.md** - Código completo das correções
3. **CORRECOES_REALIZADAS.md** - O que foi feito

### Para Gestores
1. **RESUMO_ANALISE.md** - Visão executiva
2. **RESUMO_SESSAO_CORRECOES.md** - Resultados da sessão

### Para Todos
1. **PROXIMOS_PASSOS.md** - Este arquivo
2. **instalar-dependencias.ps1** - Script de instalação

---

## 🔧 Comandos Úteis

### Desenvolvimento
```powershell
# Backend
cd backend
npm run start:dev

# Frontend (outro terminal)
cd frontend
npm run dev
```

### Migrations
```powershell
cd backend
npm run typeorm:migration:run
```

### Testes
```powershell
# Backend
cd backend
npm run test

# Frontend
cd frontend
npm run test
```

### Build
```powershell
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm start
```

---

## ⚠️ Avisos Importantes

### 1. Não Fazer Deploy Sem:
- ✅ Instalar dependências (`npm install`)
- ✅ Configurar `FRONTEND_URL` no .env
- ✅ Testar correções críticas
- ✅ Executar migrations (se houver)
- ✅ Code review aprovado

### 2. Monitorar Após Deploy:
- Logs de erro
- Performance das transações
- Timeouts
- Conexões WebSocket
- Cálculos monetários

### 3. Rollback Preparado:
- Ter backup do banco
- Saber reverter migrations
- Ter versão anterior em standby

---

## 🆘 Troubleshooting

### Problema: "Cannot find module 'decimal.js'"
**Solução:** Execute `npm install` no backend

### Problema: "WebSocket connection failed"
**Solução:** Verifique `FRONTEND_URL` no `.env`

### Problema: "Quantidade máxima é 100"
**Solução:** Isso é esperado! A validação está funcionando.

### Problema: "Mesa já está ocupada"
**Solução:** Isso é esperado! A transação está funcionando.

### Problema: Cálculos errados
**Solução:** Verifique se `decimal.js` está instalado

---

## 📞 Suporte

**Dúvidas Técnicas:**
- Email: pereira_hebert@msn.com
- Telefone: (24) 99828-5751

**Documentação:**
- GitHub: [Link do repositório]
- Wiki: [Link da wiki]

---

## ✅ Checklist Final

### Antes de Continuar
- [ ] Li toda a documentação
- [ ] Instalei as dependências
- [ ] Configurei variáveis de ambiente
- [ ] Testei correções críticas
- [ ] Entendi o que foi feito
- [ ] Sei o que fazer a seguir

### Antes de Fazer Merge
- [ ] Todas as correções testadas
- [ ] Code review aprovado
- [ ] Documentação atualizada
- [ ] Migrations executadas
- [ ] Testes passando

### Antes de Deploy
- [ ] Testes em staging
- [ ] Performance OK
- [ ] Rollback preparado
- [ ] Stakeholders notificados

---

## 🎓 Lições para Próximas Sessões

1. **Sempre começar com análise** antes de corrigir
2. **Priorizar por gravidade** (crítico primeiro)
3. **Documentar tudo** enquanto faz
4. **Testar cada correção** individualmente
5. **Criar scripts** para automatizar

---

## 🎯 Meta Final

**Objetivo:** Sistema 100% corrigido e testado

**Progresso Atual:** 35% (8/23)

**Próximo Marco:** 60% (14/23) - Todas as correções médias

**Data Alvo:** 25/10/2025

---

**"O sucesso é a soma de pequenos esforços repetidos dia após dia."**  
— Robert Collier

---

**Criado em:** 23 de outubro de 2025  
**Última Atualização:** 23 de outubro de 2025 - 14:15  
**Próxima Revisão:** Após implementar correções médias restantes
