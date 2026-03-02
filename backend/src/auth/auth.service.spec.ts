import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { FuncionarioService } from '../modulos/funcionario/funcionario.service';
import { RefreshTokenService } from './refresh-token.service';
import { AuditService } from '../modulos/audit/audit.service';
import { TenantResolverService } from '../common/tenant/tenant-resolver.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let funcionarioService: jest.Mocked<FuncionarioService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockTenantId = 'tenant-uuid-1';

  const mockFuncionarioService = {
    findByEmail: jest.fn(),
    findByEmailAndTenant: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockRefreshTokenService = {
    generateRefreshToken: jest.fn().mockResolvedValue('refresh-token-mock'),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockTenantResolverService = {
    resolveById: jest.fn(),
    resolveBySlug: jest.fn(),
    extractSlugFromHostname: jest.fn(),
  };

  // Mock data
  const mockFuncionario = {
    id: 'funcionario-uuid-1',
    nome: 'Admin User',
    email: 'admin@admin.com',
    senha: '$2b$10$hashedpassword',
    cargo: 'ADMIN',
    tenantId: mockTenantId,
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
        {
          provide: RefreshTokenService,
          useValue: mockRefreshTokenService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
        {
          provide: TenantResolverService,
          useValue: mockTenantResolverService,
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
      mockFuncionarioService.findByEmailAndTenant.mockResolvedValue(mockFuncionario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('admin@admin.com', 'admin123', mockTenantId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockFuncionario.id);
      expect(result.email).toBe(mockFuncionario.email);
      expect(result.senha).toBeUndefined();
    });

    it('deve retornar null se usuário não existir', async () => {
      mockFuncionarioService.findByEmailAndTenant.mockResolvedValue(null);

      const result = await service.validateUser('inexistente@email.com', 'senha', mockTenantId);

      expect(result).toBeNull();
    });

    it('deve retornar null se senha estiver incorreta', async () => {
      mockFuncionarioService.findByEmailAndTenant.mockResolvedValue(mockFuncionario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('admin@admin.com', 'senhaerrada', mockTenantId);

      expect(result).toBeNull();
    });

    it('deve chamar bcrypt.compare com senha correta', async () => {
      mockFuncionarioService.findByEmailAndTenant.mockResolvedValue(mockFuncionario);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.validateUser('admin@admin.com', 'admin123', mockTenantId);

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
      tenantId: mockTenantId,
      ambienteId: null,
    };

    it('deve gerar token JWT', async () => {
      mockJwtService.sign.mockReturnValue('jwt-token-mock');

      const result = await service.login(mockUser, mockTenantId, '127.0.0.1');

      expect(result).toBeDefined();
      expect(result.access_token).toBe('jwt-token-mock');
    });

    it('deve incluir dados corretos no payload do token', async () => {
      mockJwtService.sign.mockReturnValue('jwt-token-mock');

      await service.login(mockUser, mockTenantId, '127.0.0.1');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        {
          id: mockUser.id,
          sub: mockUser.id,
          email: mockUser.email,
          nome: mockUser.nome,
          cargo: mockUser.cargo,
          role: mockUser.cargo,
          ambienteId: mockUser.ambienteId,
          tenantId: mockTenantId,
        },
        expect.objectContaining({ expiresIn: '1h' }),
      );
    });

    it('deve incluir ambienteId quando presente', async () => {
      const userComAmbiente = { ...mockUser, ambienteId: 'ambiente-uuid-1' };
      mockJwtService.sign.mockReturnValue('jwt-token-mock');

      await service.login(userComAmbiente, mockTenantId, '127.0.0.1');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          ambienteId: 'ambiente-uuid-1',
          tenantId: mockTenantId,
        }),
        expect.any(Object),
      );
    });
  });
});
