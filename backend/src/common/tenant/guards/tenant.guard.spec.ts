import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard, SKIP_TENANT_GUARD } from './tenant.guard';
import { TenantContextService } from '../tenant-context.service';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let tenantContext: TenantContextService;
  let reflector: Reflector;

  const TENANT_A = '550e8400-e29b-41d4-a716-446655440001';
  const TENANT_B = '550e8400-e29b-41d4-a716-446655440002';

  const createMockContext = (user: any, tenantId?: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          ip: '192.168.1.1',
          method: 'GET',
          url: '/produtos',
          headers: { 'user-agent': 'test-agent' },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantContextService,
        Reflector,
      ],
    }).compile();

    tenantContext = await module.resolve<TenantContextService>(TenantContextService);
    reflector = module.get<Reflector>(Reflector);
    
    guard = new TenantGuard(tenantContext, reflector);
  });

  describe('canActivate', () => {
    it('deve permitir acesso quando tenant do JWT coincide com contexto', async () => {
      tenantContext.setTenantId(TENANT_A, 'Bar A');
      
      const user = { id: 'user-1', email: 'user@bara.com', empresaId: TENANT_A };
      const context = createMockContext(user);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('deve bloquear acesso quando tenant do JWT difere do contexto', async () => {
      tenantContext.setTenantId(TENANT_B, 'Bar B'); // Contexto é Bar B
      
      const user = { id: 'user-1', email: 'user@bara.com', empresaId: TENANT_A }; // Usuário é do Bar A
      const context = createMockContext(user);

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('deve retornar 403 com detalhes da violação', async () => {
      tenantContext.setTenantId(TENANT_B, 'Bar B');
      
      const user = { id: 'user-1', email: 'user@bara.com', empresaId: TENANT_A };
      const context = createMockContext(user);

      try {
        await guard.canActivate(context);
        fail('Deveria ter lançado ForbiddenException');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.getResponse()).toMatchObject({
          statusCode: 403,
          error: 'Forbidden',
          details: {
            reason: 'CROSS_TENANT_ACCESS_DENIED',
            userTenant: TENANT_A,
            requestedTenant: TENANT_B,
          },
        });
      }
    });

    it('deve permitir acesso se não há usuário autenticado', async () => {
      tenantContext.setTenantId(TENANT_A, 'Bar A');
      
      const context = createMockContext(null);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('deve permitir acesso se não há tenant no contexto (rota pública)', async () => {
      // Não define tenant no contexto
      const user = { id: 'user-1', email: 'user@bara.com', empresaId: TENANT_A };
      const context = createMockContext(user);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('deve permitir acesso se usuário não tem tenant associado', async () => {
      tenantContext.setTenantId(TENANT_A, 'Bar A');
      
      const user = { id: 'admin-1', email: 'admin@sistema.com' }; // Sem empresaId
      const context = createMockContext(user);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('deve suportar tenantId como alternativa a empresaId', async () => {
      tenantContext.setTenantId(TENANT_A, 'Bar A');
      
      const user = { id: 'user-1', email: 'user@bara.com', tenantId: TENANT_A };
      const context = createMockContext(user);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe('SkipTenantGuard decorator', () => {
    it('deve pular validação quando decorator está presente', async () => {
      tenantContext.setTenantId(TENANT_B, 'Bar B');
      
      const user = { id: 'user-1', email: 'user@bara.com', empresaId: TENANT_A };
      
      // Simula que o handler tem o decorator
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      
      const context = createMockContext(user);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});

describe('Cenários de Segurança', () => {
  let guard: TenantGuard;
  let tenantContext: TenantContextService;
  let reflector: Reflector;

  const TENANT_BAR_A = '550e8400-e29b-41d4-a716-446655440001';
  const TENANT_BAR_B = '550e8400-e29b-41d4-a716-446655440002';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantContextService, Reflector],
    }).compile();

    tenantContext = await module.resolve<TenantContextService>(TenantContextService);
    reflector = module.get<Reflector>(Reflector);
    guard = new TenantGuard(tenantContext, reflector);
  });

  it('Cenário: Usuário do Bar A tenta acessar Bar B via subdomínio', async () => {
    // Usuário logado no Bar A
    const user = {
      id: 'garcom-joao',
      email: 'joao@bara.com',
      empresaId: TENANT_BAR_A,
      cargo: 'GARCOM',
    };

    // Tenta acessar bar-b.pubsystem.com (contexto é Bar B)
    tenantContext.setTenantId(TENANT_BAR_B, 'Bar B');

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          ip: '192.168.1.100',
          method: 'GET',
          url: '/produtos',
          headers: { 
            'user-agent': 'Mozilla/5.0',
            'host': 'bar-b.pubsystem.com',
          },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    // Deve ser bloqueado
    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('Cenário: Usuário do Bar A acessa normalmente Bar A', async () => {
    const user = {
      id: 'garcom-joao',
      email: 'joao@bara.com',
      empresaId: TENANT_BAR_A,
      cargo: 'GARCOM',
    };

    tenantContext.setTenantId(TENANT_BAR_A, 'Bar A');

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          ip: '192.168.1.100',
          method: 'GET',
          url: '/produtos',
          headers: { 
            'user-agent': 'Mozilla/5.0',
            'host': 'bar-a.pubsystem.com',
          },
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
