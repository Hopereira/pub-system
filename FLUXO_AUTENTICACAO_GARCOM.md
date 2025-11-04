# 🔐 Fluxo de Autenticação do Garçom

## 📋 Visão Geral

O garçom precisa ser **cadastrado pelo administrador** antes de poder acessar o sistema.

---

## 🔄 Fluxo Completo

### 1️⃣ Cadastro pelo Admin
```
1. Admin acessa painel administrativo
2. Admin vai em "Funcionários"
3. Admin clica "Cadastrar Novo Funcionário"
4. Admin preenche:
   - Nome: "Paulo Silva"
   - Email: "paulo@pub.com"
   - Senha: "senha123"
   - Cargo: GARCOM
5. Admin salva
6. Funcionário criado no banco
```

### 2️⃣ Login do Garçom
```
1. Garçom acessa: http://localhost:3001/login
2. Garçom digita:
   - Email: paulo@pub.com
   - Senha: senha123
3. Sistema valida credenciais
4. Sistema gera JWT token
5. Sistema redireciona baseado no cargo
```

### 3️⃣ Redirecionamento por Cargo
```typescript
// Após login bem-sucedido:
if (user.cargo === 'GARCOM') {
  redirect('/garcom')  // Página do garçom
} else if (user.cargo === 'ADMIN') {
  redirect('/dashboard')  // Dashboard admin
} else if (user.cargo === 'CAIXA') {
  redirect('/caixa')  // Página do caixa
} else if (user.cargo === 'COZINHA') {
  redirect('/cozinha')  // Página da cozinha
}
```

### 4️⃣ Página do Garçom
```
1. Garçom é redirecionado para /garcom
2. Sistema carrega dados do funcionário logado
3. Garçom vê:
   - Card de check-in/check-out
   - Suas estatísticas
   - Equipe ativa
   - Ações rápidas
```

---

## 🔒 Segurança

### Endpoints Públicos (Sem Login)
- ❌ Nenhum para garçom
- ✅ Apenas cliente (QR Code)

### Endpoints Protegidos (Com Login)
- ✅ `/garcom` - Página do garçom
- ✅ `/dashboard/gestaopedidos` - Gestão de pedidos
- ✅ Todos os endpoints de turno

### Check-in/Check-out
**Importante:** Mesmo sendo endpoints públicos na API, a página `/garcom` requer login!

```typescript
// turno.controller.ts
@Post('check-in')  // Público na API
// MAS a página /garcom requer login

// Isso permite:
// 1. Garçom fazer check-in pela página (logado)
// 2. Futuro: Terminal de ponto sem login
```

---

## 🎯 Implementação do Redirecionamento

### 1. Atualizar AuthContext
```typescript
// frontend/src/context/AuthContext.tsx

const login = async ({ email, senha }: LoginCredentials) => {
  const { access_token } = await apiLogin(email, senha);
  const decodedUser: User = jwtDecode(access_token);

  localStorage.setItem('authToken', access_token);
  setUser(decodedUser);
  setToken(access_token);

  // Redirecionar baseado no cargo
  redirectByCargo(decodedUser.cargo);
};

const redirectByCargo = (cargo: string) => {
  switch (cargo) {
    case 'GARCOM':
      window.location.href = '/garcom';
      break;
    case 'ADMIN':
      window.location.href = '/dashboard';
      break;
    case 'CAIXA':
      window.location.href = '/caixa';
      break;
    case 'COZINHA':
      window.location.href = '/cozinha';
      break;
    default:
      window.location.href = '/';
  }
};
```

### 2. Proteger Rota /garcom
```typescript
// frontend/src/app/(protected)/garcom/page.tsx

'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GarcomPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  // Resto do componente...
}
```

### 3. Guard de Cargo
```typescript
// frontend/src/components/guards/CargoGuard.tsx

interface CargoGuardProps {
  allowedCargos: string[];
  children: React.ReactNode;
}

export function CargoGuard({ allowedCargos, children }: CargoGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <div>Acesso negado</div>;
  }

  if (!allowedCargos.includes(user.cargo)) {
    return (
      <div>
        <h1>Acesso Negado</h1>
        <p>Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return <>{children}</>;
}

// Uso:
<CargoGuard allowedCargos={['GARCOM']}>
  <GarcomPage />
</CargoGuard>
```

---

## 📱 Fluxo na Prática

### Cenário 1: Garçom Novo
```
1. Admin cadastra Paulo como GARCOM
2. Paulo recebe email/senha
3. Paulo acessa pub.com/login
4. Paulo digita credenciais
5. Sistema valida
6. Paulo é redirecionado para /garcom
7. Paulo faz check-in
8. Paulo começa a trabalhar
```

### Cenário 2: Garçom Retornando
```
1. Paulo acessa pub.com
2. Sistema verifica token no localStorage
3. Token válido? Redireciona para /garcom
4. Token inválido? Redireciona para /login
```

### Cenário 3: Acesso Negado
```
1. Paulo tenta acessar /dashboard (admin)
2. Sistema verifica cargo
3. Cargo = GARCOM (não é ADMIN)
4. Sistema mostra "Acesso Negado"
5. Botão "Voltar para minha página"
```

---

## 🔧 Próximas Implementações

### 1. Atualizar Login Page
- [ ] Adicionar redirecionamento por cargo
- [ ] Feedback visual por tipo de usuário
- [ ] Lembrar último cargo logado

### 2. Criar Guards
- [ ] CargoGuard component
- [ ] Proteger rotas por cargo
- [ ] Mensagens de erro amigáveis

### 3. Melhorar UX
- [ ] Loading states
- [ ] Animações de transição
- [ ] Feedback de login

---

## ✅ Checklist de Segurança

- [x] Garçom precisa ser cadastrado pelo admin
- [x] Garçom precisa fazer login
- [x] Token JWT é validado
- [x] Página /garcom requer autenticação
- [ ] Redirecionamento automático por cargo
- [ ] Guard de cargo implementado
- [ ] Mensagens de erro adequadas

---

## 📝 Notas Importantes

### Diferença: API vs Página
- **API `/turnos/check-in`**: Público (para terminal de ponto futuro)
- **Página `/garcom`**: Protegida (requer login)

### Token JWT
- Armazenado no localStorage
- Validado em cada requisição
- Expira após X horas
- Renovado automaticamente

### Cargos Disponíveis
```typescript
enum Cargo {
  ADMIN = 'ADMIN',
  CAIXA = 'CAIXA',
  GARCOM = 'GARCOM',
  COZINHA = 'COZINHA'
}
```

---

**Resumo:** Garçom é cadastrado pelo admin → Faz login → É redirecionado para /garcom → Faz check-in → Trabalha! ✅
