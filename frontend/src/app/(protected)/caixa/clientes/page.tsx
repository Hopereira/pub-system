'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Users, Phone, Mail, CreditCard, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Cliente {
  id: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  comanda?: {
    numero: number;
    valor: number;
  };
}

export default function CaixaClientesPage() {
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    setLoading(true);
    try {
      // TODO: Integrar com backend
      // const data = await caixaService.getClientesComComanda();
      
      // Placeholder data
      setClientes([
        {
          id: '1',
          nome: 'João Silva',
          cpf: '123.456.789-00',
          telefone: '(11) 98765-4321',
          email: 'joao@email.com',
          comanda: { numero: 101, valor: 150.50 }
        },
        {
          id: '2',
          nome: 'Maria Santos',
          telefone: '(11) 91234-5678',
          comanda: { numero: 105, valor: 89.90 }
        },
        {
          id: '3',
          nome: 'Pedro Oliveira',
          cpf: '987.654.321-00',
          comanda: { numero: 108, valor: 220.00 }
        }
      ]);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
    cliente.cpf?.includes(busca) ||
    cliente.telefone?.includes(busca)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/caixa">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Clientes</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Clientes com comandas ativas
          </p>
        </div>
        <Button onClick={carregarClientes} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Barra de Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buscar Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      {loading ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Carregando clientes...</p>
          </CardContent>
        </Card>
      ) : clientesFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Nenhum cliente encontrado</p>
            <p className="text-sm text-muted-foreground">
              {busca ? 'Tente buscar com outros termos' : 'Não há clientes com comandas ativas no momento'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientesFiltrados.map((cliente) => (
            <Card key={cliente.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{cliente.nome}</CardTitle>
                      {cliente.comanda && (
                        <CardDescription>
                          Comanda #{cliente.comanda.numero}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  {cliente.comanda && (
                    <Badge variant="default" className="text-base font-semibold">
                      {formatCurrency(cliente.comanda.valor)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {cliente.cpf && (
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">CPF:</span>
                    <span className="font-medium">{formatCPF(cliente.cpf)}</span>
                  </div>
                )}
                {cliente.telefone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Telefone:</span>
                    <span className="font-medium">{cliente.telefone}</span>
                  </div>
                )}
                {cliente.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">E-mail:</span>
                    <span className="font-medium">{cliente.email}</span>
                  </div>
                )}
                {cliente.comanda && (
                  <div className="mt-4 pt-4 border-t">
                    <Link href={`/caixa/terminal`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Ver no Terminal
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Informação */}
      <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="text-base">ℹ️ Informação</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>
            Esta lista mostra apenas clientes que possuem comandas ativas no momento.
            Para acessar o cadastro completo de clientes, utilize o sistema administrativo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
