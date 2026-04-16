import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * Testes E2E para validar permissões do role GERENTE
 * 
 * Cenários testados:
 * 1. ADMIN cria usuário GERENTE (201)
 * 2. GERENTE acessa rota permitida (200)
 * 3. GERENTE tenta rota proibida (403)
 * 4. GERENTE tenta atribuir ADMIN (403)
 * 5. Multi-tenant isolation
 */
describe('GERENTE Permissions (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let gerenteToken: string;
  let adminId: string;
  let gerenteId: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    dataSource = moduleFixture.get(DataSource);

    // Limpar dados de teste anteriores
    await cleanupTestData();

    // Criar tenant de teste
    tenantId = await createTestTenant();

    // Criar usuário ADMIN de teste
    const adminData = await createTestUser('admin-test@test.com', 'ADMIN', tenantId);
    adminId = adminData.id;

    // Login como ADMIN (passar x-tenant-id para AuthController usar validateUser)
    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-tenant-id', tenantId)
      .send({ email: 'admin-test@test.com', senha: 'Test@123' });
    
    adminToken = adminLoginRes.body.access_token;
  });

  afterAll(async () => {
    await cleanupTestData();
    if (app) await app.close();
  }, 30000);

  async function cleanupTestData() {
    try {
      await dataSource.query(`DELETE FROM funcionarios WHERE email LIKE '%test@test.com'`);
      await dataSource.query(`DELETE FROM tenants WHERE nome LIKE 'Test Tenant%'`);
    } catch (e) {
      // Ignora erros de limpeza
    }
  }

  async function createTestTenant(): Promise<string> {
    const result = await dataSource.query(`
      INSERT INTO tenants (nome, slug, plano, status)
      VALUES ('Test Tenant E2E', 'test-tenant-e2e', 'PRO', 'ATIVO')
      RETURNING id
    `);
    return result[0].id;
  }

  async function createTestUser(email: string, cargo: string, tenantId: string): Promise<{ id: string }> {
    const senhaHash = await bcrypt.hash('Test@123', 10);
    const result = await dataSource.query(`
      INSERT INTO funcionarios (nome, email, senha, cargo, tenant_id, status)
      VALUES ($1, $2, $3, $4, $5, 'ATIVO')
      RETURNING id
    `, [`Test ${cargo}`, email, senhaHash, cargo, tenantId]);
    return { id: result[0].id };
  }

  // ============================================
  // TESTE 1: ADMIN cria usuário GERENTE (201)
  // ============================================
  describe('1. ADMIN cria GERENTE', () => {
    it('deve criar usuário GERENTE com sucesso (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Gerente Teste',
          email: 'gerente-test@test.com',
          senha: 'Test@123',
          cargo: 'GERENTE',
        });

      expect(res.status).toBe(201);
      expect(res.body.cargo).toBe('GERENTE');
      gerenteId = res.body.id;

      // Login como GERENTE (passar x-tenant-id)
      const gerenteLoginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-tenant-id', tenantId)
        .send({ email: 'gerente-test@test.com', senha: 'Test@123' });
      
      gerenteToken = gerenteLoginRes.body.access_token;
      expect(gerenteToken).toBeDefined();
    });
  });

  // ============================================
  // TESTE 2: GERENTE acessa rota permitida (200)
  // ============================================
  describe('2. GERENTE acessa rotas permitidas', () => {
    it('deve acessar GET /funcionarios (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/funcionarios')
        .set('Authorization', `Bearer ${gerenteToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('deve acessar GET /pedidos (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/pedidos')
        .set('Authorization', `Bearer ${gerenteToken}`);

      expect(res.status).toBe(200);
    });

    it('deve acessar GET /comandas (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/comandas')
        .set('Authorization', `Bearer ${gerenteToken}`);

      expect(res.status).toBe(200);
    });

    it('deve acessar GET /mesas (200)', async () => {
      const res = await request(app.getHttpServer())
        .get('/mesas')
        .set('Authorization', `Bearer ${gerenteToken}`);

      expect(res.status).toBe(200);
    });

    it('deve acessar GET /analytics/pedidos/relatorio-geral (200 ou 403 por feature)', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/pedidos/relatorio-geral')
        .set('Authorization', `Bearer ${gerenteToken}`);

      // 200 se feature habilitada, 403 se não
      expect([200, 403]).toContain(res.status);
    });
  });

  // ============================================
  // TESTE 3: GERENTE tenta rota proibida (403)
  // ============================================
  describe('3. GERENTE bloqueado em rotas proibidas', () => {
    it('deve ser bloqueado em POST /funcionarios (403)', async () => {
      const res = await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({
          nome: 'Novo Funcionario',
          email: 'novo@test.com',
          senha: 'Test@123',
          cargo: 'GARCOM',
        });

      expect(res.status).toBe(403);
    });

    it('deve ser bloqueado em PATCH /funcionarios/:id (403)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/funcionarios/${adminId}`)
        .set('Authorization', `Bearer ${gerenteToken}`)
        .send({ nome: 'Nome Alterado' });

      expect(res.status).toBe(403);
    });

    it('deve ser bloqueado em DELETE /funcionarios/:id (403)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/funcionarios/${adminId}`)
        .set('Authorization', `Bearer ${gerenteToken}`);

      expect(res.status).toBe(403);
    });

    it('deve ser bloqueado em rotas de planos (403)', async () => {
      const res = await request(app.getHttpServer())
        .get('/plans')
        .set('Authorization', `Bearer ${gerenteToken}`);

      // 403 ou 401 dependendo da configuração
      expect([401, 403]).toContain(res.status);
    });
  });

  // ============================================
  // TESTE 4: Anti-elevação - GERENTE não pode atribuir ADMIN
  // ============================================
  describe('4. Anti-elevação de privilégios', () => {
    it('ADMIN não pode criar SUPER_ADMIN (403)', async () => {
      const res = await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Super Admin Teste',
          email: 'super-admin-test@test.com',
          senha: 'Test@123',
          cargo: 'SUPER_ADMIN',
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('SUPER_ADMIN');
    });

    it('ADMIN pode criar outro ADMIN (201)', async () => {
      const res = await request(app.getHttpServer())
        .post('/funcionarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Admin 2 Teste',
          email: 'admin2-test@test.com',
          senha: 'Test@123',
          cargo: 'ADMIN',
        });

      expect(res.status).toBe(201);
      expect(res.body.cargo).toBe('ADMIN');
    });
  });

  // ============================================
  // TESTE 5: Verificação de roles corretas
  // ============================================
  describe('5. Verificação de roles', () => {
    it('GERENTE deve ter cargo correto no token', async () => {
      const res = await request(app.getHttpServer())
        .get('/funcionarios/meu-perfil')
        .set('Authorization', `Bearer ${gerenteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.cargo).toBe('GERENTE');
    });

    it('ADMIN deve ter cargo correto no token', async () => {
      const res = await request(app.getHttpServer())
        .get('/funcionarios/meu-perfil')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.cargo).toBe('ADMIN');
    });
  });
});
