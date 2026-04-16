import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';

/**
 * Auth E2E Tests — Fluxos críticos de autenticação
 *
 * Requer banco PostgreSQL e Redis rodando.
 * Env vars: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE, JWT_SECRET, REDIS_HOST
 */
const ADMIN_EMAIL = process.env.CI_ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.CI_ADMIN_PASSWORD || 'admin123';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    // Seed SUPER_ADMIN após app.init() — synchronize:true já criou as tabelas
    const ds = app.get(DataSource);
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await ds.query(`DELETE FROM funcionarios WHERE email = $1 AND tenant_id IS NULL`, [ADMIN_EMAIL]);
    await ds.query(
      `INSERT INTO funcionarios (id, nome, email, senha, cargo, status, tenant_id)
       VALUES (gen_random_uuid(), 'Admin CI', $1, $2, 'SUPER_ADMIN', 'ATIVO', NULL)`,
      [ADMIN_EMAIL, hash],
    );
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('deve retornar access_token e set-cookie com refresh_token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD })
        .expect(201);

      expect(res.body.access_token).toBeDefined();
      expect(res.body.expires_in).toBe(3600);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(ADMIN_EMAIL);

      // refresh_token deve estar no cookie httpOnly, não no body
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('refresh_token='))
        : cookies;
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
      expect(refreshCookie).toContain('Path=/auth');
    });

    it('deve rejeitar credenciais inválidas', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ADMIN_EMAIL, senha: 'senhaerrada' })
        .expect(401);
    });

    it('deve rejeitar body vazio', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('deve renovar access_token usando cookie', async () => {
      // Login primeiro
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD });

      const cookies = loginRes.headers['set-cookie'];

      // Refresh usando cookie
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(201);

      expect(refreshRes.body.access_token).toBeDefined();
    });

    it('deve rejeitar sem refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('deve fazer logout e limpar cookie', async () => {
      // Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD });

      const token = loginRes.body.access_token;
      const cookies = loginRes.headers['set-cookie'];

      // Logout
      const logoutRes = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', cookies)
        .expect(201);

      expect(logoutRes.body.message).toContain('sucesso');

      // Cookie deve ser limpo
      const setCookies = logoutRes.headers['set-cookie'];
      if (setCookies) {
        const cleared = Array.isArray(setCookies)
          ? setCookies.find((c: string) => c.startsWith('refresh_token='))
          : setCookies;
        if (cleared) {
          // Cookie cleared = expires in the past or empty value
          expect(
            cleared.includes('Expires=Thu, 01 Jan 1970') ||
            cleared.includes('refresh_token=;'),
          ).toBe(true);
        }
      }
    });
  });

  describe('GET /auth/sessions', () => {
    it('deve listar sessões ativas', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD });

      const token = loginRes.body.access_token;

      const res = await request(app.getHttpServer())
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('deve rejeitar sem token', async () => {
      await request(app.getHttpServer())
        .get('/auth/sessions')
        .expect(401);
    });
  });

  describe('POST /setup/super-admin', () => {
    it('deve retornar 404 quando ENABLE_SETUP não está ativo', async () => {
      // ENABLE_SETUP deve ser false por padrão
      await request(app.getHttpServer())
        .post('/setup/super-admin')
        .send({ email: 'hacker@evil.com', senha: 'password', nome: 'Hacker' })
        .expect(404);
    });
  });
});
