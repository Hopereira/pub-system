import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { FuncionarioService } from '../modulos/funcionario/funcionario.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let funcionarioService: jest.Mocked<FuncionarioService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockFuncionarioService = {
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  // Mock data
  const mockFuncionario = {
    id: 'funcionario-uuid-1',
    nome: 'Admin User',
    email: 'admin@admin.com',
    senha: '$2b$10$hashedpassword',
    cargo: 'ADMIN',
    empresaId: 'empresa-uuid-1',
    ambienteId: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: FuncionarioService,
          useValue: mockFuncionarioService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    funcionarioService = module.get(FuncionarioService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // TESTES: validateUser()
  // ============================================
  describe('validateUser', () => {
    it('deve validar usuário com credenciais corretas', async () => {
      mockFuncionarioService.findByEmail.mockResolvedValue(mockFuncionario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('admin@admin.com', 'admin123');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockFuncionario.id);
      expect(result.email).toBe(mockFuncionario.email);
      expect(result.senha).toBeUndefined();
    });

    it('deve retornar null se usuário não existir', async () => {
      mockFuncionarioService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('inexistente@email.com', 'senha');

      expect(result).toBeNull();
    });

    it('deve retornar null se senha estiver incorreta', async () => {
      mockFuncionarioService.findByEmail.mockResolvedValue(mockFuncionario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('admin@admin.com', 'senhaerrada');

      expect(result).toBeNull();
    });

    it('deve chamar bcrypt.compare com senha correta', async () => {
      mockFuncionarioService.findByEmail.mockResolvedValue(mockFuncionario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.validateUser('admin@admin.com', 'admin123');

      expect(bcrypt.compare).toHaveBeenCalledWith('admin123', mockFuncionario.senha);
    });
  });

  // ============================================
  // TESTES: login()
  // ============================================
  describe('login', () => {
    const mockUser = {
      id: 'funcionario-uuid-1',
      email: 'admin@admin.com',
      nome: 'Admin User',
      cargo: 'ADMIN',
      empresaId: 'empresa-uuid-1',
      ambienteId: null,
    };

    it('deve gerar token JWT', async () => {
      mockJwtService.sign.mockReturnValue('jwt-token-mock');

      const result = await service.login(mockUser);

      expect(result).toBeDefined();
      expect(result.access_token).toBe('jwt-token-mock');
    });

    it('deve incluir dados corretos no payload do token', async () => {
      mockJwtService.sign.mockReturnValue('jwt-token-mock');

      await service.login(mockUser);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        id: mockUser.id,
        sub: mockUser.id,
        email: mockUser.email,
        nome: mockUser.nome,
        cargo: mockUser.cargo,
        role: mockUser.cargo,
        empresaId: mockUser.empresaId,
        ambienteId: mockUser.ambienteId,
      });
    });

    it('deve incluir ambienteId quando presente', async () => {
      const userComAmbiente = { ...mockUser, ambienteId: 'ambiente-uuid-1' };
      mockJwtService.sign.mockReturnValue('jwt-token-mock');

      await service.login(userComAmbiente);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          ambienteId: 'ambiente-uuid-1',
        }),
      );
    });
  });
});
