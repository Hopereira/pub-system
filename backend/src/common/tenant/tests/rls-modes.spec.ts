import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { TenantRlsMiddleware, RlsRiskReason } from '../tenant-rls.middleware';
import { Request, Response } from 'express';

/**
 * Unit tests for RLS modes: OFF, DRY-RUN, ENABLED
 */
describe('TenantRlsMiddleware — Modes', () => {
  let mockDataSource: jest.Mocked<DataSource>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockDataSource = {
      query: jest.fn().mockResolvedValue([]),
    } as any;
    mockConfigService = {
      get: jest.fn(),
    } as any;
  });

  function createMiddleware(rlsEnabled: string, rlsDryRun: string): TenantRlsMiddleware {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'RLS_ENABLED') return rlsEnabled;
      if (key === 'RLS_DRY_RUN') return rlsDryRun;
      return undefined;
    });
    return new TenantRlsMiddleware(mockDataSource, mockConfigService);
  }

  function createRequest(overrides: any = {}): Request {
    return {
      method: 'GET',
      url: '/funcionarios',
      headers: {},
      tenant: overrides.tenant || null,
      user: overrides.user || null,
      requestId: overrides.requestId || null,
      ...overrides,
    } as any;
  }

  const mockRes = {} as Response;
  const mockNext = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Fase 0 — OFF (default)', () => {
    it('should do nothing when both flags are false', async () => {
      const mw = createMiddleware('false', 'false');
      const req = createRequest({ user: { tenantId: 'abc' } });

      await mw.use(req, mockRes, mockNext);

      expect(mockDataSource.query).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Fase 1 — DRY-RUN', () => {
    it('should NOT call set_config (no DB mutation)', async () => {
      const mw = createMiddleware('false', 'true');
      const req = createRequest({ user: { tenantId: 'abc' } });

      await mw.use(req, mockRes, mockNext);

      expect(mockDataSource.query).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should log TENANT_CONTEXT_MISSING for requests without tenantId on protected routes', async () => {
      const mw = createMiddleware('false', 'true');
      const req = createRequest({ url: '/produtos' });
      const logSpy = jest.spyOn((mw as any).logger, 'warn');

      await mw.use(req, mockRes, mockNext);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(RlsRiskReason.TENANT_CONTEXT_MISSING),
        expect.any(String),
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should log SUPER_ADMIN_BYPASS for super admin requests', async () => {
      const mw = createMiddleware('false', 'true');
      const req = createRequest({ user: { cargo: 'SUPER_ADMIN', sub: 'u1' } });
      const logSpy = jest.spyOn((mw as any).logger, 'debug');

      await mw.use(req, mockRes, mockNext);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(RlsRiskReason.SUPER_ADMIN_BYPASS),
        expect.any(String),
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should log PUBLIC_ROUTE_ACCESS for public routes', async () => {
      const mw = createMiddleware('false', 'true');
      const req = createRequest({ url: '/health/ready' });
      const logSpy = jest.spyOn((mw as any).logger, 'debug');

      await mw.use(req, mockRes, mockNext);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(RlsRiskReason.PUBLIC_ROUTE_ACCESS),
        expect.any(String),
      );
    });

    it('should NOT log for normal tenant requests (no risk)', async () => {
      const mw = createMiddleware('false', 'true');
      const req = createRequest({
        user: { tenantId: 'abc', cargo: 'ADMIN' },
        tenant: { id: 'abc' },
      });
      const warnSpy = jest.spyOn((mw as any).logger, 'warn');
      const debugSpy = jest.spyOn((mw as any).logger, 'debug');

      await mw.use(req, mockRes, mockNext);

      expect(warnSpy).not.toHaveBeenCalled();
      expect(debugSpy).not.toHaveBeenCalled();
    });
  });

  describe('Fase 2/3 — ENABLED', () => {
    it('should call set_config with tenantId', async () => {
      const mw = createMiddleware('true', 'false');
      const tenantId = '550e8400-e29b-41d4-a716-446655440001';
      const req = createRequest({
        user: { tenantId },
        tenant: { id: tenantId },
      });

      await mw.use(req, mockRes, mockNext);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        `SELECT set_config('app.current_tenant_id', $1, false)`,
        [tenantId],
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should clear session var for requests without tenantId', async () => {
      const mw = createMiddleware('true', 'false');
      const req = createRequest({ url: '/health' });

      await mw.use(req, mockRes, mockNext);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        `SELECT set_config('app.current_tenant_id', '', false)`,
      );
    });

    it('should log RLS_SESSION_NOT_SET on DB error', async () => {
      mockDataSource.query.mockRejectedValueOnce(new Error('connection lost'));
      const mw = createMiddleware('true', 'false');
      const req = createRequest({
        user: { tenantId: 'abc' },
        tenant: { id: 'abc' },
      });
      const warnSpy = jest.spyOn((mw as any).logger, 'warn').mockImplementation();
      const debugSpy = jest.spyOn((mw as any).logger, 'debug').mockImplementation();

      await mw.use(req, mockRes, mockNext);

      // RLS_SESSION_NOT_SET is logged via debug (not warn per severity logic)
      const allCalls = [...warnSpy.mock.calls, ...debugSpy.mock.calls];
      const rlsCall = allCalls.find(c =>
        typeof c[0] === 'string' && c[0].includes(RlsRiskReason.RLS_SESSION_NOT_SET),
      );
      expect(rlsCall).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('RequestId propagation', () => {
    it('should include requestId from req.requestId in risk events', async () => {
      const mw = createMiddleware('false', 'true');
      const req = createRequest({
        url: '/produtos',
        requestId: 'req-123-456',
      });
      const logSpy = jest.spyOn((mw as any).logger, 'warn');

      await mw.use(req, mockRes, mockNext);

      const loggedJson = logSpy.mock.calls[0]?.[1];
      expect(loggedJson).toContain('req-123-456');
    });

    it('should include requestId from x-request-id header', async () => {
      const mw = createMiddleware('false', 'true');
      const req = createRequest({
        url: '/produtos',
        headers: { 'x-request-id': 'header-req-789' },
      });
      const logSpy = jest.spyOn((mw as any).logger, 'warn');

      await mw.use(req, mockRes, mockNext);

      const loggedJson = logSpy.mock.calls[0]?.[1];
      expect(loggedJson).toContain('header-req-789');
    });
  });
});
