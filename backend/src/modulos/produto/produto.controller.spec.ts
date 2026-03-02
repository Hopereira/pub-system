import { Test, TestingModule } from '@nestjs/testing';
import { ProdutoController } from './produto.controller';
import { ProdutoService } from './produto.service';

describe('ProdutoController', () => {
  let controller: ProdutoController;

  const mockProdutoService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllNoPagination: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    uploadImagem: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProdutoController],
      providers: [{ provide: ProdutoService, useValue: mockProdutoService }],
    }).compile();

    controller = module.get<ProdutoController>(ProdutoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
