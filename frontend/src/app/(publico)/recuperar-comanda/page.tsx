// Caminho: frontend/src/app/(publico)/recuperar-comanda/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, QrCode, AlertCircle, User } from 'lucide-react';
import { toast } from 'sonner';

type BuscaTipo = 'codigo' | 'cpf';

export default function RecuperarComandaPage() {
  const router = useRouter();
  const [buscaTipo, setBuscaTipo] = useState<BuscaTipo>('codigo');
  const [codigo, setCodigo] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);

  // Formata CPF enquanto digita (000.000.000-00)
  const formatarCpf = (valor: string) => {
    const numeros = valor.replace(/\D/g, '').slice(0, 11);
    if (numeros.length <= 3) return numeros;
    if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`;
    if (numeros.length <= 9) return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`;
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
  };

  const buscarComanda = async () => {
    const termoBusca = buscaTipo === 'codigo' ? codigo.trim() : cpf.replace(/\D/g, '');
    
    if (!termoBusca) {
      toast.error(buscaTipo === 'codigo' ? 'Digite o ID da comanda' : 'Digite o CPF');
      return;
    }

    if (buscaTipo === 'cpf' && termoBusca.length !== 11) {
      toast.error('CPF deve ter 11 dígitos');
      return;
    }

    setLoading(true);
    
    try {
      // Usa o endpoint público /comandas/recuperar
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comandas/recuperar?q=${encodeURIComponent(termoBusca)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Comanda não encontrada');
      }

      const comanda = await response.json();

      // Redireciona para a página de acompanhamento
      toast.success(`Comanda encontrada! Bem-vindo(a)${comanda.cliente?.nome ? ', ' + comanda.cliente.nome : ''}!`);
      setTimeout(() => {
        router.push(`/portal-cliente/${comanda.id}`);
      }, 500);

    } catch (error: any) {
      console.error('Erro ao buscar comanda:', error);
      toast.error(error.message || 'Erro ao buscar comanda. Tente novamente.');
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarComanda();
    }
  };

  const valorBusca = buscaTipo === 'codigo' ? codigo : cpf;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center">
            <QrCode className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-3xl">Recuperar Comanda</CardTitle>
          <CardDescription className="text-base">
            Busque sua comanda pelo código ou CPF
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Seletor de Tipo de Busca */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setBuscaTipo('codigo')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                buscaTipo === 'codigo'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <QrCode className="h-4 w-4" />
              Código
            </button>
            <button
              onClick={() => setBuscaTipo('cpf')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                buscaTipo === 'cpf'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="h-4 w-4" />
              CPF
            </button>
          </div>

          {/* Alerta Informativo */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              {buscaTipo === 'codigo' ? (
                <>
                  <p className="font-semibold mb-1">Onde encontrar o ID?</p>
                  <p>O ID da comanda está na URL do seu pedido ou no QR Code que o garçom te entregou.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold mb-1">Busca por CPF</p>
                  <p>Digite o CPF cadastrado na sua comanda para acessar seus pedidos.</p>
                </>
              )}
            </div>
          </div>

          {/* Campo de Busca */}
          <div className="space-y-3">
            {buscaTipo === 'codigo' ? (
              <>
                <label htmlFor="codigo" className="text-sm font-medium text-gray-700 block">
                  ID da Comanda
                </label>
                <Input
                  id="codigo"
                  type="text"
                  placeholder="Ex: a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toLowerCase())}
                  onKeyPress={handleKeyPress}
                  className="text-sm font-mono tracking-wider text-center"
                  disabled={loading}
                  autoFocus
                />
              </>
            ) : (
              <>
                <label htmlFor="cpf" className="text-sm font-medium text-gray-700 block">
                  CPF
                </label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatarCpf(e.target.value))}
                  onKeyPress={handleKeyPress}
                  className="text-lg font-mono tracking-wider text-center"
                  disabled={loading}
                  autoFocus
                  maxLength={14}
                />
              </>
            )}
          </div>

          {/* Botão de Busca */}
          <Button
            onClick={buscarComanda}
            disabled={loading || !valorBusca.trim()}
            className="w-full h-12 text-base"
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Buscar Comanda
              </>
            )}
          </Button>

          {/* Link para Portal */}
          <div className="pt-4 border-t text-center">
            <p className="text-sm text-gray-600 mb-3">
              Ou escaneie o QR Code novamente
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full"
            >
              Voltar ao Portal do Cliente
            </Button>
          </div>

          {/* Exemplos */}
          <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
            <p className="font-semibold mb-2">💡 Dicas:</p>
            <ul className="space-y-1 list-disc list-inside">
              {buscaTipo === 'codigo' ? (
                <>
                  <li>O ID está na URL após /portal-cliente/</li>
                  <li>Formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</li>
                  <li>Tire uma foto do QR Code para não perder o acesso</li>
                </>
              ) : (
                <>
                  <li>Digite apenas os números do CPF</li>
                  <li>Será exibida a comanda aberta mais recente</li>
                  <li>O CPF deve ser o mesmo usado no cadastro</li>
                </>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
