'use client';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { abrirComanda } from "@/services/comandaService";
import { Mesa } from "@/types/mesa";
import { useState } from "react";

interface AbrirComandaModalProps {
  mesa: Mesa | null;
  isOpen: boolean;
  onClose: () => void;
  onComandaAberta: (mesaId: string) => void;
}

export function AbrirComandaModal({ mesa, isOpen, onClose, onComandaAberta }: AbrirComandaModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAbrirComanda = async () => {
    if (!mesa) return;

    setIsLoading(true);
    setError(null);
    try {
      await abrirComanda({ mesaId: mesa.id });
      onComandaAberta(mesa.id);
    } catch (err) {
      setError('Não foi possível abrir a comanda. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir Comanda na Mesa {mesa?.numero}</DialogTitle>
          <DialogDescription>
            Confirma a abertura de uma nova comanda para esta mesa?
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleAbrirComanda} disabled={isLoading}>
            {isLoading ? 'A abrir...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}