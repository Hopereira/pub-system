# [F2.3] TenantProvisioningService - Automação de Novos Bares

**Data:** 18 de dezembro de 2025  
**Sprint:** Multi-tenancy  
**Status:** ✅ Implementado

---

## 📖 Descrição

Serviço para automação de criação de novos bares (tenants) em uma única transação ACID, garantindo que se algo falhar, nada seja criado.

---

## 🏗️ O que é Criado

Ao provisionar um novo tenant, o sistema cria automaticamente:

| Item | Quantidade | Descrição |
|------|------------|-----------|
| **Tenant** | 1 | Registro na tabela `tenants` |
| **Empresa** | 1 | Empresa vinculada ao tenant |
| **Ambientes** | 3 | Cozinha, Salão, Bar |
| **Mesas** | 10 | Mesas no Salão |
| **Admin** | 1 | Usuário administrador inicial |

---

## 💻 API

### CreateTenantDto

```typescript
interface CreateTenantDto {
  // Dados do Tenant
  nome: string;           // "Bar do Zé"
  slug: string;           // "bar-do-ze"
  cnpj?: string;
  plano?: TenantPlano;    // FREE, BASIC, PRO, ENTERPRISE
  
  // Dados da Empresa
  nomeFantasia: string;
  razaoSocial?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  
  // Dados do Admin
  adminNome: string;
  adminEmail: string;
  adminSenha: string;
}
```

### Uso

```typescript
const result = await tenantProvisioningService.provisionTenant({
  nome: 'Bar do Zé',
  slug: 'bar-do-ze',
  cnpj: '12.345.678/0001-90',
  plano: TenantPlano.BASIC,
  
  nomeFantasia: 'Bar do Zé',
  razaoSocial: 'Zé Bar LTDA',
  telefone: '(11) 99999-9999',
  email: 'contato@bardoze.com',
  
  adminNome: 'José Silva',
  adminEmail: 'jose@bardoze.com',
  adminSenha: 'SenhaSegura123!',
});

console.log(result.tenant.id);      // UUID do tenant
console.log(result.credenciais);    // { email, senhaTemporaria }
```

### Resultado

```typescript
interface ProvisioningResult {
  tenant: Tenant;
  empresa: Empresa;
  ambientes: Ambiente[];
  mesas: Mesa[];
  admin: Funcionario;
  credenciais: {
    email: string;
    senhaTemporaria: string;
  };
}
```

---

## 🔒 Validação de Slug

O slug deve seguir as regras:

| Regra | Exemplo Válido | Exemplo Inválido |
|-------|----------------|------------------|
| Apenas minúsculas | `bar-do-ze` | `Bar-Do-Ze` |
| Começar com letra | `bar123` | `123bar` |
| 3-50 caracteres | `bar` | `ab` |
| Sem caracteres especiais | `bar-do-ze` | `bar_do_zé` |

### Palavras Reservadas

Os seguintes slugs são bloqueados:
- `admin`, `api`, `www`, `app`, `dashboard`, `login`, `super-admin`

### Métodos Auxiliares

```typescript
// Gerar slug a partir do nome
const slug = service.generateSlug('Bar do Zé');
// Resultado: "bar-do-ze"

// Verificar disponibilidade
const available = await service.isSlugAvailable('bar-do-ze');

// Sugerir alternativas
const suggestions = await service.suggestSlugs('bar-do-ze');
// Resultado: ["bar-do-ze-1", "bar-do-ze-2", "bar-do-ze-sp"]
```

---

## ⚡ Transação ACID

O provisionamento é executado em uma única transação:

```
BEGIN TRANSACTION
  ├── INSERT tenant
  ├── INSERT empresa
  ├── INSERT ambiente (Cozinha)
  ├── INSERT ambiente (Salão)
  ├── INSERT ambiente (Bar)
  ├── INSERT mesa x 10
  └── INSERT funcionario (ADMIN)
COMMIT

Se qualquer INSERT falhar → ROLLBACK (nada é criado)
```

---

## 📊 Configuração Inicial

O tenant é criado com configuração padrão:

```json
{
  "maxMesas": 10,
  "maxFuncionarios": 5,
  "maxProdutos": 50,
  "features": ["pedidos", "comandas", "mesas"]
}
```

Estas configurações podem ser ajustadas conforme o plano contratado.

---

## 📁 Arquivos

- `backend/src/common/tenant/services/tenant-provisioning.service.ts`
- `backend/src/common/tenant/tenant.module.ts` (atualizado)
- `backend/src/common/tenant/index.ts` (atualizado)

---

## ✅ Critérios de Aceitação

| Critério | Status |
|----------|--------|
| Criar tenant + empresa + ambientes + mesas + admin | ✅ |
| Transação ACID (rollback se falhar) | ✅ |
| Validar slug para URLs amigáveis | ✅ |
| Bloquear slugs reservados | ✅ |
| Gerar slug a partir do nome | ✅ |
| Sugerir slugs alternativos | ✅ |

---

## 🚀 Próximos Passos

1. Criar endpoint REST para provisionamento
2. Integrar com envio de e-mail de boas-vindas
3. Adicionar webhook para notificação de novo cliente
4. Implementar dashboard de onboarding
