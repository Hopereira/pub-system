# 🔒 Auditoria DevOps - Segurança para Produção

**Data:** 11/12/2024  
**Branch:** `audit/devops-producao`  
**Auditor:** Engenheiro DevOps Sênior

---

## 📊 Resumo Executivo

| Categoria | Status | Risco |
|-----------|--------|-------|
| **Valores Hardcoded Críticos** | 🔴 CRÍTICO | Alto |
| **Configuração CORS** | ⚠️ PARCIAL | Médio |
| **Validação de Variáveis** | 🔴 AUSENTE | Alto |
| **Segurança JWT** | ⚠️ PARCIAL | Médio |

### 🚨 VEREDITO: **NÃO É SEGURO** subir para produção sem correções

---

## 1. ANÁLISE: Variáveis de Ambiente (.env.example)

### Arquivo: `backend/.env.example`

```env
# BANCO DE DADOS
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui        # ⚠️ Placeholder
DB_DATABASE=pub_system_db

# SEGURANÇA
JWT_SECRET=sua-chave-secreta-jwt-aqui  # ⚠️ Placeholder

# GOOGLE CLOUD STORAGE
GCS_BUCKET_NAME=seu-bucket-gcs
GOOGLE_APPLICATION_CREDENTIALS=./gcs-credentials.json

# ADMINISTRADOR INICIAL
ADMIN_EMAIL=admin@admin.com       # ⚠️ Valor padrão perigoso
ADMIN_SENHA=admin123              # 🔴 CRÍTICO: Senha fraca padrão

# FRONTEND (WebSocket CORS)
FRONTEND_URL=http://localhost:3001
```

### 🔴 Problemas Identificados:

1. **ADMIN_SENHA=admin123** - Senha padrão fraca no exemplo
2. **Sem variáveis para ambiente de produção** (NODE_ENV, SSL, etc.)

---

## 2. ANÁLISE: Carregamento de Variáveis (app.module.ts)

### Arquivo: `backend/src/app.module.ts`

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    // ...
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        host: configService.get<string>('DB_HOST'),      // ⚠️ Sem fallback
        port: configService.get<number>('DB_PORT'),      // ⚠️ Sem fallback
        username: configService.get<string>('DB_USER'),  // ⚠️ Sem fallback
        password: configService.get<string>('DB_PASSWORD'), // ⚠️ Sem fallback
        database: configService.get<string>('DB_DATABASE'), // ⚠️ Sem fallback
      }),
    }),
  ],
})
```

### 🔴 Problemas Identificados:

| Problema | Severidade | Descrição |
|----------|------------|-----------|
| **Sem validação de schema** | 🔴 CRÍTICO | Não usa Joi/class-validator para validar .env |
| **Sem fallback seguro** | ⚠️ MÉDIO | `configService.get()` retorna `undefined` se variável não existir |
| **App inicia sem variáveis** | 🔴 CRÍTICO | Aplicação pode iniciar com configuração incompleta |

---

## 3. ANÁLISE: Configuração CORS (main.ts)

### Arquivo: `backend/src/main.ts`

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',  // ⚠️ Fallback localhost
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});
```

### WebSocket Gateways:

```typescript
// pedidos.gateway.ts
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',  // ⚠️ Mesmo problema
    credentials: true,
  },
})

// turno.gateway.ts
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',  // ⚠️ Mesmo problema
    credentials: true,
  },
})
```

### ⚠️ Problemas Identificados:

| Problema | Severidade | Descrição |
|----------|------------|-----------|
| **Fallback para localhost** | ⚠️ MÉDIO | Se `FRONTEND_URL` não existir, aceita localhost |
| **Não aceita `*` (bom!)** | ✅ OK | CORS não está aberto para todos |
| **Usa variável de ambiente** | ✅ OK | Configurável por ambiente |

### ✅ Pontos Positivos:
- CORS **NÃO** está configurado como `*` (aceitar tudo)
- Usa variável de ambiente `FRONTEND_URL`
- `credentials: true` está configurado

### ⚠️ Risco:
- Se `FRONTEND_URL` não for definida em produção, fallback é `localhost:3001`
- Em produção, isso pode causar erros de CORS (melhor que aceitar tudo)

---

## 4. ANÁLISE: Segurança JWT

### Arquivo: `backend/src/auth/auth.module.ts`

```typescript
JwtModule.registerAsync({
  useFactory: async (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),  // ⚠️ Pode ser undefined!
    signOptions: { expiresIn: '4h' },
  }),
}),
```

### Arquivo: `backend/src/auth/strategies/jwt.strategy.ts`

```typescript
super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),  // ✅ Usa getOrThrow!
});
```

### ⚠️ Inconsistência Detectada:

| Local | Método | Comportamento |
|-------|--------|---------------|
| `auth.module.ts` | `configService.get()` | Retorna `undefined` se não existir |
| `jwt.strategy.ts` | `configService.getOrThrow()` | **Lança erro** se não existir |

### 🔴 Problema:
- `auth.module.ts` usa `get()` - JWT pode ser criado com secret `undefined`
- `jwt.strategy.ts` usa `getOrThrow()` - Validação correta, mas inconsistente

---

## 5. ANÁLISE: Valores Hardcoded Críticos

### Busca por valores hardcoded perigosos:

```typescript
// ❌ ENCONTRADO em funcionario.service.ts
const senhaPlana = this.configService.get<string>('ADMIN_SENHA');
// Se ADMIN_SENHA não existir, senhaPlana = undefined
// bcrypt.hash(undefined, 10) pode causar comportamento inesperado

// ❌ ENCONTRADO em data-source.ts (migrations)
export const dataSourceOptions: DataSourceOptions = {
  host: process.env.DB_HOST,           // Pode ser undefined
  port: parseInt(process.env.DB_PORT || '5432', 10),  // Fallback 5432
  username: process.env.DB_USER,       // Pode ser undefined
  password: String(process.env.DB_PASSWORD),  // String(undefined) = "undefined"
  database: process.env.DB_DATABASE,   // Pode ser undefined
};
```

### 🔴 Problemas Críticos:

| Arquivo | Problema | Risco |
|---------|----------|-------|
| `data-source.ts` | `String(process.env.DB_PASSWORD)` | Converte `undefined` para string `"undefined"` |
| `funcionario.service.ts` | `ADMIN_SENHA` sem validação | Admin pode ser criado com senha undefined |
| `auth.module.ts` | `JWT_SECRET` sem validação | Tokens podem ser assinados com secret undefined |

---

## 6. ANÁLISE: Validação de Variáveis Obrigatórias

### 🔴 AUSENTE - Não há validação!

O sistema **NÃO** usa:
- ❌ Joi schema validation
- ❌ class-validator para .env
- ❌ Verificação manual no bootstrap

### O que deveria existir:

```typescript
// app.module.ts - EXEMPLO DE CORREÇÃO
import * as Joi from 'joi';

ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().default(5432),
    DB_USER: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_DATABASE: Joi.string().required(),
    JWT_SECRET: Joi.string().min(32).required(),
    FRONTEND_URL: Joi.string().uri().required(),
    ADMIN_EMAIL: Joi.string().email().required(),
    ADMIN_SENHA: Joi.string().min(8).required(),
  }),
  validationOptions: {
    abortEarly: true,  // Para na primeira falha
  },
});
```

---

## 📋 MATRIZ DE RISCOS

| Variável | Obrigatória | Validada | Fallback Seguro | Risco |
|----------|:-----------:|:--------:|:---------------:|:-----:|
| `DB_HOST` | ✅ | ❌ | ❌ | 🔴 ALTO |
| `DB_PORT` | ✅ | ❌ | ⚠️ 5432 | ⚠️ MÉDIO |
| `DB_USER` | ✅ | ❌ | ❌ | 🔴 ALTO |
| `DB_PASSWORD` | ✅ | ❌ | ❌ | 🔴 ALTO |
| `DB_DATABASE` | ✅ | ❌ | ❌ | 🔴 ALTO |
| `JWT_SECRET` | ✅ | ⚠️ Parcial | ❌ | 🔴 ALTO |
| `FRONTEND_URL` | ✅ | ❌ | ⚠️ localhost | ⚠️ MÉDIO |
| `ADMIN_EMAIL` | ⚠️ | ❌ | ❌ | ⚠️ MÉDIO |
| `ADMIN_SENHA` | ⚠️ | ❌ | ❌ | 🔴 ALTO |
| `GCS_BUCKET_NAME` | ⚠️ | ❌ | ❌ | ⚠️ MÉDIO |

---

## 🔧 CORREÇÕES OBRIGATÓRIAS PARA PRODUÇÃO

### 1. Instalar Joi e adicionar validação

```bash
cd backend
npm install joi
```

```typescript
// app.module.ts
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        
        // Banco de dados
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USER: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        
        // Segurança
        JWT_SECRET: Joi.string().min(32).required()
          .messages({ 'string.min': 'JWT_SECRET deve ter no mínimo 32 caracteres' }),
        
        // CORS
        FRONTEND_URL: Joi.string().uri().required(),
        
        // Admin (opcional em produção se já existir)
        ADMIN_EMAIL: Joi.string().email().optional(),
        ADMIN_SENHA: Joi.string().min(8).optional(),
        
        // Storage (opcional)
        GCS_BUCKET_NAME: Joi.string().optional(),
        GOOGLE_APPLICATION_CREDENTIALS: Joi.string().optional(),
      }),
      validationOptions: {
        abortEarly: true,
      },
    }),
    // ... resto dos imports
  ],
})
```

### 2. Corrigir auth.module.ts

```typescript
// ANTES
secret: configService.get<string>('JWT_SECRET'),

// DEPOIS
secret: configService.getOrThrow<string>('JWT_SECRET'),
```

### 3. Corrigir data-source.ts

```typescript
// ANTES
password: String(process.env.DB_PASSWORD),

// DEPOIS
password: process.env.DB_PASSWORD,
// Ou melhor ainda, validar antes de usar
```

### 4. Atualizar .env.example

```env
# ============================================
# AMBIENTE
# ============================================
NODE_ENV=development

# ============================================
# BANCO DE DADOS
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=ALTERE_ESTA_SENHA_FORTE
DB_DATABASE=pub_system_db

# ============================================
# SEGURANÇA (OBRIGATÓRIO - mínimo 32 caracteres)
# ============================================
JWT_SECRET=GERE_UMA_CHAVE_SECRETA_COM_MINIMO_32_CARACTERES

# ============================================
# CORS - URL do Frontend
# ============================================
FRONTEND_URL=http://localhost:3001

# ============================================
# ADMINISTRADOR INICIAL (apenas primeiro deploy)
# ============================================
# ADMIN_EMAIL=admin@seudominio.com
# ADMIN_SENHA=SENHA_FORTE_MINIMO_8_CHARS
```

---

## 🚨 CHECKLIST ANTES DE PRODUÇÃO

### Obrigatório:
- [ ] Implementar validação Joi no ConfigModule
- [ ] Trocar `configService.get()` por `getOrThrow()` para variáveis críticas
- [ ] Gerar JWT_SECRET forte (mínimo 32 caracteres, usar `openssl rand -base64 32`)
- [ ] Definir FRONTEND_URL com domínio real de produção
- [ ] Remover ou comentar ADMIN_EMAIL/ADMIN_SENHA após primeiro deploy
- [ ] Configurar SSL/TLS no banco de dados
- [ ] Usar secrets manager (AWS Secrets Manager, Vault, etc.)

### Recomendado:
- [ ] Adicionar rate limiting
- [ ] Configurar helmet para headers de segurança
- [ ] Habilitar logs de auditoria
- [ ] Configurar backup automático do banco

---

## 🎯 Conclusão

### ❌ **NÃO É SEGURO** subir para produção hoje porque:

1. **Variáveis críticas não são validadas** - App pode iniciar com configuração incompleta
2. **JWT_SECRET pode ser undefined** - Tokens podem ser assinados incorretamente
3. **Fallback para localhost no CORS** - Pode causar erros em produção
4. **Sem validação de schema** - Erros de configuração só aparecem em runtime

### ✅ Após implementar as correções:

O sistema estará **APTO** para produção com as seguintes garantias:
- App não inicia se variáveis obrigatórias estiverem faltando
- JWT_SECRET é validado com tamanho mínimo
- CORS configurado corretamente para domínio de produção
- Erros de configuração detectados no startup

---

*Auditoria realizada em 11/12/2024*
