'use client';

import { useState, useEffect } from 'react';
import { MapPin, Users, UtensilsCrossed } from 'lucide-react';
import { Mesa, MesaStatus } from '@/types/mesa';
import { PontoEntrega } from '@/types/ponto-entrega';
import { getMesas } from '@/services/mesaService';
import { getPontosEntregaAtivos } from '@/services/pontoEntregaService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/lib/logger';

interface LocalComandaSeletorProps {
  onSelectMesa: (mesaId: string) => void;
  onSelectPontoEntrega: (pontoId: string) => void;
  onSelectComandaAvulsa: () => void;
  selectedMesaId?: string;
  selectedPontoId?: string;
  tipoSelecionado?: 'mesa' | 'avulsa';
}

export const LocalComandaSeletor = ({
  onSelectMesa,
  onSelectPontoEntrega,
  onSelectComandaAvulsa,
  selectedMesaId,
  selectedPontoId,
  tipoSelecionado = 'mesa',
}: LocalComandaSeletorProps) => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [pontos, setPontos] = useState<PontoEntrega[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(tipoSelecionado);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [mesasData, pontosData] = await Promise.all([
        getMesas(),
        getPontosEntregaAtivos(),
      ]);

      // Filtrar apenas mesas livres
      const mesasLivres = mesasData.filter((mesa) => mesa.status === MesaStatus.LIVRE);
      setMesas(mesasLivres);
      setPontos(pontosData);

      logger.log(`✅ Dados carregados`, {
        module: 'LocalComandaSeletor',
        data: { mesasLivres: mesasLivres.length, pontos: pontosData.length },
      });
    } catch (error) {
      logger.error('❌ Erro ao carregar dados', {
        module: 'LocalComandaSeletor',
        error: error as Error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'avulsa') {
      onSelectComandaAvulsa();
    }
  };

  const handleMesaSelect = (mesaId: string) => {
    onSelectMesa(mesaId);
    setActiveTab('mesa');
  };

  const handlePontoSelect = (pontoId: string) => {
    onSelectPontoEntrega(pontoId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Carregando opções...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Escolha o Local de Retirada
        </CardTitle>
        <CardDescription>
          Selecione uma mesa disponível ou mantenha comanda avulsa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mesa" className="flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              Mesa
            </TabsTrigger>
            <TabsTrigger value="avulsa" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Comanda Avulsa
            </TabsTrigger>
          </TabsList>

          {/* Tab: Escolher Mesa */}
          <TabsContent value="mesa" className="space-y-3 mt-4">
            {mesas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma mesa disponível no momento
              </div>
            ) : (
              <RadioGroup value={selectedMesaId} onValueChange={handleMesaSelect}>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {mesas.map((mesa) => (
                    <div
                      key={mesa.id}
                      className={`relative flex items-start space-x-3 rounded-lg border p-4 transition-colors ${
                        selectedMesaId === mesa.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value={mesa.id} id={`mesa-${mesa.id}`} className="mt-1" />
                      <div className="flex-1 space-y-1">
                        <Label htmlFor={`mesa-${mesa.id}`} className="cursor-pointer font-medium">
                          Mesa {mesa.numero}
                        </Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {mesa.ambiente?.nome || 'Ambiente não definido'}
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            Livre
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
          </TabsContent>

          {/* Tab: Comanda Avulsa (com Pontos de Entrega) */}
          <TabsContent value="avulsa" className="space-y-3 mt-4">
            {pontos.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum ponto de entrega configurado. A comanda será avulsa.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  Escolha onde deseja retirar seus pedidos:
                </p>
                <RadioGroup value={selectedPontoId} onValueChange={handlePontoSelect}>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {pontos.map((ponto) => (
                      <div
                        key={ponto.id}
                        className={`relative flex items-start space-x-3 rounded-lg border p-4 transition-colors ${
                          selectedPontoId === ponto.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem
                          value={ponto.id}
                          id={`ponto-${ponto.id}`}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={`ponto-${ponto.id}`}
                            className="cursor-pointer font-medium"
                          >
                            {ponto.nome}
                          </Label>
                          {ponto.descricao && (
                            <p className="text-sm text-muted-foreground">{ponto.descricao}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              Preparo: {ponto.ambientePreparo?.nome || 'N/A'}
                            </Badge>
                            {ponto.mesaProxima && (
                              <Badge variant="secondary" className="text-xs">
                                Próximo: Mesa {ponto.mesaProxima.numero}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
