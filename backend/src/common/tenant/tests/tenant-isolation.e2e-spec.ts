import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../../app.module';
import { TenantContextService } from '../tenant-context.service';

/**
 * Testes E2E de Isolamento Multi-tenant
 *
 * Requer banco PostgreSQL e Redis rodando.
 * Cria dois tenants reais, dois usuários (um por tenant),
 * e verifica isolamento completo:
 * 1. Login scoped por tenant
 * 2. Dados filtrados por tenant
 * 3. Cross-tenant access blocked (403)
 * 4. TenantContextService per-request isolation
 */
describe('Multi-tenant Isolation (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let tenantAId: string;
  let tenantBId: string;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    await seedTestData();
  }, 60000);

  afterAll(async () => {
    await cleanupTestData();
    if (app) await app.close();
  }, 30000);

  async function cleanupTestData() {
    try {
      await dataSource.query(`DELETE FROM funcionarios WHERE email IN ('admin-a@isolation.test', 'admin-b@isolation.test')`);
      await dataSource.query(`DELETE FROM tenants WHERE slug IN ('isolation-test-a', 'isolation-test-b')`);
    } catch { /* ignore */ }
  }

  async function seedTestData() {
    await cleanupTestData();

    // Criar dois tenants
    const tenantA = await dataSource.query(
      `INSERT INTO tenants (nome, slug, plano, status) VALUES ('Bar A Test', 'isolation-test-a', 'PRO', 'ATIVO') RETURNING id`,
    );
    tenantAId = tenantA[0].id;

    const tenantB = await dataSource.query(
      `INSERT INTO tenants (nome, slug, plano, status) VALUES ('Bar B Test', 'isolation-test-b', 'PRO', 'ATIVO') RETURNING id`,
    );
    tenantBId = tenantB[0].id;

    // Criar admin em cada tenant
    const hash = await bcrypt.hash('Test@123', 10);
    await dataSource.query(
      `INSERT INTO funcionarios (nome, email, senha, cargo, tenant_id, status) VALUES ('Admin A', 'admin-a@isolation.test', $1, 'ADMIN', $2, 'ATIVO')`,
      [hash, tenantAId],
    );
    await dataSource.query(
      `INSERT INTO funcionarios (nome, email, senha, cargo, tenant_id, status) VALUES ('Admin B', 'admin-b@isolation.test', $1, 'ADMIN', $2, 'ATIVO')`,
      [hash, tenantBId],
    );

    // Login em cada tenant para obter tokens
    const loginA = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-tenant-id', tenantAId)
      .send({ email: 'admin-a@isolation.test', senha: 'Test@123' });
    tokenA = loginA.body.access_token;

    const loginB = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-tenant-id', tenantBId)
      .send({ email: 'admin-b@isolation.test', senha: 'Test@123' });
    tokenB = loginB.body.access_token;
  }

  describe('Login scoped por tenant', () => {
    it('deve autenticar admin-a apenas no tenant A', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-tenant-id', tenantAId)
        .send({ email: 'admin-a@isolation.test', senha: 'Test@123' });

      expect(res.status).toBe(201);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.tenant_id).toBe(tenantAId);
    });

    it('deve rejeitar admin-a tentando login no tenant B', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-tenant-id', tenantBId)
        .send({ email: 'admin-a@isolation.test', senha: 'Test@123' });

      expect(res.status).toBe(401);
    });
  });

  describe('Cross-tenant access blocked', () => {
    it('admin-a acessando dados via header tenant B deve receber 403', async () => {
      if (!tokenA) return;

      // Usar token do tenant A mas enviar header do tenant B
      const res = await request(app.getHttpServer())
        .get('/funcionarios')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('x-tenant-id', tenantBId);

      // TenantGuard deve bloquear: JWT.tenantId (A) ≠ contexto (B)
      expect(res.status).toBe(403);
    });

    it('admin-a acessando dados via seu próprio tenant deve funcionar', async () => {
      if (!tokenA) return;

      const res = await request(app.getHttpServer())
        .get('/funcionarios')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('x-tenant-id', tenantAId);

      expect(res.status).toBe(200);
    });
  });

  describe('Dados isolados por tenant', () => {
    it('listagem de funcionários do tenant A não inclui funcionários do tenant B', async () => {
      if (!tokenA) return;

      const res = await request(app.getHttpServer())
        .get('/funcionarios')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('x-tenant-id', tenantAId);

      expect(res.status).toBe(200);

      const body = Array.isArray(res.body) ? res.body : res.body.data || [];
      const emails = body.map((f: any) => f.email);

      // Admin A deve aparecer; Admin B NUNCA
      expect(emails).toContain('admin-a@isolation.test');
      expect(emails).not.toContain('admin-b@isolation.test');
    });
  });
});

/**
 * Testes de Unidade para Isolamento
 */
describe('TenantContextService - Isolamento', () => {
  it('Cada requisição deve ter contexto isolado', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantContextService],
    }).compile();

    const context1 = await module.resolve<TenantContextService>(TenantContextService);
    const context2 = await module.resolve<TenantContextService>(TenantContextService);

    context1.setTenantId('550e8400-e29b-41d4-a716-446655440001', 'Bar A');
    context2.setTenantId('550e8400-e29b-41d4-a716-446655440002', 'Bar B');

    expect(context1.getTenantId()).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(context2.getTenantId()).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(context1.getTenantId()).not.toBe(context2.getTenantId());
  });
});
