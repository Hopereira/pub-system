import {
  getAllComandas,
  getComandasAbertas,
  abrirComanda,
  abrirComandaPublica,
  getComandaById,
  getComandaAbertaPorMesa,
  searchComandas,
  fecharComanda,
  getPublicComandaById,
  updateComanda,
  getComandasByPontoEntrega,
} from '../comandaService';
import api, { publicApi } from '../api';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
  publicApi: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('comandaService', () => {
  const mockComanda = {
    id: 'comanda-uuid-1',
    numero: 'CMD-001',
    status: 'ABERTA',
    cliente: { id: 'cliente-1', nome: 'João' },
    mesa: { id: 'mesa-1', numero: 1 },
    pontoEntrega: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllComandas', () => {
    it('deve buscar todas as comandas', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [mockComanda] });

      const result = await getAllComandas();

      expect(api.get).toHaveBeenCalledWith('/comandas');
      expect(result).toHaveLength(1);
    });
  });

  describe('getComandasAbertas', () => {
    it('deve buscar comandas abertas', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [mockComanda] });

      const result = await getComandasAbertas();

      expect(api.get).toHaveBeenCalledWith('/comandas/search');
      expect(result).toHaveLength(1);
    });
  });

  describe('abrirComanda', () => {
    it('deve abrir comanda autenticada', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: mockComanda });

      const result = await abrirComanda({ clienteId: 'cliente-1' });

      expect(api.post).toHaveBeenCalledWith('/comandas', { clienteId: 'cliente-1' });
      expect(result).toEqual(mockComanda);
    });
  });

  describe('abrirComandaPublica', () => {
    it('deve abrir comanda pública', async () => {
      (publicApi.post as jest.Mock).mockResolvedValue({ data: mockComanda });

      const result = await abrirComandaPublica({ clienteId: 'cliente-1' });

      expect(publicApi.post).toHaveBeenCalledWith('/comandas', { clienteId: 'cliente-1' });
      expect(result).toEqual(mockComanda);
    });
  });

  describe('getComandaById', () => {
    it('deve buscar comanda por ID', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockComanda });

      const result = await getComandaById('comanda-uuid-1');

      expect(api.get).toHaveBeenCalledWith('/comandas/comanda-uuid-1', expect.any(Object));
      expect(result).toEqual(mockComanda);
    });
  });

  describe('getComandaAbertaPorMesa', () => {
    it('deve buscar comanda aberta por mesa', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: mockComanda });

      const result = await getComandaAbertaPorMesa('mesa-1');

      expect(api.get).toHaveBeenCalledWith('/comandas/mesa/mesa-1/aberta');
      expect(result).toEqual(mockComanda);
    });
  });

  describe('searchComandas', () => {
    it('deve buscar comandas por termo', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [mockComanda] });

      const result = await searchComandas('João');

      expect(api.get).toHaveBeenCalledWith('/comandas/search', { params: { term: 'João' } });
      expect(result).toHaveLength(1);
    });

    it('deve retornar array vazio se termo vazio', async () => {
      const result = await searchComandas('');

      expect(api.get).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('fecharComanda', () => {
    it('deve fechar comanda', async () => {
      const comandaFechada = { ...mockComanda, status: 'FECHADA' };
      (api.patch as jest.Mock).mockResolvedValue({ data: comandaFechada });

      const result = await fecharComanda('comanda-uuid-1', {
        formaPagamento: 'PIX',
      });

      expect(api.patch).toHaveBeenCalledWith('/comandas/comanda-uuid-1/fechar', {
        formaPagamento: 'PIX',
      });
      expect(result.status).toBe('FECHADA');
    });
  });

  describe('getPublicComandaById', () => {
    it('deve buscar comanda pública', async () => {
      (publicApi.get as jest.Mock).mockResolvedValue({ data: mockComanda });

      const result = await getPublicComandaById('comanda-uuid-1');

      expect(publicApi.get).toHaveBeenCalledWith('/comandas/comanda-uuid-1/public');
      expect(result).toEqual(mockComanda);
    });

    it('deve retornar null em caso de erro', async () => {
      (publicApi.get as jest.Mock).mockRejectedValue(new Error('Not found'));

      const result = await getPublicComandaById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('updateComanda', () => {
    it('deve atualizar local da comanda', async () => {
      (publicApi.patch as jest.Mock).mockResolvedValue({ data: mockComanda });

      const result = await updateComanda('comanda-uuid-1', { mesaId: 'mesa-2' });

      expect(publicApi.patch).toHaveBeenCalledWith('/comandas/comanda-uuid-1/local', {
        mesaId: 'mesa-2',
      });
      expect(result).toEqual(mockComanda);
    });
  });

  describe('getComandasByPontoEntrega', () => {
    it('deve filtrar comandas por ponto de entrega', async () => {
      const comandaComPonto = {
        ...mockComanda,
        pontoEntrega: { id: 'ponto-1' },
      };
      (api.get as jest.Mock).mockResolvedValue({ data: [comandaComPonto, mockComanda] });

      const result = await getComandasByPontoEntrega('ponto-1');

      expect(result).toHaveLength(1);
      expect(result[0].pontoEntrega?.id).toBe('ponto-1');
    });
  });
});
