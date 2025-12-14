import { getMesas, getMesasByAmbiente, createMesa, updateMesa, deleteMesa } from '../mesaService';
import api from '../api';
import { AxiosError } from 'axios';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('mesaService', () => {
  const mockMesa = {
    id: 'mesa-uuid-1',
    numero: 1,
    capacidade: 4,
    status: 'LIVRE',
    ambienteId: 'ambiente-uuid-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMesas', () => {
    it('deve buscar todas as mesas', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [mockMesa] });

      const result = await getMesas();

      expect(api.get).toHaveBeenCalledWith('/mesas');
      expect(result).toHaveLength(1);
    });
  });

  describe('getMesasByAmbiente', () => {
    it('deve buscar mesas por ambiente', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [mockMesa] });

      const result = await getMesasByAmbiente('ambiente-uuid-1');

      expect(api.get).toHaveBeenCalledWith('/mesas/ambiente/ambiente-uuid-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('createMesa', () => {
    it('deve criar mesa', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: mockMesa });

      const result = await createMesa({
        numero: 1,
        capacidade: 4,
        ambienteId: 'ambiente-uuid-1',
      });

      expect(api.post).toHaveBeenCalledWith('/mesas', {
        numero: 1,
        capacidade: 4,
        ambienteId: 'ambiente-uuid-1',
      });
      expect(result).toEqual(mockMesa);
    });

    it('deve lançar erro com mensagem para conflito (409)', async () => {
      const axiosError = new AxiosError('Conflict');
      axiosError.response = {
        status: 409,
        data: { message: 'Mesa já existe neste ambiente' },
        statusText: 'Conflict',
        headers: {},
        config: {} as any,
      };
      (api.post as jest.Mock).mockRejectedValue(axiosError);

      await expect(
        createMesa({ numero: 1, capacidade: 4, ambienteId: 'ambiente-uuid-1' })
      ).rejects.toThrow('Mesa já existe neste ambiente');
    });
  });

  describe('updateMesa', () => {
    it('deve atualizar mesa', async () => {
      const mesaAtualizada = { ...mockMesa, capacidade: 6 };
      (api.patch as jest.Mock).mockResolvedValue({ data: mesaAtualizada });

      const result = await updateMesa('mesa-uuid-1', { capacidade: 6 });

      expect(api.patch).toHaveBeenCalledWith('/mesas/mesa-uuid-1', { capacidade: 6 });
      expect(result.capacidade).toBe(6);
    });
  });

  describe('deleteMesa', () => {
    it('deve deletar mesa', async () => {
      (api.delete as jest.Mock).mockResolvedValue({});

      await deleteMesa('mesa-uuid-1');

      expect(api.delete).toHaveBeenCalledWith('/mesas/mesa-uuid-1');
    });
  });
});
