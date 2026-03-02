import { Test, TestingModule } from '@nestjs/testing';
import { AmbienteController } from './ambiente.controller';
import { AmbienteService } from './ambiente.service';

describe('AmbienteController', () => {
  let controller: AmbienteController;

  const mockAmbienteService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AmbienteController],
      providers: [
        { provide: AmbienteService, useValue: mockAmbienteService },
      ],
    }).compile();

    controller = module.get<AmbienteController>(AmbienteController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });
});
