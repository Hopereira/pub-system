import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { REQUEST } from '@nestjs/core';
import { ProdutoService } from './produto.service';
import { ProdutoRepository } from './produto.repository';
import { AmbienteRepository } from '../ambiente/ambiente.repository';
import { GcsStorageService } from 'src/shared/storage/gcs-storage.service';
import { CacheInvalidationService } from '../../cache/cache-invalidation.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { NotFoundException } from '@nestjs/common';

describe('ProdutoService', () => {
  let service: ProdutoService;
  let produtoRepository: any;
  let ambienteRepository: any;
  let storageService: any;

  const mockProdutoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    preload: jest.fn(),
    findAtivosComAmbiente: jest.fn(),
    findByIdComAmbiente: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAmbienteRepository = {
    findOne: jest.fn(),
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  // Mock data
  const mockAmbiente = {
    id: 'ambiente-uuid-1',
    nome: 'Cozinha',
    tipo: 'PREPARO',
  };

  const mockProduto = {
    id: 'produto-uuid-1',
    nome: 'Cerveja Pilsen',
    descricao: 'Cerveja gelada 600ml',
    preco: 15.0,
    ativo: true,
    urlImagem: 'https://storage.googleapis.com/bucket/imagem.jpg',
    ambiente: mockAmbiente,
  };

  const mockFile = {
    fieldname: 'imagem',
    originalname: 'cerveja.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image'),
    size: 1024,
    path: '/tmp/cerveja.jpg',
    filename: 'cerveja.jpg',
    destination: '/tmp',
    stream: null as any,
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProdutoService,
        {
          provide: ProdutoRepository,
          useValue: mockProdutoRepository,
        },
        {
          provide: AmbienteRepository,
          useValue: mockAmbienteRepository,
        },
        {
          provide: GcsStorageService,
          useValue: mockStorageService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
        },
        {
          provide: CacheInvalidationService,
          useValue: { invalidate: jest.fn() },
        },
        {
          provide: TenantContextService,
          useValue: { getTenantId: jest.fn().mockReturnValue('tenant-uuid'), hasTenant: jest.fn().mockReturnValue(true) },
        },
        {
          provide: REQUEST,
          useValue: { tenantId: 'tenant-uuid' },
        },
      ],
    }).compile();

    service = await module.resolve<ProdutoService>(ProdutoService);
    produtoRepository = module.get(ProdutoRepository);
    ambienteRepository = module.get(AmbienteRepository);
    storageService = module.get(GcsStorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // TESTES: create()
  // ============================================
  describe('create', () => {
    const createDto = {
      nome: 'Cerveja Pilsen',
      descricao: 'Cerveja gelada 600ml',
      preco: 15.0,
      ambienteId: mockAmbiente.id,
      categoria: 'Bebidas',
    };

    it('deve criar produto sem imagem', async () => {
      mockAmbienteRepository.findOne.mockResolvedValue(mockAmbiente);
      mockProdutoRepository.create.mockReturnValue(mockProduto);
      mockProdutoRepository.save.mockResolvedValue(mockProduto);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.nome).toBe(mockProduto.nome);
      expect(mockAmbienteRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.ambienteId },
      });
      expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
    });

    it('deve criar produto com imagem', async () => {
      const urlImagem = 'https://storage.googleapis.com/bucket/nova-imagem.jpg';
      mockAmbienteRepository.findOne.mockResolvedValue(mockAmbiente);
      mockProdutoRepository.create.mockReturnValue({ ...mockProduto, urlImagem: null });
      mockStorageService.uploadFile.mockResolvedValue(urlImagem);
      mockProdutoRepository.save.mockResolvedValue({ ...mockProduto, urlImagem });

      const result = await service.create(createDto, mockFile);

      expect(result.urlImagem).toBe(urlImagem);
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(mockFile);
    });

    it('deve lançar NotFoundException se ambiente não existir', async () => {
      mockAmbienteRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createDto)).rejects.toThrow(
        `Ambiente com ID ${createDto.ambienteId} não encontrado.`,
      );
    });
  });

  // ============================================
  // TESTES: findAll()
  // ============================================
  describe('findAll', () => {
    it('deve retornar lista de produtos ativos', async () => {
      mockProdutoRepository.find.mockResolvedValue([mockProduto]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockProdutoRepository.find).toHaveBeenCalledWith({
        where: { ativo: true },
        relations: ['ambiente'],
        order: { nome: 'ASC' },
      });
    });

    it('deve retornar lista vazia se não houver produtos', async () => {
      mockProdutoRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  // ============================================
  // TESTES: findOne()
  // ============================================
  describe('findOne', () => {
    it('deve retornar produto por ID', async () => {
      mockProdutoRepository.findOne.mockResolvedValue(mockProduto);

      const result = await service.findOne(mockProduto.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockProduto.id);
      expect(mockProdutoRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProduto.id },
        relations: ['ambiente'],
      });
    });

    it('deve lançar NotFoundException se produto não existir', async () => {
      mockProdutoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('id-invalido')).rejects.toThrow(
        'Produto com ID id-invalido não encontrado.',
      );
    });
  });

  // ============================================
  // TESTES: update()
  // ============================================
  describe('update', () => {
    const updateDto = { nome: 'Cerveja Premium', preco: 20.0 };

    it('deve atualizar produto sem nova imagem', async () => {
      mockProdutoRepository.preload.mockResolvedValue({
        ...mockProduto,
        ...updateDto,
      });
      mockProdutoRepository.save.mockResolvedValue({
        ...mockProduto,
        ...updateDto,
      });

      const result = await service.update(mockProduto.id, updateDto);

      expect(result.nome).toBe(updateDto.nome);
      expect(result.preco).toBe(updateDto.preco);
      expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
    });

    it('deve atualizar produto com nova imagem e deletar antiga', async () => {
      const novaUrl = 'https://storage.googleapis.com/bucket/nova.jpg';
      const urlImagemAntiga = 'https://storage.googleapis.com/bucket/imagem.jpg';
      mockProdutoRepository.preload.mockResolvedValue({
        ...mockProduto,
        urlImagem: urlImagemAntiga,
      });
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockStorageService.uploadFile.mockResolvedValue(novaUrl);
      mockProdutoRepository.save.mockResolvedValue({
        ...mockProduto,
        urlImagem: novaUrl,
      });

      const result = await service.update(mockProduto.id, updateDto, mockFile);

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(urlImagemAntiga);
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(mockFile);
      expect(result.urlImagem).toBe(novaUrl);
    });

    it('deve atualizar ambiente do produto', async () => {
      const novoAmbiente = { id: 'ambiente-uuid-2', nome: 'Bar' };
      const updateDtoComAmbiente = { ...updateDto, ambienteId: novoAmbiente.id };

      mockProdutoRepository.preload.mockResolvedValue(mockProduto);
      mockAmbienteRepository.findOne.mockResolvedValue(novoAmbiente);
      mockProdutoRepository.save.mockResolvedValue({
        ...mockProduto,
        ambiente: novoAmbiente,
      });

      const result = await service.update(mockProduto.id, updateDtoComAmbiente);

      expect(result.ambiente).toBe(novoAmbiente);
    });

    it('deve lançar NotFoundException se produto não existir', async () => {
      mockProdutoRepository.preload.mockResolvedValue(null);

      await expect(
        service.update('id-invalido', updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se novo ambiente não existir', async () => {
      const updateDtoComAmbiente = { ...updateDto, ambienteId: 'ambiente-invalido' };
      mockProdutoRepository.preload.mockResolvedValue(mockProduto);
      mockAmbienteRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockProduto.id, updateDtoComAmbiente),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve continuar mesmo se falhar ao deletar imagem antiga', async () => {
      const novaUrl = 'https://storage.googleapis.com/bucket/nova.jpg';
      mockProdutoRepository.preload.mockResolvedValue(mockProduto);
      mockStorageService.deleteFile.mockRejectedValue(new Error('GCS error'));
      mockStorageService.uploadFile.mockResolvedValue(novaUrl);
      mockProdutoRepository.save.mockResolvedValue({
        ...mockProduto,
        urlImagem: novaUrl,
      });

      const result = await service.update(mockProduto.id, updateDto, mockFile);

      expect(result.urlImagem).toBe(novaUrl);
    });
  });

  // ============================================
  // TESTES: remove() - Soft Delete
  // ============================================
  describe('remove', () => {
    it('deve inativar produto (soft delete)', async () => {
      mockProdutoRepository.findOne.mockResolvedValue(mockProduto);
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockProdutoRepository.save.mockResolvedValue({
        ...mockProduto,
        ativo: false,
      });

      const result = await service.remove(mockProduto.id);

      expect(result.ativo).toBe(false);
      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(
        mockProduto.urlImagem,
      );
    });

    it('deve inativar produto sem imagem', async () => {
      const produtoSemImagem = { ...mockProduto, urlImagem: null };
      mockProdutoRepository.findOne.mockResolvedValue(produtoSemImagem);
      mockProdutoRepository.save.mockResolvedValue({
        ...produtoSemImagem,
        ativo: false,
      });

      const result = await service.remove(produtoSemImagem.id);

      expect(result.ativo).toBe(false);
      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se produto não existir', async () => {
      mockProdutoRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve continuar mesmo se falhar ao deletar imagem', async () => {
      mockProdutoRepository.findOne.mockResolvedValue(mockProduto);
      mockStorageService.deleteFile.mockRejectedValue(new Error('GCS error'));
      mockProdutoRepository.save.mockResolvedValue({
        ...mockProduto,
        ativo: false,
      });

      const result = await service.remove(mockProduto.id);

      expect(result.ativo).toBe(false);
    });
  });
});
