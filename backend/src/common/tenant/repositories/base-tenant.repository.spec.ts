import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { BaseTenantRepository, TenantAwareEntity } from './base-tenant.repository';
import { TenantContextService } from '../tenant-context.service';
import { TenantNotSetError } from '../tenant.types';

// Entidade de teste
interface TestEntity extends TenantAwareEntity {
  id: string;
  nome: string;
  tenantId: string;
}

// Implementação concreta para testes
class TestTenantRepository extends BaseTenantRepository<TestEntity> {
  constructor(
    repository: Repository<TestEntity>,
    tenantContext: TenantContextService,
  ) {
    super(repository, tenantContext);
  }
}

describe('BaseTenantRepository', () => {
  let repository: TestTenantRepository;
  let mockTypeOrmRepo: jest.Mocked<Repository<TestEntity>>;
  let tenantContext: TenantContextService;

  const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
  const OTHER_TENANT_ID = '660e8400-e29b-41d4-a716-446655440001';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantContextService],
    }).compile();

    tenantContext = await module.resolve<TenantContextService>(TenantContextService);
    tenantContext.setTenantId(TENANT_ID, 'Bar Teste');

    mockTypeOrmRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      count: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(),
      metadata: {},
    } as any;

    repository = new TestTenantRepository(mockTypeOrmRepo, tenantContext);
  });

  describe('find', () => {
    it('deve adicionar filtro de tenant automaticamente', async () => {
      mockTypeOrmRepo.find.mockResolvedValue([]);

      await repository.find();

      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID },
      });
    });

    it('deve mesclar filtro de tenant com outras condições', async () => {
      mockTypeOrmRepo.find.mockResolvedValue([]);

      await repository.find({ where: { nome: 'Produto' } as any });

      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        where: { nome: 'Produto', tenantId: TENANT_ID },
      });
    });

    it('deve adicionar tenant em cada condição de array where', async () => {
      mockTypeOrmRepo.find.mockResolvedValue([]);

      await repository.find({
        where: [{ nome: 'A' }, { nome: 'B' }] as any,
      });

      expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
        where: [
          { nome: 'A', tenantId: TENANT_ID },
          { nome: 'B', tenantId: TENANT_ID },
        ],
      });
    });
  });

  describe('findOne', () => {
    it('deve adicionar filtro de tenant automaticamente', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      await repository.findOne({ where: { id: '123' } as any });

      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: '123', tenantId: TENANT_ID },
      });
    });
  });

  describe('findById', () => {
    it('deve retornar null se registro pertence a outro tenant', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('123');

      expect(result).toBeNull();
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: '123', tenantId: TENANT_ID },
      });
    });

    it('deve retornar registro se pertence ao tenant correto', async () => {
      const entity = { id: '123', nome: 'Teste', tenantId: TENANT_ID };
      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById('123');

      expect(result).toEqual(entity);
    });
  });

  describe('count', () => {
    it('deve contar apenas registros do tenant', async () => {
      mockTypeOrmRepo.count.mockResolvedValue(5);

      const result = await repository.count();

      expect(result).toBe(5);
      expect(mockTypeOrmRepo.count).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID },
      });
    });
  });

  describe('save', () => {
    it('deve adicionar tenant_id automaticamente ao salvar', async () => {
      const entity = { nome: 'Novo Produto' };
      const savedEntity = { id: '123', nome: 'Novo Produto', tenantId: TENANT_ID };
      mockTypeOrmRepo.save.mockResolvedValue(savedEntity);

      await repository.save(entity as any);

      expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(
        { nome: 'Novo Produto', tenantId: TENANT_ID },
        undefined,
      );
    });
  });

  describe('create', () => {
    it('deve criar entidade com tenant_id', () => {
      const entity = { nome: 'Novo' };
      mockTypeOrmRepo.create.mockReturnValue({ ...entity, tenantId: TENANT_ID } as any);

      repository.create(entity as any);

      expect(mockTypeOrmRepo.create).toHaveBeenCalledWith({
        nome: 'Novo',
        tenantId: TENANT_ID,
      });
    });
  });

  describe('createQueryBuilder', () => {
    it('deve criar query builder com filtro de tenant', () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
      };
      mockTypeOrmRepo.createQueryBuilder.mockReturnValue(mockQb as any);

      repository.createQueryBuilder('produto');

      expect(mockTypeOrmRepo.createQueryBuilder).toHaveBeenCalledWith('produto');
      expect(mockQb.where).toHaveBeenCalledWith(
        'produto.tenantId = :tenantId',
        { tenantId: TENANT_ID },
      );
    });
  });

  describe('sem tenant definido', () => {
    it('deve lançar erro ao tentar buscar sem tenant', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [TenantContextService],
      }).compile();

      const newTenantContext = await module.resolve<TenantContextService>(TenantContextService);
      // NÃO define tenant
      
      const repoSemTenant = new TestTenantRepository(mockTypeOrmRepo, newTenantContext);

      await expect(repoSemTenant.find()).rejects.toThrow(TenantNotSetError);
    });
  });

  describe('isolamento de dados', () => {
    it('não deve retornar dados de outro tenant mesmo com ID válido', async () => {
      // Simula que o registro existe mas pertence a outro tenant
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('id-de-outro-tenant');

      // Deve retornar null porque o filtro de tenant não encontra
      expect(result).toBeNull();
    });
  });
});
