'use client';

import { useState } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { CreateAgregadoDto } from '@/types/ponto-entrega.dto';
import { updatePontoComanda } from '@/services/pontoEntregaService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PontoEntregaSeletor } from './PontoEntregaSeletor';
import { AgregadosForm } from './AgregadosForm';
import { logger } from '@/lib/logger';

interface MudarLocalModalProps {
  comandaId: string;
  pontoAtualId?: string;
  agregadosAtuais?: CreateAgregadoDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const MudarLocalModal = ({
  comandaId,
  pontoAtualId,
  agregadosAtuais = [],
  open,
  onOpenChange,
  onSuccess,
}: MudarLocalModalProps) => {
  const [pontoSelecionado, setPontoSelecionado] = useState(pontoAtualId || '');
  const [agregados, setAgregados] = useState<CreateAgregadoDto[]>(agregadosAtuais);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!pontoSelecionado) {
      toast.error('Por favor, selecione um ponto de entrega.');
      return;
    }

    try {
      setIsLoading(true);
      logger.log('🔄 Mudando local da comanda', {
        module: 'MudarLocalModal',
        data: { comandaId, pontoId: pontoSelecionado },
      });

      await updatePontoComanda(comandaId, {
        pontoEntregaId: pontoSelecionado,
        agregados: agregados.length > 0 ? agregados : undefined,
      });

      toast.success('Local de retirada atualizado com sucesso!');
      logger.log('✅ Local atualizado', { module: 'MudarLocalModal' });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      logger.error('❌ Erro ao mudar local', {
        module: 'MudarLocalModal',
        error: error as Error,
      });
      toast.error('Falha ao atualizar o local. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Mudar Local de Retirada
          </DialogTitle>
          <DialogDescription>
            Escolha um novo local para retirada dos pedidos desta comanda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Seletor de Ponto */}
          <PontoEntregaSeletor
            selectedPontoId={pontoSelecionado}
            onSelect={setPontoSelecionado}
          />

          {/* Formulário de Agregados */}
          <AgregadosForm agregados={agregados} onChange={setAgregados} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !pontoSelecionado}>
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Confirmar Mudança
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
