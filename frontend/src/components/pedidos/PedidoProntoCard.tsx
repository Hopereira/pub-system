'use client';

import { Clock, MapPin, Table, Users, PackageX, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ItemPedido {
  id: string;
  produto: {
    nome: string;
  };
  quantidade: number;
  observacao?: string;
}

interface LocalInfo {
  tipo: 'MESA' | 'PONTO_ENTREGA';
  mesa?: {
    numero: number;
    ambiente: string;
  };
  pontoEntrega?: {
    nome: string;
    mesaProxima?: number;
    ambientePreparo: string;
  };
}

interface PedidoProntoCardProps {
  pedidoId: string;
  comandaId: string;
  cliente: string;
  local: LocalInfo;
  itens: ItemPedido[];
  tempoEspera: string;
  data: Date;
  onDeixarNoAmbiente: (itemId: string) => void;
  onMarcarEntregue: (itemId: string) => void;
  isDestacado?: boolean;
}

export const PedidoProntoCard = ({
  pedidoId,
  comandaId,
  cliente,
  local,
  itens,
  tempoEspera,
  data,
  onDeixarNoAmbiente,
  onMarcarEntregue,
  isDestacado = false,
}: PedidoProntoCardProps) => {
  const isMesa = local.tipo === 'MESA';
  const isPontoEntrega = local.tipo === 'PONTO_ENTREGA';

  return (
    <Card className={`overflow-hidden border-l-4 ${isDestacado ? 'border-l-blue-500 bg-blue-50' : 'border-l-green-500'}`}>
      <CardHeader className="pb-3">
        {isDestacado && (
          <Badge className="mb-2 bg-blue-500 animate-pulse">
            📍 Local Atualizado!
          </Badge>
        )}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {isMesa && (
                <>
                  <Table className="w-4 h-4 inline mr-2" />
                  Mesa {local.mesa?.numero}
                </>
              )}
              {isPontoEntrega && (
                <>
                  <MapPin className="w-4 h-4 inline mr-2" />
                  {local.pontoEntrega?.nome}
                </>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-3 h-3" />
              {cliente}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="default" className="bg-green-600">
              PRONTO
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {tempoEspera}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações de Localização */}
        <div className="p-3 bg-muted rounded-lg space-y-2">
          <p className="text-sm font-medium">Local de Entrega:</p>
          {isMesa && local.mesa && (
            <div className="text-sm text-muted-foreground">
              Mesa {local.mesa.numero} - {local.mesa.ambiente}
            </div>
          )}
          {isPontoEntrega && local.pontoEntrega && (
            <div className="space-y-1">
              <div className="text-sm font-medium">{local.pontoEntrega.nome}</div>
              <div className="text-xs text-muted-foreground space-x-2">
                <span>Preparo: {local.pontoEntrega.ambientePreparo}</span>
                {local.pontoEntrega.mesaProxima && (
                  <span>• Próx: Mesa {local.pontoEntrega.mesaProxima}</span>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Lista de Itens */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Itens do Pedido ({itens.length}):</p>
          <div className="space-y-2">
            {itens.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-2 bg-background border rounded"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.quantidade}x
                    </Badge>
                    <span className="text-sm font-medium">{item.produto.nome}</span>
                  </div>
                  {item.observacao && (
                    <p className="text-xs text-muted-foreground mt-1 ml-10">
                      Obs: {item.observacao}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      console.log('Botão Entregar clicado:', item.id);
                      onMarcarEntregue(item.id);
                    }}
                    className="bg-green-600 hover:bg-green-700 min-w-[40px]"
                    title="Marcar como entregue"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Botão Deixar no Ambiente clicado:', item.id);
                      onDeixarNoAmbiente(item.id);
                    }}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-300 min-w-[40px]"
                    title="Deixar no ambiente (cliente não encontrado)"
                  >
                    <PackageX className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer com informações adicionais */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>Pedido: {pedidoId.slice(0, 8)}...</span>
          <span>Comanda: {comandaId.slice(0, 8)}...</span>
        </div>
      </CardContent>
    </Card>
  );
};
