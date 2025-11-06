'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, RotateCw, Plus, Trash2 } from 'lucide-react';
import { MapaCompleto, Posicao } from '@/types/mapa';
import mapaService from '@/services/mapaService';
import { toast } from 'sonner';

interface ConfiguradorMapaProps {
  ambienteId: string;
}

export function ConfiguradorMapa({ ambienteId }: ConfiguradorMapaProps) {
  const [mapa, setMapa] = useState<MapaCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<{
    tipo: 'mesa' | 'ponto';
    id: string;
  } | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const mapaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    carregarMapa();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambienteId]);

  const carregarMapa = async () => {
    try {
      setLoading(true);
      const dados = await mapaService.getMapa(ambienteId);
      setMapa(dados);
    } catch (error) {
      console.error('Erro ao carregar mapa:', error);
      toast.error('Erro ao carregar mapa');
    } finally {
      setLoading(false);
    }
  };

  const handleMouseDown = (
    e: React.MouseEvent,
    tipo: 'mesa' | 'ponto',
    id: string,
    posicao: Posicao,
  ) => {
    e.preventDefault();
    setArrastando(true);
    setItemSelecionado({ tipo, id });
    setOffset({
      x: e.clientX - posicao.x,
      y: e.clientY - posicao.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!arrastando || !itemSelecionado || !mapa) return;

    const rect = mapaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.max(0, Math.min(e.clientX - rect.left - offset.x, mapa.layout.width - 80));
    const y = Math.max(0, Math.min(e.clientY - rect.top - offset.y, mapa.layout.height - 80));

    // Snap to grid
    const gridSize = mapa.layout.gridSize || 20;
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;

    if (itemSelecionado.tipo === 'mesa') {
      setMapa({
        ...mapa,
        mesas: mapa.mesas.map((m) =>
          m.id === itemSelecionado.id
            ? { ...m, posicao: { x: snappedX, y: snappedY } }
            : m,
        ),
      });
    } else {
      setMapa({
        ...mapa,
        pontosEntrega: mapa.pontosEntrega.map((p) =>
          p.id === itemSelecionado.id
            ? { ...p, posicao: { x: snappedX, y: snappedY } }
            : p,
        ),
      });
    }
  };

  const handleMouseUp = () => {
    setArrastando(false);
  };

  const rotacionarMesa = (mesaId: string) => {
    if (!mapa) return;

    setMapa({
      ...mapa,
      mesas: mapa.mesas.map((m) =>
        m.id === mesaId
          ? { ...m, rotacao: ((m.rotacao || 0) + 90) % 360 }
          : m,
      ),
    });
  };

  const redimensionarMesa = (mesaId: string, dimensao: 'width' | 'height', valor: number) => {
    if (!mapa || isNaN(valor)) return;

    // Limitar valores entre 40 e 200
    const valorLimitado = Math.max(40, Math.min(200, valor));

    setMapa({
      ...mapa,
      mesas: mapa.mesas.map((m) =>
        m.id === mesaId
          ? {
              ...m,
              tamanho: {
                width: dimensao === 'width' ? valorLimitado : (m.tamanho?.width || 80),
                height: dimensao === 'height' ? valorLimitado : (m.tamanho?.height || 80),
              },
            }
          : m,
      ),
    });
  };

  const adicionarMesa = () => {
    if (!mapa) return;

    // Gerar número da nova mesa
    const numerosMesas = mapa.mesas.map(m => m.numero);
    const proximoNumero = Math.max(...numerosMesas, 0) + 1;

    // Criar nova mesa temporária (será salva no backend ao clicar em Salvar)
    const novaMesa = {
      id: `temp-${Date.now()}`, // ID temporário
      numero: proximoNumero,
      status: 'LIVRE' as const,
      posicao: { x: 100, y: 100 }, // Posição inicial
      tamanho: { width: 80, height: 80 },
      rotacao: 0,
      comanda: undefined,
    };

    setMapa({
      ...mapa,
      mesas: [...mapa.mesas, novaMesa],
    });

    toast.success(`Mesa ${proximoNumero} adicionada. Clique em "Salvar Layout" para confirmar.`);
  };

  const removerMesa = (mesaId: string) => {
    if (!mapa) return;

    const mesa = mapa.mesas.find(m => m.id === mesaId);
    if (!mesa) return;

    if (mesa.status !== 'LIVRE') {
      toast.error('Não é possível remover uma mesa ocupada ou reservada.');
      return;
    }

    setMapa({
      ...mapa,
      mesas: mapa.mesas.filter(m => m.id !== mesaId),
    });

    setItemSelecionado(null);
    toast.success(`Mesa ${mesa.numero} removida. Clique em "Salvar Layout" para confirmar.`);
  };

  const salvarLayout = async () => {
    if (!mapa) return;

    try {
      setSalvando(true);

      // Salvar posição de cada mesa
      for (const mesa of mapa.mesas) {
        if (mesa.posicao) {
          await mapaService.atualizarPosicaoMesa(mesa.id, {
            posicao: mesa.posicao,
            tamanho: mesa.tamanho,
            rotacao: mesa.rotacao,
          });
        }
      }

      // Salvar posição de cada ponto
      for (const ponto of mapa.pontosEntrega) {
        if (ponto.posicao) {
          await mapaService.atualizarPosicaoPonto(ponto.id, {
            posicao: ponto.posicao,
            tamanho: ponto.tamanho,
          });
        }
      }

      toast.success('Layout salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar layout:', error);
      toast.error('Erro ao salvar layout');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-96">
            <p>Carregando...</p>
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

  const mesaSelecionada = itemSelecionado?.tipo === 'mesa'
    ? mapa.mesas.find((m) => m.id === itemSelecionado.id)
    : null;

  const pontoSelecionado = itemSelecionado?.tipo === 'ponto'
    ? mapa.pontosEntrega.find((p) => p.id === itemSelecionado.id)
    : null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Configurador de Layout</CardTitle>
            <div className="flex gap-2">
              <Button onClick={adicionarMesa} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Mesa
              </Button>
              <Button onClick={carregarMapa} variant="outline" size="sm">
                Resetar
              </Button>
              <Button onClick={salvarLayout} disabled={salvando} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {salvando ? 'Salvando...' : 'Salvar Layout'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <p>• Arraste mesas e pontos para posicioná-los</p>
            <p>• Clique no botão de rotação para girar mesas</p>
            <p>• Grade de {mapa.layout.gridSize}px para alinhamento</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        {/* Mapa */}
        <div className="col-span-3">
          <Card>
            <CardContent className="pt-6">
              <div
                ref={mapaRef}
                className="border rounded-lg overflow-hidden bg-gray-50 relative"
                style={{
                  width: mapa.layout.width,
                  height: mapa.layout.height,
                  backgroundImage: `repeating-linear-gradient(0deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent ${mapa.layout.gridSize}px), repeating-linear-gradient(90deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent ${mapa.layout.gridSize}px)`,
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Renderizar Mesas */}
                {mapa.mesas.map((mesa) => {
                  const posicao = mesa.posicao || { x: 50, y: 50 };
                  const tamanho = mesa.tamanho || { width: 80, height: 80 };
                  const selecionado = itemSelecionado?.tipo === 'mesa' && itemSelecionado.id === mesa.id;

                  return (
                    <div
                      key={mesa.id}
                      onMouseDown={(e) => handleMouseDown(e, 'mesa', mesa.id, posicao)}
                      className={`absolute cursor-move bg-blue-500 rounded-lg flex flex-col items-center justify-center text-white font-bold shadow-md hover:ring-2 hover:ring-primary transition-all ${selecionado ? 'ring-4 ring-primary' : ''}`}
                      style={{
                        left: posicao.x,
                        top: posicao.y,
                        width: tamanho.width,
                        height: tamanho.height,
                        transform: `rotate(${mesa.rotacao || 0}deg)`,
                      }}
                    >
                      <span className="text-lg">M{mesa.numero}</span>
                    </div>
                  );
                })}

                {/* Renderizar Pontos de Entrega */}
                {mapa.pontosEntrega.map((ponto) => {
                  const posicao = ponto.posicao || { x: 100, y: 100 };
                  const tamanho = ponto.tamanho || { width: 100, height: 60 };
                  const selecionado = itemSelecionado?.tipo === 'ponto' && itemSelecionado.id === ponto.id;

                  return (
                    <div
                      key={ponto.id}
                      onMouseDown={(e) => handleMouseDown(e, 'ponto', ponto.id, posicao)}
                      className={`absolute cursor-move bg-purple-500 rounded-lg flex items-center justify-center text-white font-semibold shadow-md hover:ring-2 hover:ring-primary transition-all ${selecionado ? 'ring-4 ring-primary' : ''}`}
                      style={{
                        left: posicao.x,
                        top: posicao.y,
                        width: tamanho.width,
                        height: tamanho.height,
                      }}
                    >
                      <span className="text-sm text-center px-2">{ponto.nome}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel de Propriedades */}
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Propriedades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!itemSelecionado && (
                <p className="text-sm text-muted-foreground">
                  Selecione uma mesa ou ponto para editar
                </p>
              )}

              {mesaSelecionada && (
                <div className="space-y-4">
                  <div>
                    <Label>Mesa {mesaSelecionada.numero}</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">X</Label>
                      <Input
                        type="number"
                        value={mesaSelecionada.posicao?.x || 0}
                        readOnly
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y</Label>
                      <Input
                        type="number"
                        value={mesaSelecionada.posicao?.y || 0}
                        readOnly
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Largura</Label>
                      <Input
                        type="number"
                        value={mesaSelecionada.tamanho?.width || 80}
                        onChange={(e) => redimensionarMesa(mesaSelecionada.id, 'width', parseInt(e.target.value))}
                        min={40}
                        max={200}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Altura</Label>
                      <Input
                        type="number"
                        value={mesaSelecionada.tamanho?.height || 80}
                        onChange={(e) => redimensionarMesa(mesaSelecionada.id, 'height', parseInt(e.target.value))}
                        min={40}
                        max={200}
                        className="h-8"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Rotação: {mesaSelecionada.rotacao || 0}°</Label>
                    <Button
                      onClick={() => rotacionarMesa(mesaSelecionada.id)}
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                    >
                      <RotateCw className="h-4 w-4 mr-2" />
                      Rotacionar 90°
                    </Button>
                  </div>

                  <div>
                    <Button
                      onClick={() => removerMesa(mesaSelecionada.id)}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      disabled={mesaSelecionada.status !== 'LIVRE'}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover Mesa
                    </Button>
                    {mesaSelecionada.status !== 'LIVRE' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Apenas mesas livres podem ser removidas
                      </p>
                    )}
                  </div>
                </div>
              )}

              {pontoSelecionado && (
                <div className="space-y-4">
                  <div>
                    <Label>{pontoSelecionado.nome}</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">X</Label>
                      <Input
                        type="number"
                        value={pontoSelecionado.posicao?.x || 0}
                        readOnly
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Y</Label>
                      <Input
                        type="number"
                        value={pontoSelecionado.posicao?.y || 0}
                        readOnly
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
