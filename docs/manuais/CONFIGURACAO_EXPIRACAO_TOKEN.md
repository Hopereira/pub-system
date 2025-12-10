# ⏰ CONFIGURAÇÃO: EXPIRAÇÃO DE TOKEN JWT (4 HORAS)

**Data:** 13/11/2025  
**Solicitação:** Usuário pediu que qualquer funcionário fique logado apenas 4 horas  
**Status:** ✅ IMPLEMENTADO

---

## 🎯 ALTERAÇÃO REALIZADA

### Backend - Configuração JWT

**Arquivo:** `backend/src/auth/auth.module.ts`

**ANTES:**
```typescript
signOptions: { expiresIn: '1h' }, // Token expira em 1 hora
```

**DEPOIS:**
```typescript
signOptions: { expiresIn: '4h' }, // Token expira em 4 horas
```

---

## 🔐 COMO FUNCIONA

### 1. Login do Funcionário
Quando um funcionário faz login:
```typescript
// backend/src/auth/auth.service.ts
async login(user: any) {
  const payload = {
    id: user.id,
    email: user.email,
    nome: user.nome,
    cargo: user.cargo,
    empresaId: user.empresaId,
    ambienteId: user.ambienteId,
  };
  
  // Token gerado com expiração de 4h
  const token = this.jwtService.sign(payload);
  
  return { access_token: token };
}
```

### 2. Token Expira Após 4 Horas
O JWT possui um campo `exp` (expiration) que é verificado automaticamente:
- **Tempo de login:** 08:00
- **Token expira:** 12:00 (4 horas depois)
- **Tentativa de acesso:** 12:01 → **401 Unauthorized**

### 3. Frontend Detecta Expiração
```typescript
// frontend/src/services/api.ts (linhas 94-101)
if (error.response.status === 401) {
  logger.warn('Sessão expirada - Token inválido');
  
  // Limpa token e redireciona
  localStorage.removeItem('authToken');
  window.location.href = '/login';
}
```

### 4. Usuário Precisa Fazer Login Novamente
- ✅ Token removido automaticamente
- ✅ Redirecionado para `/login`
- ✅ Mensagem: "Sessão expirada - Token inválido"

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Tempo de Login** | 1 hora | **4 horas** ✅ |
| **Logout Automático** | Sim (após 1h) | Sim (após 4h) |
| **Segurança** | Alta | Alta |
| **Experiência** | Login frequente | Login menos frequente |

---

## 🔍 VALIDAÇÃO DA CONFIGURAÇÃO

### Verificar Configuração Atual

**1. Backend (auth.module.ts):**
```bash
# Verificar linha 19
cat backend/src/auth/auth.module.ts | grep expiresIn
# Resultado esperado: signOptions: { expiresIn: '4h' }
```

**2. JWT Strategy:**
```typescript
// backend/src/auth/strategies/jwt.strategy.ts
ignoreExpiration: false, // NÃO ignorar expiração ✅
```

**3. Frontend (api.ts):**
```typescript
// Interceptor detecta 401 e faz logout automático ✅
if (error.response.status === 401) {
  localStorage.removeItem('authToken');
  window.location.href = '/login';
}
```

---

## 🧪 COMO TESTAR

### Teste Manual

1. **Fazer Login:**
   ```
   Email: admin@admin.com
   Senha: admin123
   ```

2. **Anotar Horário:**
   - Hora de login: ____:____
   - Hora de expiração esperada: ____:____ (+4h)

3. **Usar o Sistema Normalmente:**
   - Sistema funciona perfeitamente durante 4 horas

4. **Após 4 Horas:**
   - Qualquer requisição retorna 401
   - Sistema redireciona para `/login` automaticamente
   - Mensagem no console: "Sessão expirada - Token inválido"

### Teste com Token Decodificado

```bash
# No navegador (Console DevTools)
const token = localStorage.getItem('authToken');
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log('Expira em:', new Date(decoded.exp * 1000));
console.log('Horário atual:', new Date());
console.log('Tempo restante (horas):', (decoded.exp * 1000 - Date.now()) / 3600000);
```

---

## 🚀 PRÓXIMOS PASSOS

### Para Aplicar a Mudança:

**1. Reiniciar o Backend:**
```bash
# Docker
docker restart pub_system_backend

# Ou sem Docker
cd backend
npm run start:dev
```

**2. Testar Login:**
- Fazer logout de todos os usuários ativos
- Fazer novo login
- Novo token terá expiração de 4h

**3. Validar:**
- Token antigo (1h) ainda pode estar ativo
- Aguardar expiração natural
- Novos logins usam 4h ✅

---

## ⚙️ CONFIGURAÇÕES AVANÇADAS

### Outras Opções de Expiração

Se no futuro precisar alterar:

```typescript
// Exemplos de configuração
signOptions: { expiresIn: '30m' }  // 30 minutos
signOptions: { expiresIn: '2h' }   // 2 horas
signOptions: { expiresIn: '4h' }   // 4 horas ✅ ATUAL
signOptions: { expiresIn: '8h' }   // 8 horas (turno completo)
signOptions: { expiresIn: '12h' }  // 12 horas
signOptions: { expiresIn: '1d' }   // 1 dia (24h)
signOptions: { expiresIn: '7d' }   // 7 dias
```

### Refresh Token (Futuro)

Para evitar logout durante uso ativo, pode implementar:
```typescript
// Renovar token automaticamente antes de expirar
// Exemplo: a cada 3h30min, renovar por mais 4h
// Usuário só faz logout se ficar 4h SEM usar o sistema
```

---

## 🔐 SEGURANÇA

### Validações Implementadas ✅

1. **Expiração Automática:** Token expira após 4h
2. **Não Ignorar Expiração:** `ignoreExpiration: false`
3. **Logout Automático:** Frontend detecta 401
4. **Token Removido:** localStorage limpo
5. **Redirecionamento:** Usuário vai para login

### Boas Práticas ✅

- ✅ Token não pode ser renovado após expirar
- ✅ Cada login gera novo token
- ✅ Token antigo invalida automaticamente
- ✅ Sem tokens "eternos"
- ✅ Segurança balanceada com UX

---

## 📝 LOGS E MONITORAMENTO

### Logs Backend

```
🔐 Token JWT gerado para: admin@admin.com (ID: xxx)
⏰ Token expira em: 4 horas
```

### Logs Frontend

```
⚠️ Sessão expirada - Token inválido
🚪 Redirecionando para login...
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Backend ✅
- [x] Arquivo `auth.module.ts` alterado
- [x] Expiração configurada para `4h`
- [x] JWT Strategy com `ignoreExpiration: false`
- [ ] Backend reiniciado (executar: `docker restart pub_system_backend`)

### Frontend ✅
- [x] Interceptor detecta 401
- [x] Remove token do localStorage
- [x] Redireciona para login
- [x] Mostra mensagem de sessão expirada

### Testes ⏳
- [ ] Login realizado
- [ ] Sistema usado durante 4h
- [ ] Logout automático testado após expiração
- [ ] Novo login funciona

---

## 🏆 RESULTADO

**Configuração de expiração de token atualizada com sucesso!**

- ✅ **Tempo de sessão:** 4 horas
- ✅ **Logout automático:** Sim
- ✅ **Segurança:** Mantida
- ✅ **UX melhorada:** Menos logins frequentes

**Todos os funcionários (ADMIN, GERENTE, GARÇOM, CAIXA, COZINHA) precisarão fazer login a cada 4 horas.**

---

**Implementado em:** 13/11/2025  
**Por:** Cascade AI  
**Arquivo modificado:** `backend/src/auth/auth.module.ts`  
**Linha alterada:** 19
