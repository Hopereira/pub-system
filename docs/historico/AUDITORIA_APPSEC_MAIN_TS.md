# 🔐 Auditoria AppSec - main.ts

**Data:** 11/12/2024  
**Branch:** `audit/appsec-main-ts`  
**Auditor:** Especialista em Segurança Cibernética (AppSec)

---

## 📊 Resumo Executivo

| Controle de Segurança | Status | Risco |
|-----------------------|--------|-------|
| **Helmet (Headers HTTP)** | ❌ AUSENTE | 🔴 CRÍTICO |
| **ValidationPipe whitelist** | ⚠️ PARCIAL | ⚠️ MÉDIO |
| **ValidationPipe forbidNonWhitelisted** | ❌ AUSENTE | 🔴 CRÍTICO |
| **Rate Limiting** | ❌ AUSENTE | 🔴 CRÍTICO |
| **CORS configurado** | ✅ OK | ✅ OK |
| **Exception Filter** | ✅ OK | ✅ OK |

### 🚨 VEREDITO: API **VULNERÁVEL** - Necessita correções urgentes

---

## 1. ANÁLISE: Helmet (Headers HTTP)

### Status: ❌ AUSENTE

```typescript
// main.ts - NÃO ENCONTRADO
// import helmet from 'helmet';
// app.use(helmet());
```

### 🔴 Vulnerabilidades Expostas:

| Header Ausente | Ataque Prevenido | Risco |
|----------------|------------------|-------|
| `X-Content-Type-Options` | MIME Sniffing | 🔴 Alto |
| `X-Frame-Options` | Clickjacking | 🔴 Alto |
| `X-XSS-Protection` | Cross-Site Scripting | 🔴 Alto |
| `Strict-Transport-Security` | Downgrade HTTPS | 🔴 Alto |
| `Content-Security-Policy` | Injeção de scripts | 🔴 Alto |
| `X-DNS-Prefetch-Control` | DNS Prefetch abuse | ⚠️ Médio |
| `X-Download-Options` | Download automático | ⚠️ Médio |
| `X-Permitted-Cross-Domain-Policies` | Adobe Flash abuse | ⚠️ Médio |

### Impacto:
- Atacantes podem injetar scripts maliciosos
- Páginas podem ser embutidas em iframes (clickjacking)
- Navegadores podem interpretar arquivos incorretamente

---

## 2. ANÁLISE: ValidationPipe

### Status: ⚠️ PARCIAL

```typescript
// main.ts - ATUAL
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,      // ✅ OK - Remove campos não decorados
    // forbidNonWhitelisted: true,  // ❌ AUSENTE!
  }),
);
```

### Problema:

| Configuração | Status | Comportamento |
|--------------|--------|---------------|
| `transform: true` | ✅ OK | Converte tipos automaticamente |
| `whitelist: true` | ✅ OK | Remove campos extras silenciosamente |
| `forbidNonWhitelisted` | ❌ AUSENTE | **Não rejeita** requisições com campos extras |

### 🔴 Vulnerabilidade:

Com `whitelist: true` mas sem `forbidNonWhitelisted: true`:
- Campos extras são **removidos silenciosamente**
- Atacante pode enviar payloads maliciosos sem erro
- Dificulta detecção de tentativas de ataque
- Não há feedback de que algo errado foi enviado

### Exemplo de Ataque:

```json
// Requisição maliciosa para criar pedido
POST /pedidos
{
  "comandaId": "uuid-valido",
  "itens": [...],
  "__proto__": { "admin": true },  // Prototype Pollution
  "isAdmin": true,                  // Tentativa de escalação
  "sqlInjection": "'; DROP TABLE--" // Payload malicioso
}
```

**Comportamento Atual:** Campos extras removidos, requisição aceita ✅  
**Comportamento Correto:** Requisição rejeitada com erro 400 ❌

---

## 3. ANÁLISE: Rate Limiting

### Status: ❌ AUSENTE

```typescript
// main.ts - NÃO ENCONTRADO
// import { ThrottlerModule } from '@nestjs/throttler';
```

```json
// package.json - NÃO ENCONTRADO
// "@nestjs/throttler": "^5.x"
```

### 🔴 Vulnerabilidades Expostas:

| Ataque | Descrição | Risco |
|--------|-----------|-------|
| **Brute Force Login** | Tentativas ilimitadas de senha | 🔴 CRÍTICO |
| **DDoS** | Sobrecarga do servidor | 🔴 CRÍTICO |
| **Credential Stuffing** | Teste de credenciais vazadas | 🔴 CRÍTICO |
| **API Abuse** | Extração massiva de dados | 🔴 CRÍTICO |
| **Resource Exhaustion** | Esgotamento de recursos | 🔴 CRÍTICO |

### Endpoints Críticos Sem Proteção:

| Endpoint | Risco | Motivo |
|----------|-------|--------|
| `POST /auth/login` | 🔴 CRÍTICO | Brute force de senhas |
| `POST /funcionarios` | 🔴 CRÍTICO | Criação massiva de contas |
| `POST /clientes` | 🔴 ALTO | Spam de cadastros |
| `POST /pedidos` | 🔴 ALTO | Flood de pedidos |
| `GET /produtos` | ⚠️ MÉDIO | Scraping de dados |

---

## 4. ANÁLISE: Outras Configurações

### ✅ CORS - OK

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});
```
- ✅ Não aceita `*` (qualquer origem)
- ✅ Usa variável de ambiente
- ✅ Credentials habilitado

### ✅ Exception Filter - OK

```typescript
app.useGlobalFilters(new AllExceptionsFilter());
```
- ✅ Captura exceções não tratadas
- ✅ Evita vazamento de stack traces

### ⚠️ JSON Limit - ATENÇÃO

```typescript
app.use(json({ limit: '50mb' }));
```
- ⚠️ 50MB é muito alto para uma API REST
- ⚠️ Pode permitir ataques de payload grande
- 💡 Recomendado: 1-10MB para APIs normais

### ⚠️ Swagger em Produção - ATENÇÃO

```typescript
SwaggerModule.setup('api', app, document);
```
- ⚠️ Swagger exposto em todas as rotas
- ⚠️ Deveria ser desabilitado em produção
- 💡 Recomendado: Condicional `if (NODE_ENV !== 'production')`

---

## 5. MATRIZ DE VULNERABILIDADES

| Vulnerabilidade | OWASP Top 10 | Severidade | Status |
|-----------------|--------------|------------|--------|
| Sem Helmet | A05:2021 Security Misconfiguration | 🔴 Alta | ❌ |
| Sem Rate Limit | A07:2021 Identification Failures | 🔴 Alta | ❌ |
| Sem forbidNonWhitelisted | A03:2021 Injection | ⚠️ Média | ❌ |
| JSON 50MB | A05:2021 Security Misconfiguration | ⚠️ Média | ⚠️ |
| Swagger em Prod | A01:2021 Broken Access Control | ⚠️ Média | ⚠️ |

---

## 6. CORREÇÕES NECESSÁRIAS

### 6.1 Instalar Dependências

```bash
cd backend
npm install helmet @nestjs/throttler --legacy-peer-deps
```

### 6.2 main.ts Corrigido

```typescript
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { json } from 'express';
import helmet from 'helmet';  // ✅ ADICIONAR
import { SeederService } from './database/seeder.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  // ✅ SEGURANÇA: Helmet para headers HTTP seguros
  app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false, // Desabilita CSP em dev para Swagger
    crossOriginEmbedderPolicy: false, // Necessário para algumas integrações
  }));

  // Interceptor e Filter
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Static assets
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/public/',
  });

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // ✅ SEGURANÇA: Limite de JSON reduzido
  app.use(json({ limit: '10mb' }));

  // ✅ SEGURANÇA: ValidationPipe completo
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,  // ✅ ADICIONAR - Rejeita campos extras
      forbidUnknownValues: true,   // ✅ ADICIONAR - Rejeita valores desconhecidos
      disableErrorMessages: isProduction, // ✅ Esconde detalhes em produção
    }),
  );

  // ✅ SEGURANÇA: Swagger apenas em desenvolvimento
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('PUB System API')
      // ... resto da config
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  // Seeder e start
  const seeder = app.get(SeederService);
  await seeder.seed();

  await app.listen(3000);
  logger.log(`Aplicação rodando em: ${await app.getUrl()}`);
  logger.log(`Ambiente: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
}
bootstrap();
```

### 6.3 app.module.ts - Adicionar ThrottlerModule

```typescript
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // ✅ SEGURANÇA: Rate Limiting Global
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,    // 1 segundo
        limit: 3,     // 3 requisições por segundo
      },
      {
        name: 'medium',
        ttl: 10000,   // 10 segundos
        limit: 20,    // 20 requisições por 10 segundos
      },
      {
        name: 'long',
        ttl: 60000,   // 1 minuto
        limit: 100,   // 100 requisições por minuto
      },
    ]),
    // ... outros imports
  ],
  providers: [
    // ✅ Ativa ThrottlerGuard globalmente
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### 6.4 Rate Limit Específico para Login

```typescript
// auth.controller.ts
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  
  // ✅ Rate limit mais restritivo para login (5 tentativas por minuto)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    // ...
  }

  // ✅ Pular throttle para rotas públicas de leitura
  @SkipThrottle()
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
```

---

## 7. CHECKLIST DE IMPLEMENTAÇÃO

### Obrigatório (Crítico):
- [ ] Instalar `helmet`
- [ ] Instalar `@nestjs/throttler`
- [ ] Adicionar `app.use(helmet())` no main.ts
- [ ] Adicionar `forbidNonWhitelisted: true` no ValidationPipe
- [ ] Configurar ThrottlerModule no app.module.ts
- [ ] Adicionar ThrottlerGuard global

### Recomendado (Médio):
- [ ] Reduzir limite JSON para 10MB
- [ ] Desabilitar Swagger em produção
- [ ] Adicionar `forbidUnknownValues: true`
- [ ] Adicionar `disableErrorMessages` em produção
- [ ] Rate limit específico para `/auth/login`

### Opcional (Baixo):
- [ ] Configurar CSP customizado
- [ ] Adicionar logging de tentativas de rate limit
- [ ] Implementar IP blacklist

---

## 8. COMPARAÇÃO: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Headers HTTP seguros | ❌ Nenhum | ✅ 11 headers |
| Proteção XSS | ❌ Vulnerável | ✅ Protegido |
| Proteção Clickjacking | ❌ Vulnerável | ✅ Protegido |
| Campos extras no JSON | ⚠️ Removidos silenciosamente | ✅ Rejeitados com erro |
| Brute force login | ❌ Ilimitado | ✅ 5/minuto |
| DDoS básico | ❌ Sem proteção | ✅ 100/minuto |
| Swagger em produção | ⚠️ Exposto | ✅ Desabilitado |

---

## 9. TESTES DE SEGURANÇA

### Testar Helmet:
```bash
curl -I http://localhost:3000/health
# Deve retornar headers como:
# X-Content-Type-Options: nosniff
# X-Frame-Options: SAMEORIGIN
# X-XSS-Protection: 0
```

### Testar forbidNonWhitelisted:
```bash
curl -X POST http://localhost:3000/pedidos \
  -H "Content-Type: application/json" \
  -d '{"comandaId":"uuid","itens":[],"campoMalicioso":"hack"}'
# Deve retornar 400 Bad Request
```

### Testar Rate Limit:
```bash
for i in {1..10}; do curl -X POST http://localhost:3000/auth/login -d '{}'; done
# Após 5 requisições, deve retornar 429 Too Many Requests
```

---

*Auditoria realizada em 11/12/2024*
