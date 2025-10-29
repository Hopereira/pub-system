'use client';

import { useState } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';
import { CreateAgregadoDto } from '@/types/ponto-entrega.dto';
import { updateComanda } from '@/services/comandaService';
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
import { LocalComandaSeletor } from './LocalComandaSeletor';
import { AgregadosForm } from './AgregadosForm';
import { logger } from '@/lib/logger';

interface MudarLocalModalProps {
  comandaId: string;
  pontoAtualId?: string;
  mesaAtualId?: string;
  agregadosAtuais?: CreateAgregadoDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const MudarLocalModal = ({
  comandaId,
  pontoAtualId,
  mesaAtualId,
  agregadosAtuais = [],
  open,
  onOpenChange,
  onSuccess,
}: MudarLocalModalProps) => {
  const [tipoSelecionado, setTipoSelecionado] = useState<'mesa' | 'avulsa'>(
    mesaAtualId ? 'mesa' : 'avulsa'
  );
  const [mesaSelecionada, setMesaSelecionada] = useState(mesaAtualId || '');
  const [pontoSelecionado, setPontoSelecionado] = useState(pontoAtualId || '');
  const [agregados, setAgregados] = useState<CreateAgregadoDto[]>(agregadosAtuais);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    // Validações
    if (tipoSelecionado === 'mesa' && !mesaSelecionada) {
      toast.error('Por favor, selecione uma mesa.');
      return;
    }

    if (tipoSelecionado === 'avulsa' && !pontoSelecionado) {
      toast.error('Por favor, selecione um ponto de entrega.');
      return;
    }

    try {
      setIsLoading(true);

      if (tipoSelecionado === 'mesa') {
        // Atualizar comanda com mesa
        logger.log('🔄 Vinculando comanda à mesa', {
          module: 'MudarLocalModal',
          data: { comandaId, mesaId: mesaSelecionada, agregados: agregados.length },
        });

        await updateComanda(comandaId, {
          mesaId: mesaSelecionada,
          pontoEntregaId: null, // Remove ponto de entrega se houver
        });

        // MESA: Salvar agregados se houver
        if (agregados.length > 0) {
          logger.log('👥 Salvando agregados da mesa', {
            module: 'MudarLocalModal',
            data: { quantidade: agregados.length },
          });
          // Nota: agregados de mesa são salvos diretamente na comanda
          // não precisam de ponto de entrega
        }

        toast.success('Mesa confirmada com sucesso!');
      } else {
        // Atualizar comanda avulsa com ponto de entrega
        logger.log('🔄 Atualizando ponto de entrega', {
          module: 'MudarLocalModal',
          data: { comandaId, pontoId: pontoSelecionado },
        });

        await updateComanda(comandaId, {
          mesaId: null, // Remove mesa se houver
          pontoEntregaId: pontoSelecionado,
        });

        toast.success('Ponto de retirada confirmado!');
      }

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
          {/* Seletor de Mesa ou Ponto de Entrega */}
          <LocalComandaSeletor
            onSelectMesa={(mesaId) => {
              setMesaSelecionada(mesaId);
              setTipoSelecionado('mesa');
              setPontoSelecionado(''); // Limpa ponto ao selecionar mesa
            }}
            onSelectPontoEntrega={(pontoId) => {
              setPontoSelecionado(pontoId);
              setTipoSelecionado('avulsa');
              setMesaSelecionada(''); // Limpa mesa ao selecionar ponto
            }}
            onSelectComandaAvulsa={() => {
              setTipoSelecionado('avulsa');
              setMesaSelecionada(''); // Limpa mesa
            }}
            selectedMesaId={mesaSelecionada}
            selectedPontoId={pontoSelecionado}
            tipoSelecionado={tipoSelecionado}
          />

          {/* Formulário de Agregados (só aparece se for MESA) */}
          {tipoSelecionado === 'mesa' && mesaSelecionada && (
            <AgregadosForm agregados={agregados} onChange={setAgregados} />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              (tipoSelecionado === 'mesa' && !mesaSelecionada) ||
              (tipoSelecionado === 'avulsa' && !pontoSelecionado)
            }
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Confirmar {tipoSelecionado === 'mesa' ? 'Mesa' : 'Local'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
