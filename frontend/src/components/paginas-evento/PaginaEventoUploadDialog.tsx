// Caminho: frontend/src/components/paginas-evento/PaginaEventoUploadDialog.tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { PaginaEvento } from '@/types/pagina-evento';
import { uploadPaginaEventoMedia } from '@/services/paginaEventoService';
import { Upload, XCircle, Loader2 } from 'lucide-react';

interface PaginaEventoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  paginaToUpload: PaginaEvento | null; // A página que estamos a editar
}

// ATENÇÃO: Exportação Padrão (default) para facilitar a importação na página principal
export default function PaginaEventoUploadDialog({ open, onOpenChange, onSuccess, paginaToUpload }: PaginaEventoUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // URL para o preview da mídia ATUAL no servidor
  const currentMediaUrl = useMemo(() => {
    // Retorna a URL da imagem atual ou um placeholder
    return paginaToUpload?.urlImagem || '/placeholder-media.png'; 
  }, [paginaToUpload]);

  // Lógica para lidar com a seleção do arquivo
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  }, []);

  // Lógica de submissão do upload
  const handleUpload = async () => {
    if (!paginaToUpload || !selectedFile) {
      toast.error('Selecione um arquivo para continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Chama o serviço de upload que criámos
      await uploadPaginaEventoMedia(paginaToUpload.id, selectedFile);
      
      toast.success('Mídia atualizada com sucesso!');
      setSelectedFile(null); // Limpa o arquivo após o sucesso
      onSuccess(); // Recarrega os dados e fecha o modal
    } catch (err) {
      toast.error('Falha ao fazer o upload da mídia.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFile = () => setSelectedFile(null);

  const title = paginaToUpload ? `Mídia para: ${paginaToUpload.titulo}` : 'Upload de Mídia';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Faça o upload da imagem ou vídeo principal para a página de boas-vindas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Seletor de Arquivo */}
          <div className="flex flex-col space-y-2">
            <Label htmlFor="media-file">Selecionar Arquivo (Imagem/Vídeo)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="media-file"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="flex-1"
                disabled={isSubmitting}
              />
              {selectedFile && (
                <Button variant="ghost" size="icon" onClick={clearFile} disabled={isSubmitting}>
                  <XCircle className="h-5 w-5 text-red-500" />
                </Button>
              )}
            </div>
            {selectedFile && (
                <p className="text-sm text-gray-500 mt-1">Arquivo selecionado: {selectedFile.name}</p>
            )}
          </div>
          
          {/* Preview da Mídia Atual */}
          <div className="mt-4 border rounded-lg p-2 flex flex-col items-center">
            <Label className="mb-2 font-semibold">Mídia Atual</Label>
            {paginaToUpload && paginaToUpload.urlImagem ? (
                // Se o Next.js estiver a correr, isto deverá ser um caminho acessível
                <img src={currentMediaUrl} alt="Mídia Atual" className="max-w-full max-h-40 object-contain rounded" />
            ) : (
                <div className="h-40 w-full flex items-center justify-center bg-gray-100 rounded text-gray-500">
                    <Upload className="h-6 w-6 mr-2"/> Nenhuma mídia definida
                </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleUpload} 
            disabled={!selectedFile || isSubmitting}
          >
            {isSubmitting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A Enviar...
                </>
            ) : (
                'Fazer Upload'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}