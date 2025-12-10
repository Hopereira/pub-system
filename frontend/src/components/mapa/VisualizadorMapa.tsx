'use client';

import { useEffect, useState } from 'react';
import { getMesas } from '@/services/mesaService';
import { getPontosEntregaAtivos } from '@/services/pontoEntregaService';
import { getComandasByPontoEntrega } from '@/services/comandaService';
import { Mesa } from '@/types/mesa';
import { PontoEntrega } from '@/types/ponto-entrega';
import { Comanda, ComandaStatus } from '@/types/comanda';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Clock, MapPin, Eye, Package, Plus, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface VisualizadorMapaProps {
  ambienteId: string;
  ambienteNome: string;
}

export function VisualizadorMapa({ ambienteId, ambienteNome }: VisualizadorMapaProps) {
  const router = useRouter();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pontosEntrega, setPontosEntrega] = useState<PontoEntrega[]>([]);
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const [pontoSelecionado, setPontoSelecionado] = useState<PontoEntrega | null>(null);
  const [comandasPonto, setComandasPonto] = useState<Comanda[]>([]);
  const [loadingComandas, setLoadingComandas] = useState(false);
  const [sheetAberto, setSheetAberto] = useState(false);
  const [sheetPontoAberto, setSheetPontoAberto] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [ambienteId]);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      
      // Carregar mesas
      const todasMesas = await getMesas();
      const mesasDoAmbiente = todasMesas.filter(
        (mesa) => mesa.ambiente.id === ambienteId
      );
      setMesas(mesasDoAmbiente);

      // Carregar pontos de entrega ativos
      const pontosAtivos = await getPontosEntregaAtivos();
      setPontosEntrega(pontosAtivos);
      
    } catch (error) {
      // Erro silencioso - dados não carregados
    } finally {
      setIsLoading(false);
    }
  };

  const handleMesaClick = (mesa: Mesa) => {
    setMesaSelecionada(mesa);
    setSheetAberto(true);
  };

  const handlePontoClick = async (ponto: PontoEntrega) => {
    setPontoSelecionado(ponto);
    setSheetPontoAberto(true);
    
    // Carregar comandas do ponto
    try {
      setLoadingComandas(true);
      const comandas = await getComandasByPontoEntrega(ponto.id);
      setComandasPonto(comandas);
    } catch (error) {
      // Erro silencioso - comandas não carregadas
      setComandasPonto([]);
    } finally {
      setLoadingComandas(false);
    }
  };

  const handleVerComanda = () => {
    if (mesaSelecionada?.comanda) {
      router.push(`/dashboard/comandas/${mesaSelecionada.comanda.id}`);
    }
    setSheetAberto(false);
  };

  const handleNovoPedido = () => {
    if (mesaSelecionada) {
      router.push(`/garcom/novo-pedido?mesaId=${mesaSelecionada.id}`);
    }
    setSheetAberto(false);
  };

  const handleVerPedidosProntos = () => {
    router.push('/dashboard/operacional/pedidos-prontos');
    setSheetAberto(false);
  };

  const handleAbrirMesa = () => {
    if (mesaSelecionada) {
      // Redireciona para abrir comanda
      router.push(`/dashboard/operacional/mesas`);
    }
    setSheetAberto(false);
  };

  const calcularTempoDecorrido = (criadoEm: string): string => {
    const agora = new Date();
    const criacao = new Date(criadoEm);
    const diffMs = agora.getTime() - criacao.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}min`;
    }
    
    const horas = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${horas}h ${mins}min`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
        <p className="text-muted-foreground">Carregando mapa...</p>
      </div>
    );
  }

  if (mesas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-gray-50 rounded-lg">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground font-medium">
          Nenhuma mesa cadastrada neste ambiente
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Peça ao administrador para adicionar mesas
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Grid de fundo */}
      <div 
        className="relative bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden"
        style={{
          height: '700px',
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      >
        {/* Mesas */}
        {mesas.map((mesa) => {
          const posicao = (mesa as any).posicao || { x: 100, y: 100 };
          const tamanho = (mesa as any).tamanho || { width: 80, height: 80 };
          const rotacao = (mesa as any).rotacao || 0;

          const isLivre = mesa.status === 'LIVRE';
          const isOcupada = mesa.status === 'OCUPADA';
          const isReservada = mesa.status === 'RESERVADA';

          return (
            <div
              key={mesa.id}
              className="absolute cursor-pointer transition-all hover:scale-105 hover:z-10"
              style={{
                left: `${posicao.x}px`,
                top: `${posicao.y}px`,
                width: `${tamanho.width}px`,
                height: `${tamanho.height}px`,
                transform: `rotate(${rotacao}deg)`,
              }}
              onClick={() => handleMesaClick(mesa)}
            >
              <Card
                className={`h-full flex flex-col items-center justify-center p-2 shadow-lg ${
                  isLivre
                    ? 'bg-green-100 border-green-500 hover:bg-green-200'
                    : isOcupada
                    ? 'bg-red-100 border-red-500 hover:bg-red-200'
                    : 'bg-yellow-100 border-yellow-500 hover:bg-yellow-200'
                }`}
              >
                {/* Número da Mesa */}
                <div className="text-2xl font-bold text-gray-800">
                  M{mesa.numero}
                </div>

                {/* Status Badge */}
                <Badge
                  variant={isLivre ? 'default' : isOcupada ? 'destructive' : 'secondary'}
                  className={`text-xs mt-1 ${
                    isLivre
                      ? 'bg-green-600'
                      : isOcupada
                      ? 'bg-red-600'
                      : 'bg-yellow-600'
                  }`}
                >
                  {mesa.status}
                </Badge>

                {/* Informações da Comanda */}
                {isOcupada && mesa.comanda && (
                  <div className="mt-2 space-y-1 text-center w-full">
                    {/* Cliente */}
                    {mesa.comanda.cliente && (
                      <div className="flex items-center justify-center gap-1 text-xs">
                        <User className="h-3 w-3" />
                        <span className="font-medium truncate max-w-[60px]">
                          {mesa.comanda.cliente.nome.split(' ')[0]}
                        </span>
                      </div>
                    )}
                    
                    {/* Tempo */}
                    {mesa.comanda.criadoEm && (
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{calcularTempoDecorrido(mesa.comanda.criadoEm)}</span>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          );
        })}

        {/* Pontos de Entrega */}
        {pontosEntrega.map((ponto) => {
          const posicao = ponto.posicao || { x: 400, y: 400 };
          const tamanho = ponto.tamanho || { width: 120, height: 80 };

          return (
            <div
              key={ponto.id}
              className="absolute cursor-pointer transition-all hover:scale-105 hover:z-10"
              style={{
                left: `${posicao.x}px`,
                top: `${posicao.y}px`,
                width: `${tamanho.width}px`,
                height: `${tamanho.height}px`,
              }}
              onClick={() => handlePontoClick(ponto)}
            >
              <Card className="h-full flex flex-col items-center justify-center p-2 shadow-lg bg-blue-100 border-blue-500 hover:bg-blue-200">
                {/* Ícone */}
                <MapPin className="h-6 w-6 text-blue-700" />
                
                {/* Nome do Ponto */}
                <div className="text-xs font-bold text-blue-900 text-center mt-1 leading-tight">
                  {ponto.nome}
                </div>
                
                {/* Badge Ativo */}
                <Badge className="text-xs mt-1 bg-blue-600">
                  ENTREGA
                </Badge>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-4 flex items-center justify-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-sm">Livre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm">Ocupada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-sm">Reservada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span className="text-sm">Ponto de Entrega</span>
        </div>
      </div>

      {/* Instruções */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>Clique em uma mesa para ver as ações disponíveis</p>
      </div>

      {/* Sheet de Ações da Mesa */}
      <Sheet open={sheetAberto} onOpenChange={setSheetAberto}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl">
              Mesa {mesaSelecionada?.numero}
            </SheetTitle>
            <SheetDescription>
              {mesaSelecionada?.status === 'LIVRE' && 'Mesa disponível'}
              {mesaSelecionada?.status === 'OCUPADA' && mesaSelecionada.comanda?.cliente && (
                <span>Cliente: {mesaSelecionada.comanda.cliente.nome}</span>
              )}
              {mesaSelecionada?.status === 'RESERVADA' && 'Mesa reservada'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            {/* Status da Mesa */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  mesaSelecionada?.status === 'LIVRE' 
                    ? 'bg-green-100' 
                    : mesaSelecionada?.status === 'OCUPADA'
                    ? 'bg-red-100'
                    : 'bg-yellow-100'
                }`}>
                  <span className="text-2xl font-bold">
                    M{mesaSelecionada?.numero}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">Status</p>
                  <Badge
                    variant={
                      mesaSelecionada?.status === 'LIVRE' 
                        ? 'default' 
                        : mesaSelecionada?.status === 'OCUPADA'
                        ? 'destructive'
                        : 'secondary'
                    }
                    className={
                      mesaSelecionada?.status === 'LIVRE'
                        ? 'bg-green-600'
                        : mesaSelecionada?.status === 'OCUPADA'
                        ? 'bg-red-600'
                        : 'bg-yellow-600'
                    }
                  >
                    {mesaSelecionada?.status}
                  </Badge>
                </div>
              </div>

              {/* Tempo de Ocupação */}
              {mesaSelecionada?.status === 'OCUPADA' && mesaSelecionada.comanda?.criadoEm && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Tempo</p>
                  <p className="text-lg font-bold">
                    {calcularTempoDecorrido(mesaSelecionada.comanda.criadoEm)}
                  </p>
                </div>
              )}
            </div>

            {/* Ações para Mesa OCUPADA */}
            {mesaSelecionada?.status === 'OCUPADA' && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Ações Disponíveis</h3>
                
                {/* Ver Comanda */}
                <Button
                  onClick={handleVerComanda}
                  className="w-full h-16 text-lg justify-start gap-4"
                  variant="default"
                >
                  <Eye className="h-6 w-6" />
                  <div className="text-left">
                    <p className="font-semibold">Ver Comanda</p>
                    <p className="text-xs opacity-80">Visualizar itens e total</p>
                  </div>
                </Button>

                {/* Novo Pedido */}
                <Button
                  onClick={handleNovoPedido}
                  className="w-full h-16 text-lg justify-start gap-4"
                  variant="outline"
                >
                  <Plus className="h-6 w-6" />
                  <div className="text-left">
                    <p className="font-semibold">Adicionar Pedido</p>
                    <p className="text-xs text-muted-foreground">Fazer novo pedido para esta mesa</p>
                  </div>
                </Button>

                {/* Ver Pedidos Prontos */}
                <Button
                  onClick={handleVerPedidosProntos}
                  className="w-full h-16 text-lg justify-start gap-4"
                  variant="outline"
                >
                  <Package className="h-6 w-6" />
                  <div className="text-left">
                    <p className="font-semibold">Pedidos Prontos</p>
                    <p className="text-xs text-muted-foreground">Ver pedidos para entregar</p>
                  </div>
                </Button>
              </div>
            )}

            {/* Ações para Mesa LIVRE */}
            {mesaSelecionada?.status === 'LIVRE' && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Ações Disponíveis</h3>
                
                {/* Abrir Mesa */}
                <Button
                  onClick={handleAbrirMesa}
                  className="w-full h-16 text-lg justify-start gap-4"
                  variant="default"
                >
                  <CheckCircle className="h-6 w-6" />
                  <div className="text-left">
                    <p className="font-semibold">Abrir Mesa</p>
                    <p className="text-xs opacity-80">Iniciar atendimento</p>
                  </div>
                </Button>

                {/* Ver Pedidos Prontos */}
                <Button
                  onClick={handleVerPedidosProntos}
                  className="w-full h-16 text-lg justify-start gap-4"
                  variant="outline"
                >
                  <Package className="h-6 w-6" />
                  <div className="text-left">
                    <p className="font-semibold">Pedidos Prontos</p>
                    <p className="text-xs text-muted-foreground">Ver pedidos para entregar</p>
                  </div>
                </Button>
              </div>
            )}

            {/* Ações para Mesa RESERVADA */}
            {mesaSelecionada?.status === 'RESERVADA' && (
              <div className="space-y-3">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                  <p className="text-yellow-800 font-medium">
                    Mesa reservada - Aguardando cliente
                  </p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet de Comandas do Ponto de Entrega */}
      <Sheet open={sheetPontoAberto} onOpenChange={setSheetPontoAberto}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl flex items-center gap-2">
              <MapPin className="h-6 w-6 text-blue-600" />
              {pontoSelecionado?.nome}
            </SheetTitle>
            <SheetDescription>
              Comandas aguardando entrega neste ponto
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            {loadingComandas ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Carregando comandas...</div>
              </div>
            ) : comandasPonto.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Nenhuma comanda neste ponto
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Não há clientes aguardando entrega aqui
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">
                  {comandasPonto.length} {comandasPonto.length === 1 ? 'Comanda' : 'Comandas'}
                </h3>
                
                {comandasPonto.map((comanda) => (
                  <Card 
                    key={comanda.id} 
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      router.push(`/dashboard/comandas/${comanda.id}`);
                      setSheetPontoAberto(false);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-5 w-5 text-primary" />
                          <span className="font-bold text-lg">
                            {comanda.cliente?.nome || 'Cliente sem nome'}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              Aberta há {calcularTempoDecorrido(comanda.criadoEm || '')}
                            </span>
                          </div>
                          
                          {comanda.cliente?.telefone && (
                            <div className="flex items-center gap-2">
                              <span>📱</span>
                              <span>{comanda.cliente.telefone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <Badge 
                        variant={comanda.status === ComandaStatus.ABERTA ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {comanda.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
