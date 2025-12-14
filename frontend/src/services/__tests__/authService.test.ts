import { login } from '../authService';
import { publicApi } from '../api';

jest.mock('../api', () => ({
  publicApi: {
    post: jest.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const mockResponse = {
        data: {
          access_token: 'jwt-token-mock',
        },
      };
      (publicApi.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await login('admin@admin.com', 'admin123');

      expect(publicApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'admin@admin.com',
        senha: 'admin123',
      });
      expect(result).toEqual({ access_token: 'jwt-token-mock' });
    });

    it('deve lançar erro com mensagem do servidor', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Credenciais inválidas',
          },
        },
      };
      (publicApi.post as jest.Mock).mockRejectedValue(mockError);

      await expect(login('admin@admin.com', 'senhaerrada')).rejects.toThrow(
        'Credenciais inválidas'
      );
    });

    it('deve lançar erro com array de mensagens', async () => {
      const mockError = {
        response: {
          data: {
            message: ['Email inválido', 'Senha muito curta'],
          },
        },
      };
      (publicApi.post as jest.Mock).mockRejectedValue(mockError);

      await expect(login('email', 'a')).rejects.toThrow(
        'Email inválido, Senha muito curta'
      );
    });

    it('deve lançar erro de conexão quando servidor não responde', async () => {
      const mockError = {
        message: 'Network Error',
      };
      (publicApi.post as jest.Mock).mockRejectedValue(mockError);

      await expect(login('admin@admin.com', 'admin123')).rejects.toThrow(
        'Não foi possível conectar ao servidor.'
      );
    });
  });
});
