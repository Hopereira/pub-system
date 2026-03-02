import { Test, TestingModule } from '@nestjs/testing';
import { MesaController } from './mesa.controller';
import { MesaService } from './mesa.service';

describe('MesaController', () => {
  let controller: MesaController;

  const mockMesaService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MesaController],
      providers: [{ provide: MesaService, useValue: mockMesaService }],
    }).compile();

    controller = module.get<MesaController>(MesaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
