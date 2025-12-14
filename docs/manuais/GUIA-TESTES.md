# Guia de Testes - Pub System

Este documento descreve a estratégia de testes implementada no Pub System, incluindo testes unitários, de integração e E2E.

## Índice

1. [Visão Geral](#visão-geral)
2. [Backend - Testes Unitários](#backend---testes-unitários)
3. [Backend - Testes E2E](#backend---testes-e2e)
4. [Frontend - Testes E2E (Playwright)](#frontend---testes-e2e-playwright)
5. [Comandos de Execução](#comandos-de-execução)
6. [Boas Práticas](#boas-práticas)

---

## Visão Geral

### Estrutura de Testes

```
pub-system/
├── backend/
│   ├── src/
│   │   └── modulos/
│   │       ├── pedido/
│   │       │   └── pedido.service.spec.ts    # Testes unitários
│   │       └── caixa/
│   │           └── caixa.service.spec.ts     # Testes unitários
│   └── test/
│       ├── jest-e2e.json                     # Config Jest E2E
│       ├── caixa.e2e-spec.ts                 # Testes E2E Caixa
│       ├── pedido.e2e-spec.ts                # Testes E2E Pedidos
│       └── fluxo-financeiro.e2e-spec.ts      # Testes E2E Financeiro
└── frontend/
    ├── playwright.config.ts                  # Config Playwright
    └── e2e/
        ├── auth.spec.ts                      # Testes E2E Autenticação
        └── pedidos.spec.ts                   # Testes E2E Pedidos/Cozinha
```

### Tecnologias Utilizadas

| Camada | Ferramenta | Tipo de Teste |
|--------|------------|---------------|
| Backend | Jest | Unitários |
| Backend | Jest + Supertest | E2E/Integração |
| Frontend | Playwright | E2E |

---

## Backend - Testes Unitários

### Configuração

Os testes unitários usam Jest com `ts-jest` para transpilação TypeScript.

**Arquivo de configuração:** `backend/package.json`

```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "testEnvironment": "node"
  }
}
```

### Padrão de Testes Unitários

Os testes unitários seguem o padrão AAA (Arrange, Act, Assert) e usam mocks para isolar dependências:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PedidoService } from './pedido.service';
import { Pedido } from './entities/pedido.entity';

describe('PedidoService', () => {
  let service: PedidoService;

  const mockPedidoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidoService,
        {
          provide: getRepositoryToken(Pedido),
          useValue: mockPedidoRepository,
        },
      ],
    }).compile();

    service = module.get<PedidoService>(PedidoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um pedido com sucesso', async () => {
      // Arrange
      mockPedidoRepository.findOne.mockResolvedValue(mockComanda);
      
      // Act
      const result = await service.create(createPedidoDto);
      
      // Assert
      expect(result).toBeDefined();
      expect(mockPedidoRepository.save).toHaveBeenCalled();
    });
  });
});
```

### Cobertura de Testes

Execute para ver a cobertura:

```bash
cd backend
npm run test:cov
```

---

## Backend - Testes E2E

### Configuração

**Arquivo:** `backend/test/jest-e2e.json`

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "moduleNameMapper": {
    "^src/(.*)$": "<rootDir>/../src/$1"
  }
}
```

### Padrão de Testes E2E

Os testes E2E usam Supertest para simular requisições HTTP:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Pedido (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    // Login para obter token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@admin.com', senha: 'admin123' });
    
    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /pedidos', () => {
    it('deve criar um pedido com sucesso', async () => {
      const response = await request(app.getHttpServer())
        .post('/pedidos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          comandaId: 'uuid-comanda',
          itens: [{ produtoId: 'uuid-produto', quantidade: 2 }],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });
  });
});
```

---

## Frontend - Testes E2E (Playwright)

### Configuração

**Arquivo:** `frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Padrão de Testes Playwright

```typescript
import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test('deve fazer login com credenciais válidas', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'admin@admin.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });
  });
});
```

---

## Comandos de Execução

### Backend

| Comando | Descrição |
|---------|-----------|
| `npm run test` | Executa testes unitários |
| `npm run test:watch` | Executa testes em modo watch |
| `npm run test:cov` | Executa testes com cobertura |
| `npm run test:e2e` | Executa todos os testes E2E |
| `npm run test:e2e:caixa` | Executa testes E2E do Caixa |
| `npm run test:e2e:fluxo` | Executa testes E2E do Fluxo Financeiro |

### Frontend

| Comando | Descrição |
|---------|-----------|
| `npm run test:e2e` | Executa testes E2E (headless) |
| `npm run test:e2e:ui` | Abre UI interativa do Playwright |
| `npm run test:e2e:headed` | Executa com navegador visível |
| `npm run test:e2e:debug` | Executa em modo debug |
| `npm run test:e2e:report` | Abre relatório HTML |

---

## Boas Práticas

### 1. Nomenclatura de Testes

- Use descrições em português para clareza
- Siga o padrão: `deve [ação esperada] quando [condição]`

```typescript
it('deve lançar NotFoundException se comanda não existir', async () => {
  // ...
});
```

### 2. Isolamento de Testes

- Cada teste deve ser independente
- Use `beforeEach` para setup e `afterEach` para cleanup
- Limpe mocks entre testes com `jest.clearAllMocks()`

### 3. Mocking de Dependências

- Mock apenas o necessário
- Use `getRepositoryToken()` para mockar repositórios TypeORM
- Prefira mocks parciais quando possível

### 4. Testes E2E

- Configure dados de teste no `beforeAll`
- Limpe dados de teste no `afterAll`
- Use tokens de autenticação válidos
- Teste fluxos completos, não apenas endpoints isolados

### 5. Cobertura Mínima Recomendada

| Tipo | Cobertura Mínima |
|------|------------------|
| Services | 80% |
| Controllers | 70% |
| Guards/Pipes | 90% |
| E2E | Fluxos críticos |

---

## Troubleshooting

### Erro: "Cannot find module"

```bash
# Limpe cache do Jest
npm run test -- --clearCache
```

### Erro: "Connection refused" em testes E2E

```bash
# Verifique se o banco de dados de teste está rodando
docker-compose up -d postgres-test
```

### Playwright não encontra elementos

```typescript
// Use locators mais específicos
await page.getByRole('button', { name: /entrar/i });
await page.getByTestId('login-button');
```

---

## Próximos Passos

1. [ ] Aumentar cobertura de testes unitários para 80%
2. [ ] Adicionar testes de componentes React com Testing Library
3. [ ] Configurar CI/CD para executar testes automaticamente
4. [ ] Implementar testes de carga com k6 ou Artillery
5. [ ] Adicionar testes de acessibilidade com axe-core

---

*Última atualização: Junho 2025*
