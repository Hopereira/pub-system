import {
  createCliente,
  getClienteByCpf,
  findOrCreateClient,
  getAllClientes,
  buscarClientes,
  criarClienteRapido,
} from '../clienteService';
import api, { publicApi } from '../api';

jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
  publicApi: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('clienteService', () => {
  const mockCliente = {
    id: 'cliente-uuid-1',
    nome: 'João Silva',
    cpf: '12345678901',
    email: 'joao@email.com',
    celular: '11999999999',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCliente', () => {
    it('deve criar cliente com sucesso', async () => {
      (publicApi.post as jest.Mock).mockResolvedValue({ data: mockCliente });

      const result = await createCliente({
        nome: 'João Silva',
        cpf: '12345678901',
        email: 'joao@email.com',
      });

      expect(publicApi.post).toHaveBeenCalledWith('/clientes', {
        nome: 'João Silva',
        cpf: '12345678901',
        email: 'joao@email.com',
      });
      expect(result).toEqual(mockCliente);
    });

    it('deve lançar erro ao falhar', async () => {
      (publicApi.post as jest.Mock).mockRejectedValue(new Error('Erro'));

      await expect(
        createCliente({ nome: 'João', cpf: '123' })
      ).rejects.toThrow();
    });
  });

  describe('getClienteByCpf', () => {
    it('deve buscar cliente por CPF', async () => {
      (publicApi.get as jest.Mock).mockResolvedValue({ data: mockCliente });

      const result = await getClienteByCpf('12345678901');

      expect(publicApi.get).toHaveBeenCalledWith('/clientes/by-cpf', {
        params: { cpf: '12345678901' },
      });
      expect(result).toEqual(mockCliente);
    });
  });

  describe('findOrCreateClient', () => {
    it('deve retornar cliente existente', async () => {
      (publicApi.get as jest.Mock).mockResolvedValue({ data: mockCliente });

      const result = await findOrCreateClient({
        cpf: '12345678901',
        nome: 'João Silva',
      });

      expect(result).toEqual(mockCliente);
      expect(publicApi.post).not.toHaveBeenCalled();
    });

    it('deve criar cliente se não existir (404)', async () => {
      const error404 = { response: { status: 404 } };
      (publicApi.get as jest.Mock).mockRejectedValue(error404);
      (publicApi.post as jest.Mock).mockResolvedValue({ data: mockCliente });

      const result = await findOrCreateClient({
        cpf: '12345678901',
        nome: 'João Silva',
      });

      expect(publicApi.post).toHaveBeenCalledWith('/clientes', {
        nome: 'João Silva',
        cpf: '12345678901',
        email: undefined,
        celular: undefined,
      });
      expect(result).toEqual(mockCliente);
    });

    it('deve lançar erro para outros erros', async () => {
      const error500 = { response: { status: 500 } };
      (publicApi.get as jest.Mock).mockRejectedValue(error500);

      await expect(
        findOrCreateClient({ cpf: '123', nome: 'João' })
      ).rejects.toEqual(error500);
    });
  });

  describe('getAllClientes', () => {
    it('deve listar todos os clientes', async () => {
      const clientes = [mockCliente, { ...mockCliente, id: 'cliente-2' }];
      (api.get as jest.Mock).mockResolvedValue({ data: clientes });

      const result = await getAllClientes();

      expect(api.get).toHaveBeenCalledWith('/clientes');
      expect(result).toHaveLength(2);
    });
  });

  describe('buscarClientes', () => {
    it('deve buscar clientes por termo', async () => {
      (publicApi.get as jest.Mock).mockResolvedValue({ data: [mockCliente] });

      const result = await buscarClientes('João');

      expect(publicApi.get).toHaveBeenCalledWith('/clientes/buscar', {
        params: { q: 'João' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('criarClienteRapido', () => {
    it('deve criar cliente rápido', async () => {
      (publicApi.post as jest.Mock).mockResolvedValue({ data: mockCliente });

      const result = await criarClienteRapido({ nome: 'João Silva' });

      expect(publicApi.post).toHaveBeenCalledWith('/clientes/rapido', {
        nome: 'João Silva',
      });
      expect(result).toEqual(mockCliente);
    });
  });
});
