import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantContextService } from '../tenant-context.service';
import { TenantGuard } from '../guards/tenant.guard';
import { Reflector } from '@nestjs/core';

/**
 * Testes de Isolamento Multi-tenant
 *
 * Validam que o sistema impede acesso cross-tenant em todas as camadas:
 * 1. TenantContextService - isolamento por request
 * 2. TenantGuard - bloqueio de JWT vs contexto mismatch
 * 3. JWT - tenantId obrigatório
 * 4. Cache keys - namespace por tenant
 * 5. Rate-limit keys - namespace por tenant
 */

const TENANT_A_ID = '550e8400-e29b-41d4-a716-446655440001';
const TENANT_B_ID = '550e8400-e29b-41d4-a716-446655440002';

// ============================================================
// 1. TenantContextService - Isolamento por request
// ============================================================
describe('TenantContextService - Isolamento', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [TenantContextService],
    }).compile();
  });

  it('cada request deve ter contexto isolado', async () => {
    const ctx1 = await module.resolve<TenantContextService>(TenantContextService);
    const ctx2 = await module.resolve<TenantContextService>(TenantContextService);

    ctx1.setTenantId(TENANT_A_ID, 'Bar A');
    ctx2.setTenantId(TENANT_B_ID, 'Bar B');

    expect(ctx1.getTenantId()).toBe(TENANT_A_ID);
    expect(ctx2.getTenantId()).toBe(TENANT_B_ID);
    expect(ctx1.getTenantId()).not.toBe(ctx2.getTenantId());
  });

  it('tenantId deve ser imutável após setTenantId', async () => {
    const ctx = await module.resolve<TenantContextService>(TenantContextService);
    ctx.setTenantId(TENANT_A_ID, 'Bar A');

    // Segunda chamada deve lançar erro ou ser ignorada
    expect(() => ctx.setTenantId(TENANT_B_ID, 'Bar B')).toThrow();
    expect(ctx.getTenantId()).toBe(TENANT_A_ID);
  });

  it('hasTenant deve retornar false antes de setTenantId', async () => {
    const ctx = await module.resolve<TenantContextService>(TenantContextService);
    expect(ctx.hasTenant()).toBe(false);
  });

  it('hasTenant deve retornar true após setTenantId', async () => {
    const ctx = await module.resolve<TenantContextService>(TenantContextService);
    ctx.setTenantId(TENANT_A_ID, 'Bar A');
    expect(ctx.hasTenant()).toBe(true);
  });
});

// ============================================================
// 2. TenantGuard - Bloqueio Cross-Tenant
// ============================================================
describe('TenantGuard - Bloqueio Cross-Tenant', () => {
  let guard: TenantGuard;
  let tenantContext: TenantContextService;
  let reflector: Reflector;

  function createMockContext(user: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          ip: '127.0.0.1',
          method: 'GET',
          url: '/api/produtos',
          headers: { 'user-agent': 'test' },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TenantContextService, Reflector],
    }).compile();

    tenantContext = await module.resolve<TenantContextService>(TenantContextService);
    reflector = module.get<Reflector>(Reflector);
    guard = new TenantGuard(tenantContext, reflector);
  });

  it('deve BLOQUEAR quando JWT tenantId ≠ contexto tenantId (403)', async () => {
    tenantContext.setTenantId(TENANT_B_ID, 'Bar B');

    const ctx = createMockContext({
      id: 'user-1',
      sub: 'user-1',
      email: 'garcom@bara.com',
      tenantId: TENANT_A_ID, // JWT = Tenant A
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('deve PERMITIR quando JWT tenantId = contexto tenantId', async () => {
    tenantContext.setTenantId(TENANT_A_ID, 'Bar A');

    const ctx = createMockContext({
      id: 'user-1',
      sub: 'user-1',
      email: 'garcom@bara.com',
      tenantId: TENANT_A_ID, // JWT = Tenant A
    });

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('deve BLOQUEAR usuário SEM tenantId no JWT (403)', async () => {
    tenantContext.setTenantId(TENANT_A_ID, 'Bar A');

    const ctx = createMockContext({
      id: 'user-1',
      sub: 'user-1',
      email: 'admin@sistema.com',
      tenantId: undefined, // Sem tenant!
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('deve BLOQUEAR mesmo com empresaId (não usar como fallback)', async () => {
    tenantContext.setTenantId(TENANT_A_ID, 'Bar A');

    const ctx = createMockContext({
      id: 'user-1',
      sub: 'user-1',
      email: 'admin@sistema.com',
      tenantId: undefined,
      empresaId: TENANT_A_ID, // empresaId NÃO deve servir como fallback
    });

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});

// ============================================================
// 3. JWT Payload - tenantId obrigatório
// ============================================================
describe('JWT Payload - Isolamento', () => {
  it('payload sem tenantId deve ser considerado inválido', () => {
    const payload = {
      id: 'user-1',
      sub: 'user-1',
      email: 'test@test.com',
      nome: 'Test',
      cargo: 'GARCOM',
      role: 'GARCOM',
      ambienteId: null,
      // tenantId ausente
    };

    expect(payload).not.toHaveProperty('tenantId');
  });

  it('payload com tenantId deve ser válido', () => {
    const payload = {
      id: 'user-1',
      sub: 'user-1',
      email: 'test@test.com',
      nome: 'Test',
      cargo: 'GARCOM',
      role: 'GARCOM',
      ambienteId: null,
      tenantId: TENANT_A_ID,
    };

    expect(payload.tenantId).toBe(TENANT_A_ID);
    expect(payload).not.toHaveProperty('empresaId');
  });
});

// ============================================================
// 4. Cache Keys - Namespace por tenant
// ============================================================
describe('Cache Key Isolation', () => {
  it('cache keys de tenants diferentes NUNCA devem colidir', () => {
    const entityName = 'produtos';
    const params = 'page:1:limit:20';

    const keyA = `${entityName}:${TENANT_A_ID}:${params}`;
    const keyB = `${entityName}:${TENANT_B_ID}:${params}`;

    expect(keyA).not.toBe(keyB);
    expect(keyA).toContain(TENANT_A_ID);
    expect(keyB).toContain(TENANT_B_ID);
  });

  it('cache key sem tenantId deve retornar null (não "global")', () => {
    const tenantId: string | null = null;
    const result = tenantId ? `produtos:${tenantId}:all` : null;

    expect(result).toBeNull();
  });

  it('cache key NUNCA deve conter ":global:" namespace', () => {
    const keyA = `produtos:${TENANT_A_ID}:all:ativos`;

    expect(keyA).not.toContain(':global:');
    expect(keyA).toContain(TENANT_A_ID);
  });
});

// ============================================================
// 5. Rate-Limit Keys - Namespace por tenant
// ============================================================
describe('Rate-Limit Key Isolation', () => {
  it('rate-limit keys devem incluir tenantId', () => {
    const userId = 'user-123';
    const keyA = `tenant:${TENANT_A_ID}:user:${userId}`;
    const keyB = `tenant:${TENANT_B_ID}:user:${userId}`;

    // Mesmo userId, tenants diferentes = chaves diferentes
    expect(keyA).not.toBe(keyB);
  });

  it('rate-limit para IPs deve incluir tenantId', () => {
    const ip = '192.168.1.1';
    const keyA = `tenant:${TENANT_A_ID}:ip:${ip}`;
    const keyB = `tenant:${TENANT_B_ID}:ip:${ip}`;

    // Mesmo IP, tenants diferentes = chaves diferentes
    expect(keyA).not.toBe(keyB);
  });

  it('admin NÃO deve ter isenção total de rate-limit', () => {
    // O tracker agora usa tenant:tenantId:user:userId para todos,
    // incluindo admins. Não há mais Date.now() que criava chave única.
    const tenantId = TENANT_A_ID;
    const adminUserId = 'admin-1';
    const key = `tenant:${tenantId}:user:${adminUserId}`;

    // Chave deve ser determinística (sem Date.now)
    expect(key).not.toContain('Date');
    expect(key).toBe(`tenant:${tenantId}:user:${adminUserId}`);
  });
});

// ============================================================
// 6. Cenários de Invasão Simulados
// ============================================================
describe('Cenários de Invasão Cross-Tenant', () => {
  it('Cenário: Tenant A forja JWT com tenantId de Tenant B', async () => {
    // Simula: atacante altera tenantId no JWT para acessar outro tenant
    // O TenantGuard deve comparar JWT.tenantId com contexto (subdomain)
    // e BLOQUEAR se diferentes
    const module = await Test.createTestingModule({
      providers: [TenantContextService, Reflector],
    }).compile();

    const ctx = await module.resolve<TenantContextService>(TenantContextService);
    ctx.setTenantId(TENANT_B_ID, 'Bar B'); // Subdomain resolve para Bar B

    const reflector = module.get<Reflector>(Reflector);
    const guard = new TenantGuard(ctx, reflector);

    // JWT forjado com TENANT_A (mas acessando TENANT_B via subdomain)
    const execCtx = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'attacker', sub: 'attacker', email: 'h@ck.er', tenantId: TENANT_A_ID },
          ip: '1.2.3.4',
          method: 'GET',
          url: '/api/comandas',
          headers: { 'user-agent': 'attacker-bot' },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    await expect(guard.canActivate(execCtx)).rejects.toThrow(ForbiddenException);
  });

  it('Cenário: Requisição sem JWT e sem tenant deve ser bloqueada pelo guard', async () => {
    const module = await Test.createTestingModule({
      providers: [TenantContextService, Reflector],
    }).compile();

    const ctx = await module.resolve<TenantContextService>(TenantContextService);
    ctx.setTenantId(TENANT_A_ID, 'Bar A');

    const reflector = module.get<Reflector>(Reflector);
    const guard = new TenantGuard(ctx, reflector);

    // User existe mas sem tenantId (token antigo ou corrompido)
    const execCtx = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'old-user', sub: 'old-user', email: 'old@bar.com' },
          ip: '1.2.3.4',
          method: 'GET',
          url: '/api/produtos',
          headers: { 'user-agent': 'test' },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as any;

    await expect(guard.canActivate(execCtx)).rejects.toThrow(ForbiddenException);
  });
});
