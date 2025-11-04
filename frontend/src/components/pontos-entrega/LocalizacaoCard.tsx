'use client';

import { MapPin, Table, Users } from 'lucide-react';
import { Comanda } from '@/types/comanda';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface LocalizacaoCardProps {
  comanda: Comanda;
  showAgregados?: boolean;
}

export const LocalizacaoCard = ({ comanda, showAgregados = true }: LocalizacaoCardProps) => {
  const temPontoEntrega = !!comanda.pontoEntrega;
  const temMesa = !!comanda.mesa;
  const temAgregados = comanda.agregados && comanda.agregados.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {temPontoEntrega ? (
            <>
              <MapPin className="w-5 h-5" />
              Localização do Pedido
            </>
          ) : (
            <>
              <Table className="w-5 h-5" />
              Mesa
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Ponto de Entrega */}
        {temPontoEntrega && comanda.pontoEntrega && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Ponto de Retirada:</span>
              <Badge variant="default">{comanda.pontoEntrega.nome}</Badge>
            </div>

            {comanda.pontoEntrega.descricao && (
              <p className="text-sm text-muted-foreground">
                {comanda.pontoEntrega.descricao}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {comanda.pontoEntrega.ambientePreparo && (
                <span>Preparo: {comanda.pontoEntrega.ambientePreparo.nome}</span>
              )}
              {comanda.pontoEntrega.mesaProxima && (
                <span>Ref: Mesa {comanda.pontoEntrega.mesaProxima.numero}</span>
              )}
            </div>
          </div>
        )}

        {/* Mesa */}
        {temMesa && comanda.mesa && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Mesa:</span>
              <Badge variant="default">Mesa {comanda.mesa.numero}</Badge>
            </div>
            {comanda.mesa.ambiente && (
              <p className="text-sm text-muted-foreground">
                Ambiente: {comanda.mesa.ambiente.nome}
              </p>
            )}
          </div>
        )}

        {/* Agregados */}
        {showAgregados && temAgregados && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="w-4 h-4" />
                Acompanhantes ({comanda.agregados?.length})
              </div>
              <div className="space-y-1">
                {comanda.agregados?.map((agregado, index) => (
                  <div
                    key={agregado.id || index}
                    className="text-sm flex items-center justify-between p-2 bg-muted rounded"
                  >
                    <span>{agregado.nome}</span>
                    {agregado.cpf && (
                      <span className="text-muted-foreground text-xs">
                        CPF: {agregado.cpf}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Mensagem se não tiver nada */}
        {!temPontoEntrega && !temMesa && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma localização definida
          </p>
        )}
      </CardContent>
    </Card>
  );
};
