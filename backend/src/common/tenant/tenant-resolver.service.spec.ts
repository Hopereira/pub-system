import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TenantResolverService } from './tenant-resolver.service';
import { Empresa } from '../../modulos/empresa/entities/empresa.entity';
import { Tenant } from './entities/tenant.entity';

describe('TenantResolverService', () => {
  let service: TenantResolverService;
  let empresaRepository: jest.Mocked<Repository<Empresa>>;

  const mockEmpresa: Partial<Empresa> = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    slug: 'bar-do-ze',
    nomeFantasia: 'Bar do Zé',
    ativo: true,
  };

  let mockQueryBuilder: any;

  beforeEach(async () => {
    mockQueryBuilder = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantResolverService,
        {
          provide: getRepositoryToken(Empresa),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TenantResolverService>(TenantResolverService);
    empresaRepository = module.get(getRepositoryToken(Empresa));

    // Limpar cache entre testes
    service.clearCache();
  });

  describe('resolveBySlug', () => {
    it('deve resolver tenant por slug', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockEmpresa as Empresa);

      const result = await service.resolveBySlug('bar-do-ze');

      expect(result.id).toBe(mockEmpresa.id);
      expect(result.slug).toBe(mockEmpresa.slug);
      expect(result.nomeFantasia).toBe(mockEmpresa.nomeFantasia);
    });

    it('deve normalizar slug para lowercase', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockEmpresa as Empresa);

      await service.resolveBySlug('BAR-DO-ZE');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'empresa.slug = :slug',
        { slug: 'bar-do-ze' },
      );
    });

    it('deve lançar NotFoundException se tenant não encontrado', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.resolveBySlug('inexistente')).rejects.toThrow(
        NotFoundException
      );
    });

    it('deve lançar NotFoundException se tenant inativo', async () => {
      mockQueryBuilder.getOne.mockResolvedValue({
        ...mockEmpresa,
        ativo: false,
      } as Empresa);

      await expect(service.resolveBySlug('bar-do-ze')).rejects.toThrow(
        NotFoundException
      );
    });

    it('deve usar cache na segunda chamada', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockEmpresa as Empresa);

      await service.resolveBySlug('bar-do-ze');
      await service.resolveBySlug('bar-do-ze');

      // Deve chamar o banco apenas uma vez (segunda chamada usa cache)
      expect(empresaRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    });
  });

  describe('resolveById', () => {
    it('deve resolver tenant por ID', async () => {
      empresaRepository.findOne.mockResolvedValue(mockEmpresa as Empresa);

      const result = await service.resolveById(mockEmpresa.id!);

      expect(result.id).toBe(mockEmpresa.id);
      expect(result.nomeFantasia).toBe(mockEmpresa.nomeFantasia);
    });

    it('deve lançar ForbiddenException se tenant não encontrado', async () => {
      empresaRepository.findOne.mockResolvedValue(null);

      await expect(
        service.resolveById('550e8400-e29b-41d4-a716-446655440099')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('extractSlugFromHostname', () => {
    it('deve extrair slug de subdomínio pubsystem.com.br', () => {
      expect(service.extractSlugFromHostname('bar-do-ze.pubsystem.com.br')).toBe('bar-do-ze');
    });

    it('deve extrair slug de subdomínio pubsystem.com', () => {
      expect(service.extractSlugFromHostname('bar-do-ze.pubsystem.com')).toBe('bar-do-ze');
    });

    it('deve retornar null para domínio principal', () => {
      expect(service.extractSlugFromHostname('pubsystem.com.br')).toBeNull();
      expect(service.extractSlugFromHostname('pubsystem.com')).toBeNull();
    });

    it('deve retornar null para localhost', () => {
      expect(service.extractSlugFromHostname('localhost')).toBeNull();
      expect(service.extractSlugFromHostname('localhost:3000')).toBeNull();
    });

    it('deve ignorar subdomínios especiais', () => {
      expect(service.extractSlugFromHostname('www.pubsystem.com.br')).toBeNull();
      expect(service.extractSlugFromHostname('api.pubsystem.com.br')).toBeNull();
      expect(service.extractSlugFromHostname('admin.pubsystem.com.br')).toBeNull();
      expect(service.extractSlugFromHostname('app.pubsystem.com.br')).toBeNull();
    });

    it('deve remover porta do hostname', () => {
      expect(service.extractSlugFromHostname('bar-do-ze.pubsystem.com.br:443')).toBe('bar-do-ze');
    });
  });

  describe('extractSlugFromPath', () => {
    it('deve extrair slug de /menu/:slug', () => {
      expect(service.extractSlugFromPath('/menu/bar-do-ze')).toBe('bar-do-ze');
      expect(service.extractSlugFromPath('/menu/bar-do-ze/produtos')).toBe('bar-do-ze');
    });

    it('deve extrair slug de /evento/:slug', () => {
      expect(service.extractSlugFromPath('/evento/bar-do-ze')).toBe('bar-do-ze');
    });

    it('deve extrair slug de /comanda/:slug', () => {
      expect(service.extractSlugFromPath('/comanda/bar-do-ze')).toBe('bar-do-ze');
    });

    it('deve retornar null para paths sem slug', () => {
      expect(service.extractSlugFromPath('/dashboard')).toBeNull();
      expect(service.extractSlugFromPath('/auth/login')).toBeNull();
      expect(service.extractSlugFromPath('/produtos')).toBeNull();
    });

    it('deve retornar null para paths vazios', () => {
      expect(service.extractSlugFromPath('/menu/')).toBeNull();
    });
  });

  describe('cache', () => {
    it('deve invalidar cache corretamente', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockEmpresa as Empresa);

      await service.resolveBySlug('bar-do-ze');
      service.invalidateCache(mockEmpresa.id!, mockEmpresa.slug);
      await service.resolveBySlug('bar-do-ze');

      // Deve chamar o banco duas vezes (cache foi invalidado)
      expect(empresaRepository.createQueryBuilder).toHaveBeenCalledTimes(2);
    });

    it('deve limpar todo o cache', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockEmpresa as Empresa);

      await service.resolveBySlug('bar-do-ze');
      service.clearCache();
      await service.resolveBySlug('bar-do-ze');

      expect(empresaRepository.createQueryBuilder).toHaveBeenCalledTimes(2);
    });
  });
});
