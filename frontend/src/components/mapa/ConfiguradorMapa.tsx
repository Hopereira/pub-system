'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, RotateCw, Plus, Trash2, MapPin } from 'lucide-react';
import { MapaCompleto, Posicao } from '@/types/mapa';
import mapaService from '@/services/mapaService';
import { getPontosByAmbiente } from '@/services/pontoEntregaService';
import { createMesa } from '@/services/mesaService';
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
      
      // Buscar pontos de entrega do ambiente
      const pontos = await getPontosByAmbiente(ambienteId);
      
      // Mesclar pontos com dados do mapa
      setMapa({
        ...dados,
        pontosEntrega: pontos.map(p => ({
          ...p,
          posicao: p.posicao || { x: 200, y: 200 },
          tamanho: p.tamanho || { width: 100, height: 60 },
        })),
      });
    } catch (error) {
      toast.error('Erro ao carregar mapa: ' + (error as Error).message);
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
    e.stopPropagation();
    
    const rect = mapaRef.current?.getBoundingClientRect();
    if (!rect) return;

    setArrastando(true);
    setItemSelecionado({ tipo, id });
    
    // Calcular offset correto relativo ao mapa
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setOffset({
      x: mouseX - posicao.x,
      y: mouseY - posicao.y,
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

  const moverMesa = (mesaId: string, eixo: 'x' | 'y', valor: number) => {
    if (!mapa || isNaN(valor)) return;

    // Limitar valores dentro do mapa
    const valorLimitado = eixo === 'x' 
      ? Math.max(0, Math.min(mapa.layout.width - 80, valor))
      : Math.max(0, Math.min(mapa.layout.height - 80, valor));

    setMapa({
      ...mapa,
      mesas: mapa.mesas.map((m) =>
        m.id === mesaId
          ? {
              ...m,
              posicao: {
                x: eixo === 'x' ? valorLimitado : (m.posicao?.x || 0),
                y: eixo === 'y' ? valorLimitado : (m.posicao?.y || 0),
              },
            }
          : m,
      ),
    });
  };

  const moverPonto = (pontoId: string, eixo: 'x' | 'y', valor: number) => {
    if (!mapa || isNaN(valor)) return;

    // Limitar valores dentro do mapa
    const valorLimitado = eixo === 'x' 
      ? Math.max(0, Math.min(mapa.layout.width - 100, valor))
      : Math.max(0, Math.min(mapa.layout.height - 60, valor));

    setMapa({
      ...mapa,
      pontosEntrega: mapa.pontosEntrega.map((p) =>
        p.id === pontoId
          ? {
              ...p,
              posicao: {
                x: eixo === 'x' ? valorLimitado : (p.posicao?.x || 0),
                y: eixo === 'y' ? valorLimitado : (p.posicao?.y || 0),
              },
            }
          : p,
      ),
    });
  };

  const adicionarMesa = () => {
    if (!mapa) return;

    // Gerar número da nova mesa (apenas do ambiente atual)
    const numerosMesas = mapa.mesas.map(m => m.numero);
    const proximoNumero = Math.max(...numerosMesas, 0) + 1;

    // Solicitar número da mesa ao usuário
    const numeroEscolhido = window.prompt(
      `Digite o número da nova mesa.\n\n` +
      `Sugestão: ${proximoNumero}\n\n` +
      `Observação: O número deve ser único dentro deste ambiente.`,
      proximoNumero.toString()
    );

    if (!numeroEscolhido) {
      return; // Usuário cancelou
    }

    const numero = parseInt(numeroEscolhido, 10);
    if (isNaN(numero) || numero <= 0) {
      toast.error('Número inválido. Por favor, digite um número positivo.');
      return;
    }

    // Verificar se já existe mesa com este número no ambiente atual
    if (numerosMesas.includes(numero)) {
      toast.error(`A mesa ${numero} já existe neste ambiente. Por favor, escolha outro número.`);
      return;
    }

    // Criar nova mesa temporária (será salva no backend ao clicar em Salvar)
    // Calcular posição inicial para evitar sobreposição
    const posicaoInicial = {
      x: 100 + (mapa.mesas.length % 5) * 120, // Espaçar horizontalmente
      y: 100 + Math.floor(mapa.mesas.length / 5) * 120, // Espaçar verticalmente
    };

    const novaMesa = {
      id: `temp-${Date.now()}`, // ID temporário
      numero: numero,
      status: 'LIVRE' as const,
      posicao: posicaoInicial,
      tamanho: { width: 80, height: 80 },
      rotacao: 0,
      comanda: undefined,
    };

    setMapa({
      ...mapa,
      mesas: [...mapa.mesas, novaMesa],
    });

    toast.success(`Mesa ${numero} adicionada. Clique em "Salvar Layout" para confirmar.`);
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
    if (!mapa || !ambienteId) return;

    try {
      setSalvando(true);

      // 1. Primeiro, criar mesas temporárias no backend
      const mesasAtualizadas = [...mapa.mesas];
      for (let i = 0; i < mesasAtualizadas.length; i++) {
        const mesa = mesasAtualizadas[i];
        
        // Se é uma mesa temporária, criar no backend primeiro
        if (mesa.id.startsWith('temp-')) {
          try {
            const novaMesa = await createMesa({
              numero: mesa.numero,
              ambienteId: ambienteId,
              posicao: mesa.posicao,
              tamanho: mesa.tamanho,
              rotacao: mesa.rotacao,
            });
            
            // Substituir ID temporário pelo ID real
            mesasAtualizadas[i] = {
              ...mesa,
              id: novaMesa.id,
            };
            
            console.log(`✅ Mesa ${mesa.numero} criada com ID: ${novaMesa.id}`);
          } catch (error) {
            // Se der erro de mesa duplicada, permitir ao usuário escolher outro número
            const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
            if (axiosError.response?.status === 409) {
              const mensagemErro = axiosError.response.data?.message || `A mesa ${mesa.numero} já existe.`;
              toast.error(mensagemErro);
              
              // Perguntar se o usuário quer escolher outro número
              const novoNumero = window.prompt(
                `${mensagemErro}\n\n` +
                `Digite um novo número para esta mesa:`,
                (mesa.numero + 1).toString()
              );
              
              if (novoNumero) {
                const numeroInt = parseInt(novoNumero, 10);
                if (!isNaN(numeroInt) && numeroInt > 0) {
                  // Atualizar número da mesa e tentar novamente
                  mesasAtualizadas[i] = {
                    ...mesa,
                    numero: numeroInt,
                  };
                  
                  // Tentar criar novamente com o novo número
                  try {
                    const novaMesa = await createMesa({
                      numero: numeroInt,
                      ambienteId: ambienteId,
                      posicao: mesa.posicao,
                      tamanho: mesa.tamanho,
                      rotacao: mesa.rotacao,
                    });
                    
                    mesasAtualizadas[i] = {
                      ...mesasAtualizadas[i],
                      id: novaMesa.id,
                    };
                    
                    console.log(`✅ Mesa ${numeroInt} criada com ID: ${novaMesa.id}`);
                  } catch (error2) {
                    toast.error(`Erro ao criar mesa ${numeroInt}. Tente novamente.`);
                    throw error2;
                  }
                } else {
                  toast.error('Número inválido.');
                  throw error;
                }
              } else {
                throw error; // Usuário cancelou
              }
            } else {
              toast.error(`Erro ao criar mesa ${mesa.numero}`);
              throw error;
            }
          }
        }
      }

      // Atualizar estado com IDs reais
      setMapa({
        ...mapa,
        mesas: mesasAtualizadas,
      });

      // 2. Depois, atualizar posição de todas as mesas (agora todas têm ID real)
      for (const mesa of mesasAtualizadas) {
        if (mesa.posicao && !mesa.id.startsWith('temp-')) {
          await mapaService.atualizarPosicaoMesa(mesa.id, {
            posicao: mesa.posicao,
            tamanho: mesa.tamanho,
            rotacao: mesa.rotacao,
          });
        }
      }

      // 3. Salvar posição de cada ponto
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
              <Button onClick={() => toast.info('Pontos de entrega são criados em Admin > Pontos de Entrega')} variant="outline" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                Pontos no Mapa
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

      {/* Mapa em tela cheia */}
      <Card>
        <CardContent className="pt-6">
          <div
            ref={mapaRef}
            className={`border rounded-lg overflow-hidden bg-gray-50 relative mx-auto ${arrastando ? 'cursor-grabbing' : 'cursor-default'}`}
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
                      className={`absolute cursor-grab active:cursor-grabbing bg-blue-500 rounded-lg flex flex-col items-center justify-center text-white font-bold shadow-md hover:ring-2 hover:ring-primary hover:shadow-lg transition-all ${selecionado ? 'ring-4 ring-primary shadow-xl' : ''}`}
                      style={{
                        left: posicao.x,
                        top: posicao.y,
                        width: tamanho.width,
                        height: tamanho.height,
                        transform: `rotate(${mesa.rotacao || 0}deg)`,
                        userSelect: 'none',
                      }}
                    >
                      <span className="text-lg pointer-events-none">M{mesa.numero}</span>
                    </div>
                  );
                })}

                {/* Renderizar Pontos de Entrega */}
                {mapa.pontosEntrega.map((ponto) => {
                  const posicao = ponto.posicao || { x: 100, y: 100 };
                  const selecionado = itemSelecionado?.tipo === 'ponto' && itemSelecionado.id === ponto.id;

                  return (
                    <div
                      key={ponto.id}
                      onMouseDown={(e) => handleMouseDown(e, 'ponto', ponto.id, posicao)}
                      className={`absolute cursor-move bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg hover:ring-4 hover:ring-red-300 hover:scale-110 transition-all group ${selecionado ? 'ring-4 ring-red-400 scale-110' : ''}`}
                      style={{
                        left: posicao.x,
                        top: posicao.y,
                        width: 40,
                        height: 40,
                      }}
                      title={ponto.nome}
                    >
                      <MapPin className="w-6 h-6 pointer-events-none" />
                      
                      {/* Tooltip com nome */}
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {ponto.nome}
                      </div>
                    </div>
                  );
                })}
          </div>
        </CardContent>
      </Card>

      {/* Painel de Propriedades - Compacto */}
      {itemSelecionado && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {mesaSelecionada && `Mesa ${mesaSelecionada.numero} - ${mesaSelecionada.status}`}
              {pontoSelecionado && pontoSelecionado.nome}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mesaSelecionada && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Posição */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Posição X</Label>
                  <Input
                    type="number"
                    value={mesaSelecionada.posicao?.x || 0}
                    onChange={(e) => moverMesa(mesaSelecionada.id, 'x', parseInt(e.target.value))}
                    min={0}
                    max={mapa?.layout.width || 1000}
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Posição Y</Label>
                  <Input
                    type="number"
                    value={mesaSelecionada.posicao?.y || 0}
                    onChange={(e) => moverMesa(mesaSelecionada.id, 'y', parseInt(e.target.value))}
                    min={0}
                    max={mapa?.layout.height || 800}
                    className="h-8"
                  />
                </div>

                {/* Dimensões */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Largura</Label>
                  <Input
                    type="number"
                    value={mesaSelecionada.tamanho?.width || 80}
                    onChange={(e) => redimensionarMesa(mesaSelecionada.id, 'width', parseInt(e.target.value))}
                    min={40}
                    max={200}
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Altura</Label>
                  <Input
                    type="number"
                    value={mesaSelecionada.tamanho?.height || 80}
                    onChange={(e) => redimensionarMesa(mesaSelecionada.id, 'height', parseInt(e.target.value))}
                    min={40}
                    max={200}
                    className="h-8"
                  />
                </div>

                {/* Rotação */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Rotação</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={mesaSelecionada.rotacao || 0}
                      readOnly
                      className="h-8 w-16"
                    />
                    <Button
                      onClick={() => rotacionarMesa(mesaSelecionada.id)}
                      variant="outline"
                      size="sm"
                      className="h-8"
                    >
                      <RotateCw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Remover */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Ações</Label>
                  <Button
                    onClick={() => removerMesa(mesaSelecionada.id)}
                    variant="destructive"
                    size="sm"
                    className="h-8 w-full"
                    disabled={mesaSelecionada.status !== 'LIVRE'}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remover
                  </Button>
                </div>
              </div>
            )}

            {pontoSelecionado && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Posição */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Posição X</Label>
                  <Input
                    type="number"
                    value={pontoSelecionado.posicao?.x || 0}
                    onChange={(e) => moverPonto(pontoSelecionado.id, 'x', parseInt(e.target.value))}
                    min={0}
                    max={mapa?.layout.width || 1000}
                    className="h-8"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Posição Y</Label>
                  <Input
                    type="number"
                    value={pontoSelecionado.posicao?.y || 0}
                    onChange={(e) => moverPonto(pontoSelecionado.id, 'y', parseInt(e.target.value))}
                    min={0}
                    max={mapa?.layout.height || 800}
                    className="h-8"
                  />
                </div>

                {/* Dimensões (somente leitura para pontos) */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Largura</Label>
                  <Input
                    type="number"
                    value={pontoSelecionado.tamanho?.width || 100}
                    readOnly
                    className="h-8 bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Altura</Label>
                  <Input
                    type="number"
                    value={pontoSelecionado.tamanho?.height || 60}
                    readOnly
                    className="h-8 bg-muted"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
