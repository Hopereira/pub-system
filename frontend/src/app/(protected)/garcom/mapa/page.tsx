'use client';

import { useState } from 'react';
import { MapaVisual } from '@/components/mapa/MapaVisual';
import { RoleGuard } from '@/components/guards/RoleGuard';
import { useAuth } from '@/context/AuthContext';
import { MesaMapa, PontoEntregaMapa } from '@/types/mapa';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MapaGarcomPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mesaSelecionada, setMesaSelecionada] = useState<MesaMapa | null>(null);
  const [pontoSelecionado, setPontoSelecionado] = useState<PontoEntregaMapa | null>(null);

  // Pegar ambienteId do usuário autenticado
  const ambienteId = user?.ambienteId || '';

  const handleMesaClick = (mesa: MesaMapa) => {
    setMesaSelecionada(mesa);
  };

  const handlePontoClick = (ponto: PontoEntregaMapa) => {
    setPontoSelecionado(ponto);
  };

  // Mostrar loading enquanto carrega usuário
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  // Validar se tem ambienteId
  if (!ambienteId) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800">Ambiente não encontrado</h2>
          <p className="text-yellow-700 mt-2">
            Seu usuário não está associado a nenhum ambiente. Entre em contato com o administrador.
          </p>
          <Button 
            onClick={() => router.push('/garcom')} 
            className="mt-4"
            variant="outline"
          >
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['GARCOM', 'ADMIN', 'GERENTE']}>
      <div className="container mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/garcom')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Mapa do Estabelecimento</h1>
            <p className="text-muted-foreground">
              Visualize mesas e pontos de entrega em tempo real
            </p>
          </div>
        </div>

        {/* Mapa */}
        <MapaVisual
          ambienteId={ambienteId}
          onMesaClick={handleMesaClick}
          onPontoClick={handlePontoClick}
        />

        {/* Dialog de Detalhes da Mesa */}
        <Dialog open={!!mesaSelecionada} onOpenChange={() => setMesaSelecionada(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mesa {mesaSelecionada?.numero}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    mesaSelecionada?.status === 'LIVRE'
                      ? 'default'
                      : mesaSelecionada?.status === 'OCUPADA'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {mesaSelecionada?.status}
                </Badge>
              </div>

              {mesaSelecionada?.comanda && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Comanda</p>
                    <p className="font-mono text-sm">{mesaSelecionada.comanda.id}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Pedidos Prontos</p>
                      <p className="text-2xl font-bold text-red-600">
                        {mesaSelecionada.comanda.pedidosProntos}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                      <p className="text-2xl font-bold">
                        {mesaSelecionada.comanda.totalPedidos}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      router.push(`/dashboard/comandas/${mesaSelecionada.comanda?.id}`);
                    }}
                  >
                    Ver Comanda
                  </Button>
                </>
              )}

              {!mesaSelecionada?.comanda && (
                <p className="text-center text-muted-foreground">
                  Mesa livre - Sem comanda ativa
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog de Detalhes do Ponto */}
        <Dialog open={!!pontoSelecionado} onOpenChange={() => setPontoSelecionado(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{pontoSelecionado?.nome}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={pontoSelecionado?.ativo ? 'default' : 'secondary'}>
                  {pontoSelecionado?.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              {pontoSelecionado?.pedidosProntos !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Pedidos Prontos</p>
                  <p className="text-3xl font-bold text-red-600">
                    {pontoSelecionado.pedidosProntos}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}
