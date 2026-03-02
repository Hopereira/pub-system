import { Test, TestingModule } from '@nestjs/testing';
import { EventoService } from './evento.service';
import { EventoRepository } from './evento.repository';
import { PaginaEventoRepository } from '../pagina-evento/pagina-evento.repository';
import { Evento } from './entities/evento.entity';
import { PaginaEvento } from '../pagina-evento/entities/pagina-evento.entity';
import { GcsStorageService } from '../../shared/storage/gcs-storage.service';
import { NotFoundException } from '@nestjs/common';

describe('EventoService', () => {
  let service: EventoService;
  let eventoRepository: any;
  let paginaEventoRepository: any;
  let storageService: any;

  const mockEventoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    preload: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
    findAtivosComPaginaEvento: jest.fn(),
    findAllComPaginaEvento: jest.fn(),
    findByIdComPaginaEvento: jest.fn(),
    findByIdPublic: jest.fn(),
    count: jest.fn(),
  };

  const mockPaginaEventoRepository = {
    findOne: jest.fn(),
    findAtiva: jest.fn(),
  };

  const mockStorageService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  // Mock data
  const mockPaginaEvento: Partial<PaginaEvento> = {
    id: 'pagina-uuid-1',
    titulo: 'Tema Festa',
  };

  const mockEvento: Partial<Evento> = {
    id: 'evento-uuid-1',
    titulo: 'Festa de Ano Novo',
    descricao: 'Celebração de ano novo',
    dataEvento: new Date('2025-12-31'),
    valor: 100,
    ativo: true,
    urlImagem: null,
    paginaEvento: mockPaginaEvento as PaginaEvento,
  };

  const mockEvento2: Partial<Evento> = {
    id: 'evento-uuid-2',
    titulo: 'Carnaval',
    descricao: 'Festa de carnaval',
    dataEvento: new Date('2025-02-28'),
    ativo: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventoService,
        {
          provide: EventoRepository,
          useValue: mockEventoRepository,
        },
        {
          provide: PaginaEventoRepository,
          useValue: mockPaginaEventoRepository,
        },
        {
          provide: GcsStorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    service = await module.resolve<EventoService>(EventoService);
    eventoRepository = module.get(EventoRepository);
    paginaEventoRepository = module.get(PaginaEventoRepository);
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
      titulo: 'Novo Evento',
      descricao: 'Descrição do evento',
      dataEvento: new Date('2025-06-15'),
      valor: 50,
    };

    it('deve criar evento sem paginaEvento', async () => {
      mockEventoRepository.create.mockReturnValue(createDto);
      mockEventoRepository.save.mockResolvedValue({
        id: 'new-evento-uuid',
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.titulo).toBe(createDto.titulo);
    });

    it('deve criar evento com paginaEvento', async () => {
      const dtoComPagina = { ...createDto, paginaEventoId: mockPaginaEvento.id };
      mockPaginaEventoRepository.findOne.mockResolvedValue(mockPaginaEvento);
      mockEventoRepository.create.mockReturnValue({
        ...createDto,
        paginaEvento: mockPaginaEvento,
      });
      mockEventoRepository.save.mockResolvedValue({
        id: 'new-evento-uuid',
        ...createDto,
        paginaEvento: mockPaginaEvento,
      });

      const result = await service.create(dtoComPagina);

      expect(result.paginaEvento).toBeDefined();
    });

    it('deve lançar NotFoundException se paginaEvento não existir', async () => {
      const dtoComPagina = { ...createDto, paginaEventoId: 'pagina-invalida' };
      mockPaginaEventoRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dtoComPagina)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // TESTES: findAll()
  // ============================================
  describe('findAll', () => {
    it('deve retornar lista de eventos', async () => {
      mockEventoRepository.find.mockResolvedValue([mockEvento, mockEvento2]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockEventoRepository.find).toHaveBeenCalledWith({
        relations: ['paginaEvento'],
        order: { dataEvento: 'DESC' },
      });
    });

    it('deve retornar lista vazia', async () => {
      mockEventoRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toHaveLength(0);
    });
  });

  // ============================================
  // TESTES: findAllPublic()
  // ============================================
  describe('findAllPublic', () => {
    it('deve retornar apenas eventos ativos', async () => {
      mockEventoRepository.find.mockResolvedValue([mockEvento]);

      const result = await service.findAllPublic();

      expect(result).toHaveLength(1);
      expect(mockEventoRepository.find).toHaveBeenCalledWith({
        where: { ativo: true },
        relations: ['paginaEvento'],
        order: { dataEvento: 'ASC' },
      });
    });
  });

  // ============================================
  // TESTES: findOne()
  // ============================================
  describe('findOne', () => {
    it('deve retornar evento por ID', async () => {
      mockEventoRepository.findOne.mockResolvedValue(mockEvento);

      const result = await service.findOne(mockEvento.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockEvento.id);
    });

    it('deve lançar NotFoundException se evento não existir', async () => {
      mockEventoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================
  // TESTES: update()
  // ============================================
  describe('update', () => {
    const updateDto = { titulo: 'Evento Atualizado' };

    it('deve atualizar evento', async () => {
      mockEventoRepository.preload.mockResolvedValue({
        ...mockEvento,
        ...updateDto,
      });
      mockEventoRepository.save.mockResolvedValue({
        ...mockEvento,
        ...updateDto,
      });

      const result = await service.update(mockEvento.id, updateDto);

      expect(result.titulo).toBe(updateDto.titulo);
    });

    it('deve atualizar paginaEvento', async () => {
      const updateDtoComPagina = { paginaEventoId: 'nova-pagina-uuid' };
      const novaPagina = { id: 'nova-pagina-uuid', titulo: 'Nova Página' };
      mockEventoRepository.preload.mockResolvedValue(mockEvento);
      mockPaginaEventoRepository.findOne.mockResolvedValue(novaPagina);
      mockEventoRepository.save.mockResolvedValue({
        ...mockEvento,
        paginaEvento: novaPagina,
      });

      const result = await service.update(mockEvento.id, updateDtoComPagina);

      expect(result.paginaEvento).toBe(novaPagina);
    });

    it('deve desassociar paginaEvento quando null', async () => {
      const updateDtoSemPagina = { paginaEventoId: null };
      mockEventoRepository.preload.mockResolvedValue({
        ...mockEvento,
        paginaEvento: mockPaginaEvento,
      });
      mockEventoRepository.save.mockResolvedValue({
        ...mockEvento,
        paginaEvento: null,
      });

      const result = await service.update(mockEvento.id, updateDtoSemPagina);

      expect(result.paginaEvento).toBeNull();
    });

    it('deve lançar NotFoundException se evento não existir', async () => {
      mockEventoRepository.preload.mockResolvedValue(null);

      await expect(service.update('id-invalido', { titulo: 'Teste' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar NotFoundException se nova paginaEvento não existir', async () => {
      mockEventoRepository.preload.mockResolvedValue(mockEvento);
      mockPaginaEventoRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockEvento.id, { paginaEventoId: 'pagina-invalida' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // TESTES: uploadImagem()
  // ============================================
  describe('uploadImagem', () => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'imagem.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake-image'),
      size: 1024,
      path: '/tmp/imagem.jpg',
      filename: 'imagem.jpg',
      destination: '/tmp',
      stream: null as any,
    } as Express.Multer.File;

    it('deve fazer upload de imagem', async () => {
      mockEventoRepository.findOne.mockResolvedValue({ ...mockEvento, urlImagem: null });
      mockStorageService.uploadFile.mockResolvedValue('https://storage.com/eventos/nova-imagem.jpg');
      mockEventoRepository.save.mockResolvedValue({
        ...mockEvento,
        urlImagem: 'https://storage.com/eventos/nova-imagem.jpg',
      });

      const result = await service.uploadImagem(mockEvento.id, mockFile);

      expect(result.urlImagem).toBe('https://storage.com/eventos/nova-imagem.jpg');
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(mockFile, 'eventos');
    });

    it('deve apagar imagem antiga antes de fazer upload', async () => {
      const eventoComImagem = {
        ...mockEvento,
        urlImagem: 'https://storage.com/eventos/imagem-antiga.jpg',
      };
      mockEventoRepository.findOne.mockResolvedValue(eventoComImagem);
      mockStorageService.deleteFile.mockResolvedValue(undefined);
      mockStorageService.uploadFile.mockResolvedValue('https://storage.com/eventos/nova-imagem.jpg');
      mockEventoRepository.save.mockResolvedValue({
        ...mockEvento,
        urlImagem: 'https://storage.com/eventos/nova-imagem.jpg',
      });

      await service.uploadImagem(mockEvento.id, mockFile);

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(
        'https://storage.com/eventos/imagem-antiga.jpg',
      );
    });

    it('deve continuar mesmo se falhar ao apagar imagem antiga', async () => {
      const eventoComImagem = {
        ...mockEvento,
        urlImagem: 'https://storage.com/eventos/imagem-antiga.jpg',
      };
      mockEventoRepository.findOne.mockResolvedValue(eventoComImagem);
      mockStorageService.deleteFile.mockRejectedValue(new Error('Falha ao apagar'));
      mockStorageService.uploadFile.mockResolvedValue('https://storage.com/eventos/nova-imagem.jpg');
      mockEventoRepository.save.mockResolvedValue({
        ...mockEvento,
        urlImagem: 'https://storage.com/eventos/nova-imagem.jpg',
      });

      const result = await service.uploadImagem(mockEvento.id, mockFile);

      expect(result.urlImagem).toBe('https://storage.com/eventos/nova-imagem.jpg');
    });
  });

  // ============================================
  // TESTES: remove()
  // ============================================
  describe('remove', () => {
    it('deve remover evento', async () => {
      mockEventoRepository.findOne.mockResolvedValue(mockEvento);
      mockEventoRepository.remove.mockResolvedValue(mockEvento);

      await service.remove(mockEvento.id);

      expect(mockEventoRepository.remove).toHaveBeenCalledWith(mockEvento);
    });

    it('deve lançar NotFoundException se evento não existir', async () => {
      mockEventoRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('id-invalido')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
