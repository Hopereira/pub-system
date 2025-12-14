import {
  getAmbientes,
  getAmbienteById,
  createAmbiente,
  updateAmbiente,
  deleteAmbiente,
} from '../ambienteService';
import api from '../api';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('ambienteService', () => {
  const mockAmbiente = {
    id: 'ambiente-uuid-1',
    nome: 'Cozinha',
    tipo: 'PREPARO',
    ativo: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAmbientes', () => {
    it('deve buscar todos os ambientes', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [mockAmbiente] });

      const result = await getAmbientes();

      expect(api.get).toHaveBeenCalledWith('/ambientes');
      expect(result).toHaveLength(1);
    });
  });

  describe('getAmbienteById', () => {
    it('deve buscar ambiente por ID', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockAmbiente });

      const result = await getAmbienteById('ambiente-uuid-1');

      expect(api.get).toHaveBeenCalledWith('/ambientes/ambiente-uuid-1', {});
      expect(result).toEqual(mockAmbiente);
    });

    it('deve retornar null em caso de erro', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await getAmbienteById('invalid-id');

      expect(result).toBeNull();
    });

    it('deve usar token quando fornecido', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockAmbiente });

      await getAmbienteById('ambiente-uuid-1', 'jwt-token');

      expect(api.get).toHaveBeenCalledWith('/ambientes/ambiente-uuid-1', {
        headers: { Authorization: 'Bearer jwt-token' },
      });
    });
  });

  describe('createAmbiente', () => {
    it('deve criar ambiente', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: mockAmbiente });

      const result = await createAmbiente({
        nome: 'Cozinha',
        tipo: 'PREPARO' as any,
      });

      expect(api.post).toHaveBeenCalledWith('/ambientes', {
        nome: 'Cozinha',
        tipo: 'PREPARO',
      });
      expect(result).toEqual(mockAmbiente);
    });
  });

  describe('updateAmbiente', () => {
    it('deve atualizar ambiente', async () => {
      const ambienteAtualizado = { ...mockAmbiente, nome: 'Cozinha Principal' };
      (api.put as jest.Mock).mockResolvedValue({ data: ambienteAtualizado });

      const result = await updateAmbiente('ambiente-uuid-1', { nome: 'Cozinha Principal' });

      expect(api.put).toHaveBeenCalledWith('/ambientes/ambiente-uuid-1', {
        nome: 'Cozinha Principal',
      });
      expect(result.nome).toBe('Cozinha Principal');
    });
  });

  describe('deleteAmbiente', () => {
    it('deve deletar ambiente', async () => {
      (api.delete as jest.Mock).mockResolvedValue({});

      await deleteAmbiente('ambiente-uuid-1');

      expect(api.delete).toHaveBeenCalledWith('/ambientes/ambiente-uuid-1');
    });
  });
});
