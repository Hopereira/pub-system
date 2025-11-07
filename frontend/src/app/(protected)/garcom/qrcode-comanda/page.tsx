'use client';

import { useState, useEffect } from 'react';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, QrCode, Download, Printer, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

interface Comanda {
  id: string;
  codigo: string;
  cliente: {
    id: string;
    nome: string;
  };
  mesa?: {
    numero: number;
  };
  status: string;
  criadoEm: string;
}

export default function QRCodeComandaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [busca, setBusca] = useState('');
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [comandaSelecionada, setComandaSelecionada] = useState<Comanda | null>(null);
  const [carregando, setCarregando] = useState(false);

  // URL base para acompanhamento de pedido
  const getUrlAcompanhamento = (comandaId: string) => {
    return `${window.location.origin}/acesso-cliente/${comandaId}`;
  };

  // Buscar comandas ativas do garçom
  const buscarComandas = async () => {
    setCarregando(true);
    try {
      // TODO: Implementar chamada à API para buscar comandas ativas
      // Por enquanto, dados mockados
      const comandasMock: Comanda[] = [
        {
          id: 'ffeb85b5-0ac9-46ff-b6a3-7423bc960c36',
          codigo: 'CMD-001',
          cliente: {
            id: '1',
            nome: 'João Silva',
          },
          mesa: {
            numero: 5,
          },
          status: 'ATIVA',
          criadoEm: new Date().toISOString(),
        },
      ];
      setComandas(comandasMock);
    } catch (error) {
      toast.error('Erro ao buscar comandas');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarComandas();
  }, []);

  const comandasFiltradas = comandas.filter(
    (c) =>
      c.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      c.cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.mesa?.numero.toString().includes(busca)
  );

  const downloadQRCode = (comandaId: string, nomeCliente: string) => {
    const canvas = document.getElementById(`qr-${comandaId}`) as HTMLCanvasElement;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `QRCode-${nomeCliente.replace(/\s/g, '_')}.png`;
    link.href = url;
    link.click();
    toast.success('QR Code baixado com sucesso!');
  };

  const printQRCode = (comandaId: string) => {
    const qrElement = document.getElementById(`qr-container-${comandaId}`);
    if (!qrElement) return;

    const printWindow = window.open('', '', 'width=600,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - Acompanhamento de Pedido</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 { font-size: 24px; margin-bottom: 10px; }
            p { margin: 5px 0; }
            .qr-container { margin: 20px 0; }
          </style>
        </head>
        <body>
          ${qrElement.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const copiarLink = (comandaId: string) => {
    const url = getUrlAcompanhamento(comandaId);
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para a área de transferência!');
  };

  return (
    <RoleGuard allowedRoles={['GARCOM', 'ADMIN']}>
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/garcom')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gerar QR Code</h1>
            <p className="text-muted-foreground">
              Gere QR Codes para clientes acompanharem seus pedidos
            </p>
          </div>
        </div>

        {/* Busca */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, cliente ou mesa..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={buscarComandas} disabled={carregando}>
                {carregando ? 'Carregando...' : 'Atualizar'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Comandas */}
        {comandasFiltradas.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Nenhuma comanda ativa encontrada</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comandasFiltradas.map((comanda) => (
              <Card key={comanda.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{comanda.cliente.nome}</CardTitle>
                    <Badge>{comanda.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Código: {comanda.codigo}</p>
                    {comanda.mesa && <p>Mesa: {comanda.mesa.numero}</p>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* QR Code */}
                  <div id={`qr-container-${comanda.id}`} className="flex flex-col items-center p-4 bg-white rounded-lg border">
                    <h3 className="text-sm font-semibold mb-2">Acompanhe seu Pedido</h3>
                    <QRCodeSVG
                      id={`qr-${comanda.id}`}
                      value={getUrlAcompanhamento(comanda.id)}
                      size={150}
                      level="H"
                      includeMargin
                    />
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Escaneie com seu celular
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadQRCode(comanda.id, comanda.cliente.nome)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Baixar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printQRCode(comanda.id)}
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Imprimir
                    </Button>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copiarLink(comanda.id)}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Copiar Link
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
