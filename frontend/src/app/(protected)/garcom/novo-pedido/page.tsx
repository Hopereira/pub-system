'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Minus, ShoppingCart, User, X, Check } from 'lucide-react';
import { buscarClientes, criarClienteRapido } from '@/services/clienteService';
import { criarPedidoGarcom } from '@/services/pedidoService';
import { getProdutos } from '@/services/produtoService';
import { getMesas } from '@/services/mesaService';
import { getAmbientes } from '@/services/ambienteService';
import { getPontosEntregaAtivos } from '@/services/pontoEntregaService';
import { Cliente } from '@/types/cliente';
import { Produto } from '@/types/produto';
import { Mesa } from '@/types/mesa';
import { Ambiente } from '@/types/ambiente';
import { PontoEntrega } from '@/types/ponto-entrega';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
  observacao?: string;
}

export default function NovoPedidoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Estados de busca de cliente
  const [termoBusca, setTermoBusca] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [buscando, setBuscando] = useState(false);

  // Estados de cliente rápido
  const [mostrarFormRapido, setMostrarFormRapido] = useState(false);
  const [nomeRapido, setNomeRapido] = useState('');
  const [cpfRapido, setCpfRapido] = useState('');
  const [telefoneRapido, setTelefoneRapido] = useState('');
  const [ambienteRapido, setAmbienteRapido] = useState('');
  const [pontoEntregaRapido, setPontoEntregaRapido] = useState('');

  // Estados de produtos e carrinho
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');

  // Estados de mesa
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesaSelecionada, setMesaSelecionada] = useState<string>('');

  // Estados de ambientes e pontos de entrega
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [pontosEntrega, setPontosEntrega] = useState<PontoEntrega[]>([]);

  // Estados de envio
  const [enviando, setEnviando] = useState(false);
  const [observacaoPedido, setObservacaoPedido] = useState('');

  // Carrega produtos e mesas
  useEffect(() => {
    carregarDados();
  }, []);

  // Seleciona mesa automaticamente se vier da URL
  useEffect(() => {
    const mesaId = searchParams.get('mesaId');
    if (mesaId && mesas.length > 0) {
      const mesa = mesas.find(m => m.id === mesaId);
      if (mesa) {
        setMesaSelecionada(mesaId);
        toast.success(`Mesa ${mesa.numero} selecionada automaticamente!`);
        
        // Se a mesa estiver ocupada e tiver cliente, seleciona o cliente também
        if (mesa.status === 'OCUPADA' && mesa.comanda?.cliente) {
          setClienteSelecionado({
            id: mesa.comanda.cliente.id,
            nome: mesa.comanda.cliente.nome,
            cpf: '',
            telefone: '',
            email: '',
            criadoEm: '',
            atualizadoEm: '',
          });
          toast.success(`Cliente ${mesa.comanda.cliente.nome} selecionado!`);
        }
      }
    }
  }, [searchParams, mesas]);

  const carregarDados = async () => {
    try {
      const [produtosData, mesasData, ambientesData, pontosEntregaData] = await Promise.all([
        getProdutos(),
        getMesas(),
        getAmbientes(),
        getPontosEntregaAtivos(),
      ]);
      setProdutos(produtosData);
      setMesas(mesasData.filter(m => m.status === 'LIVRE' || m.status === 'OCUPADA'));
      setAmbientes(ambientesData);
      setPontosEntrega(pontosEntregaData);
    } catch (error) {
      logger.error('Erro ao carregar dados', { module: 'NovoPedido', error: error as Error });
      toast.error('Erro ao carregar dados');
    }
  };

  // Busca clientes com debounce
  useEffect(() => {
    if (termoBusca.length < 3) {
      setClientesEncontrados([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const clientes = await buscarClientes(termoBusca);
        setClientesEncontrados(clientes);
      } catch (error) {
        logger.error('Erro ao buscar clientes', { module: 'NovoPedido', error: error as Error });
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [termoBusca]);

  const selecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setClientesEncontrados([]);
    setTermoBusca('');
    setMostrarFormRapido(false);
  };

  const formatarCPF = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '').slice(0, 11);
    return apenasNumeros
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const criarClienteRapidoHandler = async () => {
    if (!nomeRapido.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    const cpfLimpo = cpfRapido.replace(/\D/g, '');
    if (!cpfLimpo || cpfLimpo.length !== 11) {
      toast.error('CPF é obrigatório (11 dígitos)');
      return;
    }

    try {
      const novoCliente = await criarClienteRapido({
        nome: nomeRapido,
        cpf: cpfLimpo,
        telefone: telefoneRapido || undefined,
        ambienteId: ambienteRapido || undefined,
        pontoEntregaId: pontoEntregaRapido || undefined,
      });
      toast.success('Cliente criado!');
      selecionarCliente(novoCliente);
      setNomeRapido('');
      setCpfRapido('');
      setTelefoneRapido('');
      setAmbienteRapido('');
      setPontoEntregaRapido('');
    } catch (error) {
      logger.error('Erro ao criar cliente rápido', { module: 'NovoPedido', error: error as Error });
      toast.error('Erro ao criar cliente');
    }
  };

  const adicionarAoCarrinho = (produto: Produto) => {
    const itemExistente = carrinho.find(item => item.produto.id === produto.id);
    
    if (itemExistente) {
      setCarrinho(carrinho.map(item =>
        item.produto.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      setCarrinho([...carrinho, { produto, quantidade: 1 }]);
    }
    toast.success(`${produto.nome} adicionado`);
  };

  const removerDoCarrinho = (produtoId: string) => {
    const item = carrinho.find(i => i.produto.id === produtoId);
    if (item && item.quantidade > 1) {
      setCarrinho(carrinho.map(i =>
        i.produto.id === produtoId
          ? { ...i, quantidade: i.quantidade - 1 }
          : i
      ));
    } else {
      setCarrinho(carrinho.filter(i => i.produto.id !== produtoId));
    }
  };

  const calcularTotal = () => {
    return carrinho.reduce((total, item) => 
      total + (Number(item.produto.preco) * item.quantidade), 0
    );
  };

  const enviarPedido = async () => {
    if (!clienteSelecionado) {
      toast.error('Selecione um cliente');
      return;
    }

    if (carrinho.length === 0) {
      toast.error('Adicione itens ao pedido');
      return;
    }

    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setEnviando(true);
    try {
      await criarPedidoGarcom({
        clienteId: clienteSelecionado.id,
        garcomId: user.id,
        mesaId: mesaSelecionada || undefined,
        observacao: observacaoPedido || undefined,
        itens: carrinho.map(item => ({
          produtoId: item.produto.id,
          quantidade: item.quantidade,
          observacao: item.observacao,
        })),
      });

      toast.success('Pedido enviado para a cozinha!');
      router.push('/garcom');
    } catch (error) {
      logger.error('Erro ao enviar pedido', { module: 'NovoPedido', error: error as Error });
      toast.error('Erro ao enviar pedido');
    } finally {
      setEnviando(false);
    }
  };

  const categorias = Array.from(new Set(produtos.map(p => p.categoria))).filter(Boolean);

  const produtosFiltrados = categoriaFiltro
    ? produtos.filter(p => p.categoria === categoriaFiltro)
    : produtos;

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Novo Pedido</h1>
        <p className="text-muted-foreground">Faça um pedido para o cliente</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Cliente e Mesa */}
        <div className="space-y-4">
          {/* Busca de Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!clienteSelecionado ? (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou CPF..."
                      value={termoBusca}
                      onChange={(e) => setTermoBusca(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {buscando && (
                    <p className="text-sm text-muted-foreground">Buscando...</p>
                  )}

                  {clientesEncontrados.length > 0 && (
                    <div className="space-y-2">
                      {clientesEncontrados.map((cliente) => (
                        <div
                          key={cliente.id}
                          onClick={() => selecionarCliente(cliente)}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                        >
                          <p className="font-medium">{cliente.nome}</p>
                          <p className="text-sm text-muted-foreground">{cliente.cpf}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {!mostrarFormRapido ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setMostrarFormRapido(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Cliente Rápido
                    </Button>
                  ) : (
                    <div className="space-y-3 p-4 border rounded-lg">
                      <Input
                        placeholder="Nome do cliente *"
                        value={nomeRapido}
                        onChange={(e) => setNomeRapido(e.target.value)}
                      />
                      <Input
                        placeholder="CPF *"
                        value={cpfRapido}
                        onChange={(e) => setCpfRapido(formatarCPF(e.target.value))}
                        maxLength={14}
                      />
                      <Input
                        placeholder="Telefone (opcional)"
                        value={telefoneRapido}
                        onChange={(e) => setTelefoneRapido(e.target.value)}
                      />
                      <select
                        value={ambienteRapido}
                        onChange={(e) => setAmbienteRapido(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="">Ambiente (opcional)</option>
                        {ambientes.map((ambiente) => (
                          <option key={ambiente.id} value={ambiente.id}>
                            {ambiente.nome}
                          </option>
                        ))}
                      </select>
                      <select
                        value={pontoEntregaRapido}
                        onChange={(e) => setPontoEntregaRapido(e.target.value)}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="">Ponto de Entrega (opcional)</option>
                        {pontosEntrega.map((ponto) => (
                          <option key={ponto.id} value={ponto.id}>
                            {ponto.nome}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <Button onClick={criarClienteRapidoHandler} className="flex-1">
                          <Check className="h-4 w-4 mr-2" />
                          Criar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setMostrarFormRapido(false);
                            setNomeRapido('');
                            setCpfRapido('');
                            setTelefoneRapido('');
                            setAmbienteRapido('');
                            setPontoEntregaRapido('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="font-medium">{clienteSelecionado.nome}</p>
                    <p className="text-sm text-muted-foreground">{clienteSelecionado.cpf}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setClienteSelecionado(null)}
                    className="w-full"
                  >
                    Trocar Cliente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seleção de Mesa */}
          <Card>
            <CardHeader>
              <CardTitle>Mesa (Opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={mesaSelecionada}
                onChange={(e) => setMesaSelecionada(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Sem mesa (Balcão)</option>
                {mesas.map((mesa) => (
                  <option key={mesa.id} value={mesa.id}>
                    Mesa {mesa.numero} - {mesa.ambiente?.nome}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Carrinho */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Carrinho
                </span>
                <Badge>{carrinho.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {carrinho.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Carrinho vazio
                </p>
              ) : (
                <div className="space-y-3">
                  {carrinho.map((item) => (
                    <div key={item.produto.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.produto.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {Number(item.produto.preco).toFixed(2)} x {item.quantidade}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removerDoCarrinho(item.produto.id)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantidade}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => adicionarAoCarrinho(item.produto)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold">Total:</span>
                      <span className="text-xl font-bold text-primary">
                        R$ {calcularTotal().toFixed(2)}
                      </span>
                    </div>

                    <Input
                      placeholder="Observação do pedido (opcional)"
                      value={observacaoPedido}
                      onChange={(e) => setObservacaoPedido(e.target.value)}
                      className="mb-3"
                    />

                    {/* Mensagens de validação */}
                    {!clienteSelecionado && (
                      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 font-medium">
                          ⚠️ Selecione um cliente para continuar
                        </p>
                      </div>
                    )}
                    {clienteSelecionado && carrinho.length === 0 && (
                      <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800 font-medium">
                          ⚠️ Adicione pelo menos um produto ao carrinho
                        </p>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={enviarPedido}
                      disabled={enviando || !clienteSelecionado || carrinho.length === 0}
                    >
                      {enviando ? 'Enviando...' : 'Enviar para Preparo'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna 2 e 3: Produtos */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
              <div className="flex gap-2 flex-wrap mt-4">
                <Button
                  size="sm"
                  variant={categoriaFiltro === '' ? 'default' : 'outline'}
                  onClick={() => setCategoriaFiltro('')}
                >
                  Todos
                </Button>
                {categorias.map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={categoriaFiltro === cat ? 'default' : 'outline'}
                    onClick={() => setCategoriaFiltro(cat!)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {produtosFiltrados.map((produto) => (
                  <div
                    key={produto.id}
                    onClick={() => adicionarAoCarrinho(produto)}
                    className="border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                  >
                    {produto.urlImagem && (
                      <img
                        src={produto.urlImagem}
                        alt={produto.nome}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    <h3 className="font-medium text-sm mb-1">{produto.nome}</h3>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {produto.descricao}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      R$ {Number(produto.preco).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
