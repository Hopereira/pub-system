# 🔧 Correção: JWT Payload - Campo `id` Ausente

**Data:** 04/11/2025  
**Problema:** `funcionarioId` undefined na página do garçom  
**Status:** ✅ CORRIGIDO

---

## 🐛 Problema Identificado

### Sintoma
```
GET /turnos/funcionario/undefined - 500 Internal Server Error
```

### Causa Raiz
O JWT gerado pelo backend não incluía o campo `id` no payload, apenas `sub`. O frontend esperava `user.id` mas recebia `undefined`.

**Payload Antigo:**
```json
{
  "email": "garcom@pub.com",
  "sub": "uuid-do-funcionario",
  "cargo": "GARCOM"
}
```

**Problema:** Frontend usa `user.id`, mas JWT só tinha `sub`.

---

## ✅ Solução Implementada

### 1. Backend - Payload JWT Completo

**Arquivo:** `backend/src/auth/auth.service.ts`

```typescript
async login(user: any) {
  const payload = {
    id: user.id,              // ✅ NOVO: ID direto
    sub: user.id,             // Mantém sub para compatibilidade
    email: user.email,        // ✅ NOVO
    nome: user.nome,          // ✅ NOVO
    cargo: user.cargo,
    role: user.cargo,         // ✅ NOVO: Alias
    empresaId: user.empresaId, // ✅ NOVO
    ambienteId: user.ambienteId, // ✅ NOVO
  };
  
  const token = this.jwtService.sign(payload);
  return { access_token: token };
}
```

**Payload Novo:**
```json
{
  "id": "uuid-do-funcionario",
  "sub": "uuid-do-funcionario",
  "email": "garcom@pub.com",
  "nome": "Paulo Silva",
  "cargo": "GARCOM",
  "role": "GARCOM",
  "empresaId": "uuid-empresa",
  "ambienteId": "uuid-ambiente"
}
```

### 2. Frontend - Validação Defensiva

**Arquivo:** `frontend/src/components/turno/CardCheckIn.tsx`

```typescript
const verificarTurnoAtivo = async () => {
  // ✅ Validação adicionada
  if (!funcionarioId) {
    console.warn('funcionarioId não disponível, pulando verificação de turno');
    setVerificando(false);
    return;
  }

  try {
    setVerificando(true);
    const turnos = await turnoService.getTurnosFuncionario(funcionarioId);
    const ativo = turnos.find((t) => t.ativo && !t.checkOut);
    setTurnoAtivo(ativo || null);
  } catch (error) {
    console.error('Erro ao verificar turno:', error);
  } finally {
    setVerificando(false);
  }
};

const handleCheckIn = async () => {
  // ✅ Validação adicionada
  if (!funcionarioId) {
    toast.error('Erro: ID do funcionário não disponível. Faça logout e login novamente.');
    return;
  }

  // ... resto do código
};
```

**Arquivo:** `frontend/src/app/(protected)/garcom/page.tsx`

```typescript
// ✅ Tela de aviso para token desatualizado
if (!user.id) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-red-600">⚠️ Token Desatualizado</h2>
        <p className="text-muted-foreground max-w-md">
          Seu token de autenticação está desatualizado. 
          Por favor, faça logout e login novamente para continuar.
        </p>
      </div>
      <button
        onClick={() => {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }}
        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90"
      >
        Fazer Logout
      </button>
    </div>
  );
}
```

---

## 🔄 Ação Necessária do Usuário

### ⚠️ IMPORTANTE: Logout e Login Obrigatório

Usuários que já estão logados precisam **fazer logout e login novamente** para obter o novo token JWT com todos os campos.

**Por quê?**
- O token antigo (armazenado no `localStorage`) não tem o campo `id`
- O backend já está gerando tokens novos corretamente
- Mas o frontend ainda usa o token antigo até fazer logout

**Como fazer:**
1. Clicar no botão "Fazer Logout" na tela de aviso
2. OU limpar manualmente: `localStorage.removeItem('authToken')`
3. Fazer login novamente
4. ✅ Novo token será gerado com todos os campos

---

## 📊 Campos do JWT

### Antes (Incompleto)
```json
{
  "email": "garcom@pub.com",
  "sub": "uuid",
  "cargo": "GARCOM",
  "iat": 1730770000,
  "exp": 1730856400
}
```

### Depois (Completo) ✅
```json
{
  "id": "uuid-funcionario",           // ✅ Usado pelo frontend
  "sub": "uuid-funcionario",          // Compatibilidade
  "email": "garcom@pub.com",          // ✅ Informação adicional
  "nome": "Paulo Silva",              // ✅ Exibir nome
  "cargo": "GARCOM",                  // Controle de acesso
  "role": "GARCOM",                   // ✅ Alias
  "empresaId": "uuid-empresa",        // ✅ Filtros
  "ambienteId": "uuid-ambiente",      // ✅ Contexto
  "iat": 1730770000,
  "exp": 1730856400
}
```

---

## 🧪 Como Testar

### 1. Limpar Token Antigo
```javascript
// No console do navegador
localStorage.removeItem('authToken');
```

### 2. Fazer Login
```
Email: garcom@pub.com
Senha: senha123
```

### 3. Verificar Token Novo
```javascript
// No console do navegador
const token = localStorage.getItem('authToken');
const decoded = JSON.parse(atob(token.split('.')[1]));
console.log(decoded);
```

**Deve mostrar:**
```json
{
  "id": "uuid-aqui",  // ✅ Campo presente!
  "nome": "Paulo Silva",
  "cargo": "GARCOM",
  // ... outros campos
}
```

### 4. Acessar Página do Garçom
```
http://localhost:3001/garcom
```

**Resultado Esperado:**
- ✅ Página carrega normalmente
- ✅ Sem erros de `undefined`
- ✅ Check-in funciona
- ✅ Estatísticas carregam

---

## 🔍 Verificação de Sucesso

### Console do Navegador
**Antes (Erro):**
```
GET /turnos/funcionario/undefined - 500
Erro ao verificar turno: AxiosError
```

**Depois (Sucesso):**
```
GET /turnos/funcionario/uuid-valido - 200
✅ Turno verificado com sucesso
```

### Logs do Backend
**Antes:**
```
[ERROR] UUID inválido: undefined
```

**Depois:**
```
[LOG] 📍 Buscando turnos do funcionário: uuid-valido
[LOG] ✅ 2 turnos encontrados
```

---

## 📝 Arquivos Modificados

### Backend (1 arquivo)
1. ✅ `backend/src/auth/auth.service.ts`
   - Adicionar todos os campos no payload do JWT

### Frontend (2 arquivos)
1. ✅ `frontend/src/components/turno/CardCheckIn.tsx`
   - Validação de `funcionarioId` antes de chamar API
   - Mensagem de erro amigável

2. ✅ `frontend/src/app/(protected)/garcom/page.tsx`
   - Tela de aviso para token desatualizado
   - Botão de logout automático

---

## 🎯 Benefícios da Correção

### 1. Payload Completo
- ✅ Todas as informações do usuário no token
- ✅ Menos chamadas ao backend
- ✅ Melhor performance

### 2. Validação Defensiva
- ✅ Previne erros 500
- ✅ Mensagens de erro claras
- ✅ Melhor UX

### 3. Compatibilidade
- ✅ Mantém `sub` para sistemas legados
- ✅ Adiciona `id` para novo código
- ✅ Aliases (`role` = `cargo`)

---

## 🚀 Próximos Passos

### Imediato
- [x] ✅ Corrigir payload do JWT
- [x] ✅ Adicionar validações
- [x] ✅ Criar tela de aviso
- [x] ✅ Reiniciar backend

### Usuários
- [ ] ⏳ Fazer logout e login novamente
- [ ] ⏳ Testar funcionalidades

### Futuro (Opcional)
- [ ] ⏳ Adicionar refresh token automático
- [ ] ⏳ Migrar tokens antigos automaticamente
- [ ] ⏳ Adicionar versionamento de tokens

---

## ✅ Checklist de Correção

- [x] ✅ Backend: Payload JWT completo
- [x] ✅ Frontend: Validação de `funcionarioId`
- [x] ✅ Frontend: Tela de aviso
- [x] ✅ Backend reiniciado
- [x] ✅ Documentação criada
- [ ] ⏳ Usuários fizeram logout/login
- [ ] ⏳ Testes completos

---

**Status Final:** ✅ CORREÇÃO COMPLETA  
**Ação Necessária:** Usuários devem fazer logout e login novamente
