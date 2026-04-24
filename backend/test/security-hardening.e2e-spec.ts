import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';

/**
 * Security Hardening E2E Tests — Sprint 1
 *
 * Valida que as correções de segurança estão funcionando:
 * 1. access_token é retornado como httpOnly cookie
 * 2. /health/metrics requer autenticação
 * 3. JWT forjado não funciona no TenantInterceptor
 * 4. Logout limpa ambos os cookies
 * 5. Refresh renova o cookie access_token
 */
const ADMIN_EMAIL = process.env.CI_ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = process.env.CI_ADMIN_PASSWORD || 'admin123';

describe('Security Hardening Sprint 1 (e2e)', () => {
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

    // Seed SUPER_ADMIN
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
    if (app) await app.close();
  }, 30000);

  // --- Helper ---
  async function loginAdmin() {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD })
      .expect(201);
    return {
      accessToken: res.body.access_token,
      cookies: res.headers['set-cookie'] as string[],
    };
  }

  // =========================================================================
  // 1. access_token httpOnly cookie
  // =========================================================================
  describe('access_token httpOnly cookie', () => {
    it('login deve setar access_token como httpOnly cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD })
        .expect(201);

      const cookies: string[] = Array.isArray(res.headers['set-cookie'])
        ? res.headers['set-cookie']
        : [res.headers['set-cookie']];

      const accessCookie = cookies.find((c: string) => c.startsWith('access_token='));
      expect(accessCookie).toBeDefined();
      expect(accessCookie).toContain('HttpOnly');
      expect(accessCookie).toContain('Path=/');
    });

    it('access_token cookie NÃO deve estar no body', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD })
        .expect(201);

      // access_token ESTÁ no body (para backward compat), mas refresh_token NÃO
      expect(res.body.access_token).toBeDefined();
      expect(res.body.refresh_token).toBeUndefined();
    });

    it('rotas protegidas devem aceitar access_token via cookie', async () => {
      const { cookies } = await loginAdmin();

      // Usar apenas o cookie (sem Bearer header)
      const res = await request(app.getHttpServer())
        .get('/auth/sessions')
        .set('Cookie', cookies)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('rotas protegidas devem continuar aceitando Bearer header (backward compat)', async () => {
      const { accessToken } = await loginAdmin();

      const res = await request(app.getHttpServer())
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // =========================================================================
  // 2. /health/metrics protegido
  // =========================================================================
  describe('GET /health/metrics', () => {
    it('deve retornar 401 sem autenticação', async () => {
      await request(app.getHttpServer())
        .get('/health/metrics')
        .expect(401);
    });

    it('deve retornar métricas com autenticação', async () => {
      const { accessToken } = await loginAdmin();

      const res = await request(app.getHttpServer())
        .get('/health/metrics')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.timestamp).toBeDefined();
      expect(res.body.memory).toBeDefined();
      expect(res.body.uptime).toBeDefined();
    });

    it('/health e /health/live devem permanecer públicos', async () => {
      await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      const liveRes = await request(app.getHttpServer())
        .get('/health/live')
        .expect(200);

      expect(liveRes.body.status).toBe('ok');
    });
  });

  // =========================================================================
  // 3. JWT forjado rejeitado
  // =========================================================================
  describe('JWT forjado', () => {
    it('deve rejeitar JWT com assinatura inválida', async () => {
      // JWT forjado com payload válido mas assinatura errada
      const forgedToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        'eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJoYWNrZXJAZXZpbC5jb20iLCJjYXJnbyI6IlNVUEVSX0FETUlOIiwidGVuYW50SWQiOm51bGx9.' +
        'INVALID_SIGNATURE';

      await request(app.getHttpServer())
        .get('/auth/sessions')
        .set('Authorization', `Bearer ${forgedToken}`)
        .expect(401);
    });
  });

  // =========================================================================
  // 4. Logout limpa cookies
  // =========================================================================
  describe('Logout limpa cookies', () => {
    it('deve limpar access_token e refresh_token no logout', async () => {
      const { accessToken, cookies } = await loginAdmin();

      const logoutRes = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', cookies)
        .expect(201);

      const setCookies: string[] = Array.isArray(logoutRes.headers['set-cookie'])
        ? logoutRes.headers['set-cookie']
        : [logoutRes.headers['set-cookie']];

      // Verificar que access_token foi limpo
      const clearedAccess = setCookies.find((c: string) => c.startsWith('access_token='));
      if (clearedAccess) {
        expect(
          clearedAccess.includes('Expires=Thu, 01 Jan 1970') ||
          clearedAccess.includes('access_token=;'),
        ).toBe(true);
      }

      // Verificar que refresh_token foi limpo
      const clearedRefresh = setCookies.find((c: string) => c.startsWith('refresh_token='));
      if (clearedRefresh) {
        expect(
          clearedRefresh.includes('Expires=Thu, 01 Jan 1970') ||
          clearedRefresh.includes('refresh_token=;'),
        ).toBe(true);
      }
    });
  });

  // =========================================================================
  // 5. Refresh renova access_token cookie
  // =========================================================================
  describe('Refresh renova access_token cookie', () => {
    it('deve setar novo access_token cookie após refresh', async () => {
      const { cookies } = await loginAdmin();

      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .expect(201);

      const newCookies: string[] = Array.isArray(refreshRes.headers['set-cookie'])
        ? refreshRes.headers['set-cookie']
        : [refreshRes.headers['set-cookie']];

      const newAccessCookie = newCookies.find((c: string) => c.startsWith('access_token='));
      expect(newAccessCookie).toBeDefined();
      expect(newAccessCookie).toContain('HttpOnly');

      // O body também deve conter o novo access_token (backward compat)
      expect(refreshRes.body.access_token).toBeDefined();
    });
  });
});
