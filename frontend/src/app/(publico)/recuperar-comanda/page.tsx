// Caminho: frontend/src/app/(publico)/recuperar-comanda/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, QrCode, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RecuperarComandaPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);

  const buscarComanda = async () => {
    if (!codigo.trim()) {
      toast.error('Digite o código da comanda');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/comandas/search?q=${encodeURIComponent(codigo)}`);
      
      if (!response.ok) {
        throw new Error('Comanda não encontrada');
      }

      const data = await response.json();
      
      // Busca comanda que corresponde ao código exato
      const comanda = data.find((c: any) => 
        c.codigo.toLowerCase() === codigo.toLowerCase().trim()
      );

      if (!comanda) {
        toast.error('Comanda não encontrada. Verifique o código digitado.');
        setLoading(false);
        return;
      }

      // Redireciona para a página de acompanhamento
      toast.success('Comanda encontrada! Redirecionando...');
      setTimeout(() => {
        router.push(`/acesso-cliente/${comanda.id}`);
      }, 500);

    } catch (error) {
      console.error('Erro ao buscar comanda:', error);
      toast.error('Erro ao buscar comanda. Tente novamente.');
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarComanda();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center">
            <QrCode className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-3xl">Recuperar Comanda</CardTitle>
          <CardDescription className="text-base">
            Digite o código da sua comanda para acessar seus pedidos e conta
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alerta Informativo */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Onde encontrar o código?</p>
              <p>O código da comanda está no QR Code que o garçom te entregou ou na tela do seu pedido.</p>
            </div>
          </div>

          {/* Campo de Busca */}
          <div className="space-y-3">
            <label htmlFor="codigo" className="text-sm font-medium text-gray-700 block">
              Código da Comanda
            </label>
            <Input
              id="codigo"
              type="text"
              placeholder="Ex: COM-2024-001"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              className="text-lg font-mono tracking-wider text-center"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Botão de Busca */}
          <Button
            onClick={buscarComanda}
            disabled={loading || !codigo.trim()}
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
              <li>O código geralmente começa com "COM-"</li>
              <li>Maiúsculas e minúsculas não fazem diferença</li>
              <li>Tire uma foto do QR Code para não perder o acesso</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
