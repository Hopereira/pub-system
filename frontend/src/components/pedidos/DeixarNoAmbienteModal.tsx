'use client';

import { useState } from 'react';
import { PackageX, MapPin } from 'lucide-react';
import { deixarNoAmbiente } from '@/services/pedidoService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface DeixarNoAmbienteModalProps {
  itemId: string | null;
  produtoNome?: string;
  localEntrega?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const DeixarNoAmbienteModal = ({
  itemId,
  produtoNome,
  localEntrega,
  open,
  onOpenChange,
  onSuccess,
}: DeixarNoAmbienteModalProps) => {
  const [motivo, setMotivo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!itemId) return;

    try {
      setIsLoading(true);
      logger.log('📦 Deixando item no ambiente', {
        module: 'DeixarNoAmbienteModal',
        data: { itemId, motivo },
      });

      await deixarNoAmbiente(itemId, {
        motivo: motivo.trim() || undefined,
      });

      toast.success('Item marcado como deixado no ambiente!', {
        description: 'O cliente será notificado automaticamente.',
      });

      logger.log('✅ Item deixado no ambiente com sucesso', {
        module: 'DeixarNoAmbienteModal',
      });

      setMotivo('');
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      logger.error('❌ Erro ao deixar item no ambiente', {
        module: 'DeixarNoAmbienteModal',
        error: error as Error,
      });
      toast.error('Falha ao marcar item. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageX className="w-5 h-5 text-orange-600" />
            Deixar no Ambiente
          </DialogTitle>
          <DialogDescription>
            O cliente não foi encontrado no local. O pedido será deixado no ambiente e o cliente
            receberá uma notificação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do Pedido */}
          <Alert>
            <MapPin className="w-4 h-4" />
            <AlertDescription>
              <p className="font-medium">{produtoNome || 'Item do pedido'}</p>
              {localEntrega && (
                <p className="text-sm text-muted-foreground mt-1">
                  Será deixado em: {localEntrega}
                </p>
              )}
            </AlertDescription>
          </Alert>

          {/* Motivo (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo (Opcional)</Label>
            <Textarea
              id="motivo"
              placeholder="Ex: Cliente não estava no local informado, ausente temporariamente..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              Este motivo ficará registrado no sistema
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} variant="destructive">
            {isLoading ? 'Processando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
