'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
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
import { createAvaliacao } from '@/services/avaliacaoService';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface ModalAvaliacaoProps {
  isOpen: boolean;
  onClose: () => void;
  comandaId: string;
  onSuccess?: () => void;
}

export default function ModalAvaliacao({
  isOpen,
  onClose,
  comandaId,
  onSuccess,
}: ModalAvaliacaoProps) {
  const [nota, setNota] = useState<number>(0);
  const [notaHover, setNotaHover] = useState<number>(0);
  const [comentario, setComentario] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (nota === 0) {
      toast.error('Por favor, selecione uma nota');
      return;
    }

    try {
      setIsSubmitting(true);
      await createAvaliacao({
        comandaId,
        nota,
        comentario: comentario.trim() || undefined,
      });

      logger.log('✅ Avaliação enviada com sucesso', {
        module: 'ModalAvaliacao',
        data: { comandaId, nota },
      });

      toast.success('Obrigado pela sua avaliação! 🎉');
      
      if (onSuccess) {
        onSuccess();
      }
      
      handleClose();
    } catch (error: any) {
      logger.error('Erro ao enviar avaliação', {
        module: 'ModalAvaliacao',
        error: error as Error,
      });

      if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Esta comanda já foi avaliada');
      } else {
        toast.error('Erro ao enviar avaliação. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNota(0);
    setNotaHover(0);
    setComentario('');
    onClose();
  };

  const renderStars = () => {
    return (
      <div className="flex justify-center gap-2 my-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setNota(star)}
            onMouseEnter={() => setNotaHover(star)}
            onMouseLeave={() => setNotaHover(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              className={`h-12 w-12 ${
                star <= (notaHover || nota)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getNotaTexto = () => {
    switch (nota) {
      case 1:
        return 'Muito Insatisfeito 😞';
      case 2:
        return 'Insatisfeito 😕';
      case 3:
        return 'Regular 😐';
      case 4:
        return 'Satisfeito 😊';
      case 5:
        return 'Muito Satisfeito 🤩';
      default:
        return 'Selecione sua avaliação';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            Como foi sua experiência?
          </DialogTitle>
          <DialogDescription className="text-center">
            Sua opinião é muito importante para nós! 💚
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Estrelas */}
          {renderStars()}

          {/* Texto da nota */}
          <p className="text-center text-lg font-medium mb-6">
            {getNotaTexto()}
          </p>

          {/* Comentário */}
          <div className="space-y-2">
            <label htmlFor="comentario" className="text-sm font-medium">
              Deixe um comentário (opcional)
            </label>
            <Textarea
              id="comentario"
              placeholder="Conte-nos mais sobre sua experiência..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comentario.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Agora Não
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || nota === 0}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
