import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

/**
 * Auth E2E Tests — Fluxos críticos de autenticação
 *
 * Requer banco PostgreSQL e Redis rodando.
 * Env vars: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_DATABASE, JWT_SECRET, REDIS_HOST
 */
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
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('deve retornar access_token e set-cookie com refresh_token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@admin.com', senha: 'admin123' })
        .expect(201);

      expect(res.body.access_token).toBeDefined();
      expect(res.body.expires_in).toBe(3600);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('admin@admin.com');

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
        .send({ email: 'admin@admin.com', senha: 'senhaerrada' })
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
        .send({ email: 'admin@admin.com', senha: 'admin123' });

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
        .send({ email: 'admin@admin.com', senha: 'admin123' });

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
        .send({ email: 'admin@admin.com', senha: 'admin123' });

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
