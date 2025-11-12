// Caminho: frontend/src/app/(protected)/caixa/terminal/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Comanda } from '@/types/comanda';
import { Mesa } from '@/types/mesa';
import { Cliente } from '@/types/cliente';
import { searchComandas, getComandasAbertas } from '@/services/comandaService';
import { getMesas } from '@/services/mesaService';
import { getAllClientes } from '@/services/clienteService';
import { useDebounce } from 'use-debounce';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Table2, X, ArrowLeft } from 'lucide-react';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

const TerminalCaixaPage = () => {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Comanda[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesComComanda, setClientesComComanda] = useState<Comanda[]>([]);
  const [activeTab, setActiveTab] = useState(tabParam || 'busca');

  // O "debounced" searchTerm espera 300ms antes de atualizar.
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  // Carrega mesas ao montar o componente
  useEffect(() => {
    const carregarMesas = async () => {
      try {
        const data = await getMesas();
        setMesas(data);
      } catch (error) {
        logger.error('Erro ao carregar mesas', { module: 'TerminalCaixaPage', error: error as Error });
        toast.error('Erro ao carregar mesas');
      }
    };
    carregarMesas();
  }, []);

  // Carrega clientes com comandas abertas ao montar o componente
  useEffect(() => {
    const carregarClientesComComanda = async () => {
      try {
        // Buscar todas as comandas abertas
        const comandasAbertas = await getComandasAbertas();
        // Filtrar apenas comandas com cliente
        const comandasComCliente = comandasAbertas.filter(c => c.cliente);
        setClientesComComanda(comandasComCliente);
      } catch (error) {
        logger.error('Erro ao carregar clientes', { module: 'TerminalCaixaPage', error: error as Error });
        toast.error('Erro ao carregar clientes');
      }
    };
    carregarClientesComComanda();
  }, []);

  // Busca comandas quando o termo de busca muda
  useEffect(() => {
    const buscar = async () => {
      if (debouncedSearchTerm.trim()) {
        setIsLoading(true);
        try {
          const data = await searchComandas(debouncedSearchTerm);
          setResults(data);
        } catch (error) {
          logger.error('Erro na busca de comandas', { module: 'TerminalCaixaPage', error: error as Error });
          toast.error('Erro ao buscar comandas');
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    };
    buscar();
  }, [debouncedSearchTerm]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Cabeçalho com botão voltar */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/caixa">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Terminal de Caixa</h1>
            <p className="text-muted-foreground mt-1">
              Busque comandas abertas, visualize mesas e clientes cadastrados.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="busca" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar Comanda
          </TabsTrigger>
          <TabsTrigger value="mesas" className="flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Mesas ({mesas.length})
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes ({clientesComComanda.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB: BUSCA DE COMANDAS */}
        <TabsContent value="busca" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Digite número da mesa, nome do cliente ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-lg pl-10 pr-10 py-6"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="mt-6">
            {isLoading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Buscando...</p>
              </div>
            )}
            
            {!isLoading && results.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((comanda) => (
                  <Link href={`/dashboard/comandas/${comanda.id}`} key={comanda.id}>
                    <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">
                            {comanda.mesa ? `Mesa ${comanda.mesa.numero}` : 'Balcão'}
                          </CardTitle>
                          <Badge variant="secondary">{comanda.status}</Badge>
                        </div>
                        <CardDescription className="space-y-1 mt-2">
                          <p className="font-semibold text-foreground">{comanda.cliente?.nome}</p>
                          {comanda.cliente?.cpf && (
                            <p className="text-xs">CPF: {comanda.cliente.cpf}</p>
                          )}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
            
            {!isLoading && debouncedSearchTerm.trim() && results.length === 0 && (
              <Card className="p-8">
                <div className="text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Nenhuma comanda encontrada para <strong>"{debouncedSearchTerm}"</strong></p>
                  <p className="text-sm mt-2">Tente buscar por número da mesa, nome completo ou CPF do cliente.</p>
                </div>
              </Card>
            )}

            {!isLoading && !debouncedSearchTerm.trim() && (
              <Card className="p-8">
                <div className="text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Digite algo para buscar uma comanda</p>
                  <p className="text-sm mt-2">Você pode buscar por número da mesa, nome ou CPF do cliente</p>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* TAB: LISTAGEM DE MESAS */}
        <TabsContent value="mesas" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {mesas.map((mesa) => (
              <Card 
                key={mesa.id} 
                className={`hover:shadow-lg transition-all cursor-pointer ${
                  mesa.status === 'OCUPADA' ? 'border-red-500 bg-red-50' : 
                  mesa.status === 'RESERVADA' ? 'border-yellow-500 bg-yellow-50' : 
                  'border-green-500 bg-green-50'
                }`}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold mb-2">{mesa.numero}</div>
                  <Badge 
                    variant={
                      mesa.status === 'OCUPADA' ? 'destructive' : 
                      mesa.status === 'RESERVADA' ? 'default' : 
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {mesa.status}
                  </Badge>
                  {mesa.ambiente && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {mesa.ambiente.nome}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB: LISTAGEM DE CLIENTES */}
        <TabsContent value="clientes" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientesComComanda.map((comanda) => (
              <Link href={`/dashboard/comandas/${comanda.id}`} key={comanda.id}>
                <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{comanda.cliente?.nome}</CardTitle>
                      <Badge variant="secondary">{comanda.status}</Badge>
                    </div>
                    <CardDescription className="space-y-1">
                      <p>CPF: {comanda.cliente?.cpf}</p>
                      {comanda.cliente?.email && <p>Email: {comanda.cliente.email}</p>}
                      {comanda.cliente?.celular && <p>Celular: {comanda.cliente.celular}</p>}
                      {comanda.mesa && (
                        <p className="text-sm font-semibold text-foreground mt-2">
                          Mesa {comanda.mesa.numero}
                        </p>
                      )}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TerminalCaixaPage;
