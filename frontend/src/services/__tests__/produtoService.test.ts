import { getProdutos, createProduto, updateProduto, deleteProduto } from '../produtoService';
import api from '../api';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('produtoService', () => {
  const mockProduto = {
    id: 'produto-uuid-1',
    nome: 'Cerveja',
    descricao: 'Cerveja gelada',
    preco: 10.0,
    categoria: 'BEBIDAS',
    ativo: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProdutos', () => {
    it('deve buscar todos os produtos', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: [mockProduto] });

      const result = await getProdutos();

      expect(api.get).toHaveBeenCalledWith('/produtos', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Cerveja');
    });

    it('deve lançar erro ao falhar', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Erro de rede'));

      await expect(getProdutos()).rejects.toThrow();
    });
  });

  describe('createProduto', () => {
    it('deve criar produto com FormData', async () => {
      (api.post as jest.Mock).mockResolvedValue({ data: mockProduto });
      const formData = new FormData();
      formData.append('nome', 'Cerveja');

      const result = await createProduto(formData);

      expect(api.post).toHaveBeenCalledWith('/produtos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result).toEqual(mockProduto);
    });
  });

  describe('updateProduto', () => {
    it('deve atualizar produto', async () => {
      const produtoAtualizado = { ...mockProduto, nome: 'Cerveja Premium' };
      (api.patch as jest.Mock).mockResolvedValue({ data: produtoAtualizado });
      const formData = new FormData();
      formData.append('nome', 'Cerveja Premium');

      const result = await updateProduto('produto-uuid-1', formData);

      expect(api.patch).toHaveBeenCalledWith('/produtos/produto-uuid-1', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result.nome).toBe('Cerveja Premium');
    });
  });

  describe('deleteProduto', () => {
    it('deve deletar produto', async () => {
      (api.delete as jest.Mock).mockResolvedValue({ data: mockProduto });

      const result = await deleteProduto('produto-uuid-1');

      expect(api.delete).toHaveBeenCalledWith('/produtos/produto-uuid-1');
      expect(result).toEqual(mockProduto);
    });
  });
});
