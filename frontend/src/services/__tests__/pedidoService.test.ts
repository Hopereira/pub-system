import {
  adicionarItensAoPedido,
  createPedidoFromCliente,
  getPedidos,
  getPedidosPorAmbiente,
  updateItemStatus,
  updatePedidoStatus,
  getPedidosProntos,
  deixarNoAmbiente,
  criarPedidoGarcom,
  retirarItem,
  marcarComoEntregue,
} from '../pedidoService';
import api from '../api';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
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

describe('pedidoService', () => {
  const mockPedido = {
    id: 'pedido-uuid-1',
    comandaId: 'comanda-uuid-1',
    status: 'FEITO',
    itens: [
      { id: 'item-1', produtoId: 'prod-1', quantidade: 2, status: 'FEITO' },
    ],
  };

  const mockItem = {
    id: 'item-1',
    produtoId: 'prod-1',
    quantidade: 2,
    status: 'EM_PREPARO',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('adicionarItensAoPedido', () => {
    it('deve adicionar itens ao pedido', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: mockPedido });

      const result = await adicionarItensAoPedido({
        comandaId: 'comanda-uuid-1',
        itens: [{ produtoId: 'prod-1', quantidade: 2 }],
      });

      expect(api.post).toHaveBeenCalledWith('/pedidos', {
        comandaId: 'comanda-uuid-1',
        itens: [{ produtoId: 'prod-1', quantidade: 2 }],
      });
      expect(result).toEqual(mockPedido);
    });
  });

  describe('createPedidoFromCliente', () => {
    it('deve criar pedido do cliente', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: mockPedido });

      const result = await createPedidoFromCliente({
        comandaId: 'comanda-uuid-1',
        itens: [{ produtoId: 'prod-1', quantidade: 1 }],
      });

      expect(api.post).toHaveBeenCalledWith('/pedidos/cliente', expect.any(Object));
      expect(result).toEqual(mockPedido);
    });
  });

  describe('getPedidos', () => {
    it('deve buscar pedidos sem filtros', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [mockPedido] });

      const result = await getPedidos();

      expect(api.get).toHaveBeenCalledWith('/pedidos', { params: {} });
      expect(result).toHaveLength(1);
    });

    it('deve buscar pedidos com filtros', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [mockPedido] });

      const result = await getPedidos({ ambienteId: 'amb-1', status: 'FEITO' });

      expect(api.get).toHaveBeenCalledWith('/pedidos', {
        params: { ambienteId: 'amb-1', status: 'FEITO' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getPedidosPorAmbiente', () => {
    it('deve buscar pedidos por ambiente válido', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [mockPedido] });

      const result = await getPedidosPorAmbiente('a1b2c3d4-e5f6-7890-1234-567890abcdef');

      expect(api.get).toHaveBeenCalledWith('/pedidos', {
        params: { ambienteId: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' },
      });
      expect(result).toHaveLength(1);
    });

    it('deve lançar erro para UUID inválido', async () => {
      await expect(getPedidosPorAmbiente('invalid-uuid')).rejects.toThrow(
        'ID de ambiente inválido'
      );
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  describe('updateItemStatus', () => {
    it('deve atualizar status do item', async () => {
      const itemAtualizado = { ...mockItem, status: 'PRONTO' };
      (api.patch as jest.Mock).mockResolvedValue({ data: itemAtualizado });

      const result = await updateItemStatus('item-1', { status: 'PRONTO' });

      expect(api.patch).toHaveBeenCalledWith('/pedidos/item/item-1/status', {
        status: 'PRONTO',
      });
      expect(result).toEqual(itemAtualizado);
    });
  });

  describe('updatePedidoStatus', () => {
    it('deve lançar erro (função obsoleta)', async () => {
      await expect(updatePedidoStatus()).rejects.toThrow('Função obsoleta');
    });
  });

  describe('getPedidosProntos', () => {
    it('deve buscar pedidos prontos', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [mockPedido] });

      const result = await getPedidosProntos();

      expect(api.get).toHaveBeenCalledWith('/pedidos/prontos', { params: {} });
      expect(result).toHaveLength(1);
    });

    it('deve buscar pedidos prontos por ambiente', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [mockPedido] });

      const result = await getPedidosProntos('amb-1');

      expect(api.get).toHaveBeenCalledWith('/pedidos/prontos', {
        params: { ambienteId: 'amb-1' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('deixarNoAmbiente', () => {
    it('deve marcar item como deixado no ambiente', async () => {
      (api.patch as jest.Mock).mockResolvedValue({ data: mockItem });

      const result = await deixarNoAmbiente('item-1', { motivo: 'Cliente ausente' });

      expect(api.patch).toHaveBeenCalledWith('/pedidos/item/item-1/deixar-no-ambiente', {
        motivo: 'Cliente ausente',
      });
      expect(result).toEqual(mockItem);
    });
  });

  describe('criarPedidoGarcom', () => {
    it('deve criar pedido pelo garçom', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: mockPedido });

      const result = await criarPedidoGarcom({
        clienteId: 'cliente-1',
        garcomId: 'garcom-1',
        itens: [{ produtoId: 'prod-1', quantidade: 1 }],
      });

      expect(api.post).toHaveBeenCalledWith('/pedidos/garcom', expect.any(Object));
      expect(result).toEqual(mockPedido);
    });
  });

  describe('retirarItem', () => {
    it('deve marcar item como retirado', async () => {
      (api.patch as jest.Mock).mockResolvedValue({ data: mockItem });

      const result = await retirarItem('item-1', 'garcom-1');

      expect(api.patch).toHaveBeenCalledWith('/pedidos/item/item-1/retirar', {
        garcomId: 'garcom-1',
      });
      expect(result).toEqual(mockItem);
    });
  });

  describe('marcarComoEntregue', () => {
    it('deve marcar item como entregue', async () => {
      (api.patch as jest.Mock).mockResolvedValue({ data: mockItem });

      const result = await marcarComoEntregue('item-1', 'garcom-1');

      expect(api.patch).toHaveBeenCalledWith('/pedidos/item/item-1/marcar-entregue', {
        garcomId: 'garcom-1',
      });
      expect(result).toEqual(mockItem);
    });
  });
});
