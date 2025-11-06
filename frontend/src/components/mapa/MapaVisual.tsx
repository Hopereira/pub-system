'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Filter, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { MapaCompleto, MesaMapa, PontoEntregaMapa } from '@/types/mapa';
import mapaService from '@/services/mapaService';
import { toast } from 'sonner';

interface MapaVisualProps {
  ambienteId: string;
  onMesaClick?: (mesa: MesaMapa) => void;
  onPontoClick?: (ponto: PontoEntregaMapa) => void;
}

export function MapaVisual({ ambienteId, onMesaClick, onPontoClick }: MapaVisualProps) {
  const [mapa, setMapa] = useState<MapaCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'prontos'>('todos');
  const [zoom, setZoom] = useState(1);
  
  // Estado para Pan (arrastar o mapa)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    carregarMapa();
    // Atualizar a cada 30 segundos
    const interval = setInterval(carregarMapa, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambienteId]);

  const carregarMapa = async () => {
    try {
      const dados = await mapaService.getMapa(ambienteId);
      setMapa(dados);
    } catch (error) {
      console.error('Erro ao carregar mapa:', error);
      toast.error('Erro ao carregar mapa');
    } finally {
      setLoading(false);
    }
  };

  const getCorMesa = (mesa: MesaMapa): string => {
    if (mesa.status === 'LIVRE') return 'bg-green-500';
    if (mesa.comanda && mesa.comanda.pedidosProntos > 0) return 'bg-red-500';
    if (mesa.status === 'OCUPADA') return 'bg-yellow-500';
    if (mesa.status === 'RESERVADA') return 'bg-blue-500';
    return 'bg-gray-300';
  };

  const getCorPonto = (ponto: PontoEntregaMapa): string => {
    if (!ponto.ativo) return 'bg-gray-300';
    if (ponto.pedidosProntos && ponto.pedidosProntos > 0) return 'bg-red-500';
    return 'bg-blue-500';
  };

  const mesasFiltradas = mapa?.mesas.filter((mesa) => {
    if (filtro === 'prontos') {
      return mesa.comanda && mesa.comanda.pedidosProntos > 0;
    }
    return true;
  }) || [];

  const pontosFiltrados = mapa?.pontosEntrega.filter((ponto) => {
    if (filtro === 'prontos') {
      return ponto.pedidosProntos && ponto.pedidosProntos > 0;
    }
    return true;
  }) || [];

  // Handlers para Pan (arrastar o mapa)
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const resetPan = () => {
    setPan({ x: 0, y: 0 });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-96">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!mapa) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Nenhum mapa disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Mapa do Estabelecimento</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filtro === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro('todos')}
            >
              Todos
            </Button>
            <Button
              variant={filtro === 'prontos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltro('prontos')}
            >
              <Filter className="h-4 w-4 mr-1" />
              Prontos
            </Button>
            <Button variant="outline" size="sm" onClick={carregarMapa}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Controles de Zoom e Pan */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            {Math.round(zoom * 100)}%
          </span>
          <div className="border-l mx-2" />
          <Button
            variant="outline"
            size="sm"
            onClick={resetPan}
            title="Resetar posição do mapa"
          >
            <Move className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            Arraste para mover
          </span>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>Livre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span>Ocupada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span>Pedidos Prontos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span>Ponto de Entrega</span>
          </div>
        </div>

        {/* Mapa */}
        <div 
          className="border rounded-lg overflow-hidden bg-gray-50"
          style={{ height: '600px', position: 'relative' }}
        >
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{
              width: mapa.layout.width,
              height: mapa.layout.height,
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'top left',
              position: 'absolute',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            {/* Renderizar Mesas */}
            {mesasFiltradas.map((mesa) => {
              const posicao = mesa.posicao || { x: 0, y: 0 };
              const tamanho = mesa.tamanho || { width: 80, height: 80 };

              return (
                <div
                  key={mesa.id}
                  onClick={() => onMesaClick?.(mesa)}
                  className={`absolute cursor-pointer hover:ring-2 hover:ring-primary transition-all ${getCorMesa(mesa)} rounded-lg flex flex-col items-center justify-center text-white font-bold shadow-md`}
                  style={{
                    left: posicao.x,
                    top: posicao.y,
                    width: tamanho.width,
                    height: tamanho.height,
                    transform: `rotate(${mesa.rotacao || 0}deg)`,
                  }}
                >
                  <span className="text-lg">M{mesa.numero}</span>
                  {mesa.comanda && mesa.comanda.pedidosProntos > 0 && (
                    <Badge variant="destructive" className="mt-1">
                      {mesa.comanda.pedidosProntos} pronto{mesa.comanda.pedidosProntos > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              );
            })}

            {/* Renderizar Pontos de Entrega */}
            {pontosFiltrados.map((ponto) => {
              const posicao = ponto.posicao || { x: 0, y: 0 };
              const tamanho = ponto.tamanho || { width: 100, height: 60 };

              return (
                <div
                  key={ponto.id}
                  onClick={() => onPontoClick?.(ponto)}
                  className={`absolute cursor-pointer hover:ring-2 hover:ring-primary transition-all ${getCorPonto(ponto)} rounded-lg flex flex-col items-center justify-center text-white font-semibold shadow-md`}
                  style={{
                    left: posicao.x,
                    top: posicao.y,
                    width: tamanho.width,
                    height: tamanho.height,
                  }}
                >
                  <span className="text-sm text-center px-2">{ponto.nome}</span>
                  {ponto.pedidosProntos && ponto.pedidosProntos > 0 && (
                    <Badge variant="destructive" className="mt-1">
                      {ponto.pedidosProntos}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{mesasFiltradas.length}</p>
            <p className="text-sm text-muted-foreground">Mesas</p>
          </div>
          <div>
            <p className="text-2xl font-bold">
              {mesasFiltradas.filter((m) => m.comanda && m.comanda.pedidosProntos > 0).length}
            </p>
            <p className="text-sm text-muted-foreground">Com Pedidos Prontos</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{pontosFiltrados.length}</p>
            <p className="text-sm text-muted-foreground">Pontos de Entrega</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
