import { Test, TestingModule } from '@nestjs/testing';
import { ComandaController } from './comanda.controller';
import { ComandaService } from './comanda.service';

describe('ComandaController', () => {
  let controller: ComandaController;

  const mockComandaService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByMesa: jest.fn(),
    fecharComanda: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComandaController],
      providers: [{ provide: ComandaService, useValue: mockComandaService }],
    }).compile();

    controller = module.get<ComandaController>(ComandaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
