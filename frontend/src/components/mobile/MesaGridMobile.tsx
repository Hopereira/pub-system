'use client';

import { useState } from 'react';
import { Mesa } from '@/types/mesa';
import { cn } from '@/lib/utils';
import { Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface MesaGridMobileProps {
  mesas: Mesa[];
  onOpenComanda?: (mesa: Mesa) => void;
  onRepeatOrder?: (mesa: Mesa) => void;
  onCloseTable?: (mesa: Mesa) => void;
}

export function MesaGridMobile({ 
  mesas, 
  onOpenComanda,
  onRepeatOrder,
  onCloseTable 
}: MesaGridMobileProps) {
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);

  const getMesaStatusColor = (status: string) => {
    switch (status) {
      case 'LIVRE':
        return 'bg-green-100 border-green-400 text-green-800';
      case 'OCUPADA':
        return 'bg-orange-100 border-orange-400 text-orange-800';
      case 'RESERVADA':
        return 'bg-blue-100 border-blue-400 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  const getMesaStatusIcon = (status: string) => {
    switch (status) {
      case 'LIVRE':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'OCUPADA':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'RESERVADA':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Grid de Mesas - Mobile Optimized */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {mesas.map((mesa) => (
          <button
            key={mesa.id}
            onClick={() => setSelectedMesa(mesa)}
            className={cn(
              'aspect-square rounded-xl border-2 transition-all',
              'active:scale-95 shadow-sm',
              'flex flex-col items-center justify-center',
              'relative overflow-hidden',
              getMesaStatusColor(mesa.status)
            )}
          >
            {/* Número da Mesa */}
            <div className="text-2xl font-bold mb-1">
              {mesa.numero}
            </div>

            {/* Ícone de Status */}
            <div className="mb-1">
              {getMesaStatusIcon(mesa.status)}
            </div>

            {/* Ambiente */}
            <div className="text-[10px] opacity-75 truncate px-1">
              {mesa.ambiente?.nome || 'Salão'}
            </div>

            {/* Badge de Status */}
            {mesa.status === 'OCUPADA' && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Sheet (Modal) de Ações da Mesa */}
      <Sheet open={!!selectedMesa} onOpenChange={(open) => !open && setSelectedMesa(null)}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          {selectedMesa && (
            <>
              <SheetHeader>
                <SheetTitle className="text-2xl">
                  Mesa {selectedMesa.numero}
                </SheetTitle>
                <SheetDescription>
                  {selectedMesa.ambiente?.nome} • {selectedMesa.status}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-3 mt-6 pb-6">
                {selectedMesa.status === 'LIVRE' && (
                  <Button 
                    className="w-full h-14 text-lg"
                    onClick={() => {
                      onOpenComanda?.(selectedMesa);
                      setSelectedMesa(null);
                    }}
                  >
                    Abrir Comanda
                  </Button>
                )}

                {selectedMesa.status === 'OCUPADA' && (
                  <>
                    <Button 
                      className="w-full h-14 text-lg"
                      variant="default"
                      onClick={() => {
                        onRepeatOrder?.(selectedMesa);
                        setSelectedMesa(null);
                      }}
                    >
                      Adicionar Pedido
                    </Button>
                    <Button 
                      className="w-full h-14 text-lg"
                      variant="outline"
                      onClick={() => {
                        onRepeatOrder?.(selectedMesa);
                        setSelectedMesa(null);
                      }}
                    >
                      Repetir Rodada
                    </Button>
                    <Button 
                      className="w-full h-14 text-lg"
                      variant="destructive"
                      onClick={() => {
                        onCloseTable?.(selectedMesa);
                        setSelectedMesa(null);
                      }}
                    >
                      Encerrar Mesa
                    </Button>
                  </>
                )}

                <Button 
                  className="w-full h-12"
                  variant="ghost"
                  onClick={() => setSelectedMesa(null)}
                >
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
