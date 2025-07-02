import { Test, TestingModule } from '@nestjs/testing';
import { AmbienteService } from './ambiente.service';

describe('AmbienteService', () => {
  let service: AmbienteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AmbienteService],
    }).compile();

    service = module.get<AmbienteService>(AmbienteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
