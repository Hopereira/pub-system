import { Test, TestingModule } from '@nestjs/testing';
import { ClienteController } from './cliente.controller';
import { ClienteService } from './cliente.service';
import { Reflector } from '@nestjs/core';

describe('ClienteController', () => {
  let controller: ClienteController;

  const mockClienteService = {
    create: jest.fn(),
    createRapido: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByCpf: jest.fn(),
    buscar: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClienteController],
      providers: [
        { provide: ClienteService, useValue: mockClienteService },
        Reflector,
      ],
    })
      .overrideGuard('JwtAuthGuard').useValue({ canActivate: () => true })
      .overrideGuard('RolesGuard').useValue({ canActivate: () => true })
      .overrideGuard('TenantGuard').useValue({ canActivate: () => true })
      .overrideGuard('FeatureGuard').useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ClienteController>(ClienteController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });
});
