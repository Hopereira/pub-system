import { login } from '../authService';

// Mock fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'jwt-token-mock' }),
      });

      const result = await login('admin@admin.com', 'admin123');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'admin@admin.com', senha: 'admin123' }),
        }),
      );
      expect(result).toEqual({ access_token: 'jwt-token-mock' });
    });

    it('deve lançar erro com mensagem do servidor', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Credenciais inválidas' }),
      });

      await expect(login('admin@admin.com', 'senhaerrada')).rejects.toThrow(
        'Credenciais inválidas'
      );
    });

    it('deve lançar erro com array de mensagens', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: ['Email inválido', 'Senha muito curta'] }),
      });

      await expect(login('email', 'a')).rejects.toThrow(
        'Email inválido, Senha muito curta'
      );
    });

    it('deve lançar erro de conexão quando servidor não responde', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(login('admin@admin.com', 'admin123')).rejects.toThrow();
    });
  });
});
