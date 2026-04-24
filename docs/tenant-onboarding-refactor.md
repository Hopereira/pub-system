# Sprint 7 — Tenant Onboarding Refactor

## Resumo

Refatoração cirúrgica do fluxo de onboarding de tenants (`/primeiro-acesso`) para incluir wizard multi-step com dados da empresa, endereço, seleção de plano, pagamento e confirmação. Inclui serviço de email com fallback e fluxo de definição/recuperação de senha via token.

**Todas as mudanças são retrocompatíveis** — tenants existentes não são afetados, campos novos são nullable, e o endpoint `/registro` aceita tanto o formato V1 (campos mínimos) quanto V2 (campos expandidos).

## Mudanças

### Backend

#### 1. Migration `1745600000000-TenantOnboardingV2`
- **tenants**: `onboarding_step` (varchar 30, nullable), `email_status` (varchar 30, default 'PENDING'), `email_sent_at` (timestamp, nullable)
- **empresas**: `email` (varchar 255, nullable)
- **password_resets**: nova tabela para tokens de definição/recuperação de senha

#### 2. EmailService (`common/email/`)
- `@Global()` module com Nodemailer
- Fallback: se `EMAIL_ENABLED=false` ou SMTP não configurado → retorna `SKIPPED`
- Métodos: `send()`, `sendWelcomeEmail()`, `sendPasswordResetEmail()`
- **Nunca bloqueia o cadastro** — falha de email é best-effort

#### 3. PasswordResetService (`auth/`)
- `createToken()` — gera token hex 32 bytes, expira em 24h
- `validateToken()` — verifica existência, uso e expiração
- `resetPassword()` — valida token, hash com bcrypt, marca como usado
- `sendResetEmail()` — cria token + envia email

#### 4. PasswordResetController (`/senha/`)
- `GET /senha/validar-token?token=X` — público, valida token
- `POST /senha/definir` — público, define nova senha com token
- `POST /senha/recuperar` — público, solicita reset por email

#### 5. Tenant Provisioning (atualizado)
- Aceita campos V2 opcionais: `razaoSocial`, `cep`, `rua`, `numero`, `complemento`, `bairro`, `cidade`, `estado`
- Monta endereço completo automaticamente se campos V2 fornecidos
- Envia email de boas-vindas pós-commit (best-effort)
- Atualiza `onboardingStep` = 'COMPLETO' e `emailStatus`

#### 6. Super Admin (novos endpoints)
- `POST /super-admin/tenants/:id/resend-welcome-email` — reenvia email de boas-vindas
- `POST /super-admin/tenants/:id/generate-password-link` — gera link de definição de senha

### Frontend

#### 7. `/primeiro-acesso` — Wizard Multi-Step
5 etapas: Empresa → Endereço → Plano → Pagamento → Confirmação
- Step indicator com navegação entre passos completados
- Validação no passo 1 (dados obrigatórios), passos 2-4 opcionais
- Seleção visual de planos (Free, Basic, Pro, Enterprise)
- Confirmação com resumo completo antes de submeter
- Retrocompatível: envia apenas campos preenchidos

#### 8. `/definir-senha` — Definição de Senha
- Valida token via API ao carregar
- Estados: validando, erro, formulário, sucesso
- Diferencia SETUP (primeiro acesso) de RESET (recuperação)

### Entities Atualizadas

- **Tenant**: `onboardingStep`, `emailStatus`, `emailSentAt`
- **Empresa**: `email`
- **PasswordReset**: nova entity com `funcionarioId`, `token`, `type`, `expiresAt`, `usedAt`

## Env Vars Novas

| Variável | Default | Descrição |
|---|---|---|
| `EMAIL_ENABLED` | `false` | Habilita envio de emails |
| `SMTP_HOST` | — | Host do servidor SMTP |
| `SMTP_PORT` | `587` | Porta SMTP |
| `SMTP_USER` | — | Usuário SMTP |
| `SMTP_PASS` | — | Senha SMTP |
| `SMTP_FROM` | `Pub System <noreply@pubsystem.com.br>` | Remetente |
| `TENANT_ONBOARDING_V2_ENABLED` | `false` | Feature flag (reservado para uso futuro) |

## Testes

- **17 novos testes** (EmailService: 5, PasswordResetService: 12)
- **344 testes totais** — todos passando
- **Build**: SUCCESS (apenas erro pré-existente em e2e spec)

## Retrocompatibilidade

- ✅ Tenants existentes: nenhum campo obrigatório adicionado
- ✅ `/registro` V1 (campos mínimos): funciona normalmente
- ✅ Super Admin: endpoints existentes inalterados
- ✅ Frontend antigo: wizard aceita submissão com apenas campos obrigatórios
- ✅ Email desabilitado: fallback para SKIPPED, nunca bloqueia
- ✅ Sem migrations destrutivas
