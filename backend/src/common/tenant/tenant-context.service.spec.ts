import { Test, TestingModule } from '@nestjs/testing';
import { TenantContextService } from './tenant-context.service';
import { TenantNotSetError, createTenantId } from './tenant.types';

describe('TenantContextService', () => {
  let service: TenantContextService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantContextService],
    }).compile();

    // Cria uma nova instância para cada teste (simula escopo REQUEST)
    service = await module.resolve<TenantContextService>(TenantContextService);
  });

  describe('setTenantId', () => {
    it('deve definir o tenant ID corretamente', () => {
      const tenantId = '550e8400-e29b-41d4-a716-446655440000';
      
      service.setTenantId(tenantId);
      
      expect(service.getTenantId()).toBe(tenantId);
      expect(service.hasTenant()).toBe(true);
    });

    it('deve definir o tenant ID com nome', () => {
      const tenantId = '550e8400-e29b-41d4-a716-446655440000';
      const tenantName = 'Bar do João';
      
      service.setTenantId(tenantId, tenantName);
      
      expect(service.getTenantId()).toBe(tenantId);
      expect(service.getTenantName()).toBe(tenantName);
    });

    it('deve lançar erro se tentar alterar tenant já definido', () => {
      const tenantId1 = '550e8400-e29b-41d4-a716-446655440000';
      const tenantId2 = '660e8400-e29b-41d4-a716-446655440001';
      
      service.setTenantId(tenantId1);
      
      expect(() => service.setTenantId(tenantId2)).toThrow(
        /Tentativa de alterar tenant já definido/
      );
    });

    it('deve lançar erro para UUID inválido', () => {
      expect(() => service.setTenantId('invalid-uuid')).toThrow(
        /TenantId inválido/
      );
    });

    it('deve lançar erro para ID vazio', () => {
      expect(() => service.setTenantId('')).toThrow(
        /TenantId não pode ser vazio/
      );
    });
  });

  describe('getTenantId', () => {
    it('deve lançar TenantNotSetError se tenant não foi definido', () => {
      expect(() => service.getTenantId()).toThrow(TenantNotSetError);
    });

    it('deve retornar o tenant ID após ser definido', () => {
      const tenantId = '550e8400-e29b-41d4-a716-446655440000';
      service.setTenantId(tenantId);
      
      expect(service.getTenantId()).toBe(tenantId);
    });
  });

  describe('getTenantIdOrNull', () => {
    it('deve retornar null se tenant não foi definido', () => {
      expect(service.getTenantIdOrNull()).toBeNull();
    });

    it('deve retornar o tenant ID após ser definido', () => {
      const tenantId = '550e8400-e29b-41d4-a716-446655440000';
      service.setTenantId(tenantId);
      
      expect(service.getTenantIdOrNull()).toBe(tenantId);
    });
  });

  describe('hasTenant', () => {
    it('deve retornar false antes de definir tenant', () => {
      expect(service.hasTenant()).toBe(false);
    });

    it('deve retornar true após definir tenant', () => {
      service.setTenantId('550e8400-e29b-41d4-a716-446655440000');
      expect(service.hasTenant()).toBe(true);
    });
  });

  describe('getContext', () => {
    it('deve retornar null se tenant não foi definido', () => {
      expect(service.getContext()).toBeNull();
    });

    it('deve retornar contexto completo após definir tenant', () => {
      const tenantId = '550e8400-e29b-41d4-a716-446655440000';
      const tenantName = 'Bar do João';
      
      service.setTenantId(tenantId, tenantName);
      
      const context = service.getContext();
      expect(context).not.toBeNull();
      expect(context?.tenantId).toBe(tenantId);
      expect(context?.tenantName).toBe(tenantName);
      expect(context?.setAt).toBeInstanceOf(Date);
    });

    it('deve retornar cópia imutável do contexto', () => {
      const tenantId = '550e8400-e29b-41d4-a716-446655440000';
      service.setTenantId(tenantId);
      
      const context1 = service.getContext();
      const context2 = service.getContext();
      
      expect(context1).not.toBe(context2); // Objetos diferentes
      expect(context1?.tenantId).toBe(context2?.tenantId); // Mesmo valor
    });
  });
});

describe('createTenantId', () => {
  it('deve criar TenantId válido', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const tenantId = createTenantId(id);
    expect(tenantId).toBe(id);
  });

  it('deve aceitar UUIDs em maiúsculas', () => {
    const id = '550E8400-E29B-41D4-A716-446655440000';
    const tenantId = createTenantId(id);
    expect(tenantId).toBe(id);
  });

  it('deve rejeitar strings vazias', () => {
    expect(() => createTenantId('')).toThrow(/não pode ser vazio/);
  });

  it('deve rejeitar UUIDs inválidos', () => {
    expect(() => createTenantId('not-a-uuid')).toThrow(/TenantId inválido/);
    expect(() => createTenantId('12345')).toThrow(/TenantId inválido/);
  });
});

describe('Isolamento entre requisições (simulado)', () => {
  it('deve manter contextos isolados entre instâncias', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantContextService],
    }).compile();

    // Simula duas requisições simultâneas
    const service1 = await module.resolve<TenantContextService>(TenantContextService);
    const service2 = await module.resolve<TenantContextService>(TenantContextService);

    const tenant1 = '550e8400-e29b-41d4-a716-446655440001';
    const tenant2 = '550e8400-e29b-41d4-a716-446655440002';

    // Define tenants diferentes em cada "requisição"
    service1.setTenantId(tenant1, 'Bar 1');
    service2.setTenantId(tenant2, 'Bar 2');

    // Verifica isolamento
    expect(service1.getTenantId()).toBe(tenant1);
    expect(service2.getTenantId()).toBe(tenant2);
    expect(service1.getTenantName()).toBe('Bar 1');
    expect(service2.getTenantName()).toBe('Bar 2');
  });

  it('deve criar instâncias independentes para cada resolve()', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantContextService],
    }).compile();

    const instances: TenantContextService[] = [];
    
    // Cria 10 instâncias (simula 10 requisições)
    for (let i = 0; i < 10; i++) {
      const instance = await module.resolve<TenantContextService>(TenantContextService);
      instances.push(instance);
    }

    // Define tenant em cada instância
    instances.forEach((instance, index) => {
      const tenantId = `550e8400-e29b-41d4-a716-44665544000${index}`;
      instance.setTenantId(tenantId, `Bar ${index}`);
    });

    // Verifica que cada instância mantém seu próprio tenant
    instances.forEach((instance, index) => {
      const expectedId = `550e8400-e29b-41d4-a716-44665544000${index}`;
      expect(instance.getTenantId()).toBe(expectedId);
      expect(instance.getTenantName()).toBe(`Bar ${index}`);
    });
  });
});
