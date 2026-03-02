import { Test, TestingModule } from '@nestjs/testing';
import { FuncionarioController } from './funcionario.controller';
import { FuncionarioService } from './funcionario.service';

describe('FuncionarioController', () => {
  let controller: FuncionarioController;

  const mockFuncionarioService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByEmailAndTenant: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FuncionarioController],
      providers: [{ provide: FuncionarioService, useValue: mockFuncionarioService }],
    }).compile();

    controller = module.get<FuncionarioController>(FuncionarioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
