'use client';

import { useState, useEffect } from 'react';
import { MapPin, Info } from 'lucide-react';
import { PontoEntrega } from '@/types/ponto-entrega';
import { getPontosEntregaAtivos } from '@/services/pontoEntregaService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { logger } from '@/lib/logger';

interface PontoEntregaSeletorProps {
  onSelect: (pontoId: string) => void;
  selectedPontoId?: string;
}

export const PontoEntregaSeletor = ({ onSelect, selectedPontoId }: PontoEntregaSeletorProps) => {
  const [pontos, setPontos] = useState<PontoEntrega[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPontos();
  }, []);

  const loadPontos = async () => {
    try {
      setIsLoading(true);
      const data = await getPontosEntregaAtivos();
      setPontos(data);
      logger.log(`✅ ${data.length} pontos de entrega disponíveis`, {
        module: 'PontoEntregaSeletor',
      });
    } catch (error) {
      logger.error('❌ Erro ao carregar pontos', {
        module: 'PontoEntregaSeletor',
        error: error as Error,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Escolha o Local de Retirada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (pontos.length === 0) {
    return (
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          Nenhum ponto de entrega disponível no momento. Por favor, escolha uma mesa.
        </AlertDescription>
      </Alert>
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
          Selecione onde você deseja retirar seus pedidos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedPontoId} onValueChange={onSelect}>
          <div className="space-y-3">
            {pontos.map((ponto) => (
              <div
                key={ponto.id}
                className={`relative flex items-start space-x-3 rounded-lg border p-4 transition-colors ${
                  selectedPontoId === ponto.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
              >
                <RadioGroupItem value={ponto.id} id={ponto.id} className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Label htmlFor={ponto.id} className="cursor-pointer font-medium">
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
      </CardContent>
    </Card>
  );
};
