// frontend/src/components/eventos/EventoUploadDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Evento } from '@/types/evento';
import { useForm } from 'react-hook-form';
import Image from 'next/image';
import { uploadEventoImagem } from '@/services/eventoService';

interface EventoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  eventoToUpload: Evento | null;
}

export default function EventoUploadDialog({ open, onOpenChange, onSuccess, eventoToUpload }: EventoUploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const form = useForm<{ imagemFile: FileList }>();

  useEffect(() => {
    // Mostra a imagem atual do evento ou limpa o preview quando o modal é aberto/fechado
    setPreviewUrl(eventoToUpload?.urlImagem || null);
    form.reset();
  }, [open, eventoToUpload, form]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Cria uma URL local para a pré-visualização da imagem selecionada
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: { imagemFile: FileList }) => {
    if (!eventoToUpload || !data.imagemFile || data.imagemFile.length === 0) {
      toast.error("Por favor, selecione uma imagem.");
      return;
    }

    const file = data.imagemFile[0];
    setIsUploading(true);
    try {
      // Usa a nova função do nosso serviço
      await uploadEventoImagem(eventoToUpload.id, file);
      toast.success("Imagem do evento atualizada com sucesso!");
      onSuccess();
    } catch (error) {
      toast.error("Falha ao enviar a imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar Imagem para "{eventoToUpload?.titulo}"</DialogTitle>
          <DialogDescription>
            Selecione uma imagem para o evento. Ela substituirá a imagem atual, se houver.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="imagemFile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ficheiro da Imagem</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                      onChange={(e) => {
                        // Conecta o input do ficheiro ao formulário e ao nosso handler de preview
                        field.onChange(e.target.files);
                        handleFileChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {previewUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Pré-visualização:</p>
                <div className="relative w-full h-48 rounded-md overflow-hidden">
                    <Image src={previewUrl} alt="Preview" layout="fill" className="object-cover" />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A Enviar...</> : 'Enviar Imagem'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}