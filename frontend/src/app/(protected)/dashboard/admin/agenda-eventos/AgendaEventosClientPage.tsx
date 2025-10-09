'use client';

import { useState, useEffect, useRef } from "react"; 
import { useRouter } from 'next/navigation';
import { Evento } from "@/types/evento";
import { Button } from "@/components/ui/button";
import { PlusCircle, Download, Printer } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { createColumns } from "./columns"; 
import { getAllEventos } from "@/services/eventoService";
import { toast } from "sonner";
import EventoDeleteAlert from "@/components/eventos/EventoDeleteAlert";
import EventoUploadDialog from "@/components/eventos/EventoUploadDialog";

import { QRCodeCanvas } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function AgendaEventosClientPage() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [eventoToDelete, setEventoToDelete] = useState<Evento | null>(null);
  const [eventoToUpload, setEventoToUpload] = useState<Evento | null>(null);
  const [eventoParaQrCode, setEventoParaQrCode] = useState<Evento | null>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);

  const loadEventos = async () => {
    setIsLoading(true);
    try {
      const data = await getAllEventos();
      setEventos(data || []);
    } catch (error) {
      toast.error("Não foi possível carregar a lista de eventos.");
      setEventos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEventos();
  }, []);

  const handleSuccess = () => {
    setEventoToDelete(null);
    setEventoToUpload(null);
    loadEventos();
  };
  
  const handleShowQrCode = (evento: Evento) => {
    setEventoParaQrCode(evento);
  };
  
  const handleDownloadQrCode = () => {
    if (qrCodeRef.current) {
      const canvas = qrCodeRef.current.querySelector('canvas');
      if (canvas) {
        const url = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = `qrcode-${eventoParaQrCode?.titulo.replace(/\s+/g, '-')}.png`;
        link.href = url;
        link.click();
      }
    }
  };
  const handlePrintQrCode = () => window.print();

  const columns = createColumns({
    onEdit: (evento) => router.push(`/dashboard/admin/agenda-eventos/${evento.id}`),
    onDelete: (evento) => setEventoToDelete(evento),
    onUpload: (evento) => setEventoToUpload(evento),
    onShowQrCode: handleShowQrCode,
    onStatusChangeSuccess: loadEventos,
  });

  return (
    <>
      <EventoDeleteAlert
        open={!!eventoToDelete}
        onOpenChange={(isOpen) => !isOpen && setEventoToDelete(null)}
        eventoToDelete={eventoToDelete}
        onSuccess={handleSuccess}
      />

      <EventoUploadDialog
        open={!!eventoToUpload}
        onOpenChange={(isOpen) => !isOpen && setEventoToUpload(null)}
        onSuccess={handleSuccess}
        eventoToUpload={eventoToUpload}
      />

      <Dialog open={!!eventoParaQrCode} onOpenChange={() => setEventoParaQrCode(null)}>
        <DialogContent className="sm:max-w-md print:shadow-none">
          <DialogHeader>
            <DialogTitle>QR Code para "{eventoParaQrCode?.titulo}"</DialogTitle>
            <DialogDescription>
              Aponte a câmara para este código para aceder à página pública do evento.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-8 bg-white" ref={qrCodeRef}>
            <QRCodeCanvas
              value={`${window.location.origin}/evento-publico/${eventoParaQrCode?.id}`}
              size={256}
              includeMargin={true}
            />
          </div>
           <div className="mt-2 text-center text-sm">
            <a
              href={`${window.location.origin}/evento/${eventoParaQrCode?.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline break-all"
            >
              {`${window.location.origin}/evento/${eventoParaQrCode?.id}`}
            </a>
          </div>
          <DialogFooter className="print:hidden pt-4">
            <Button variant="outline" onClick={handlePrintQrCode}>
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
            <Button onClick={handleDownloadQrCode}>
              <Download className="mr-2 h-4 w-4" /> Baixar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="rounded-md border bg-card">
        <div className="p-4 flex justify-end items-center">
          <Button onClick={() => router.push('/dashboard/admin/agenda-eventos/novo')}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Novo Evento
          </Button>
        </div>
        <DataTable columns={columns} data={eventos} isLoading={isLoading} />
      </div>
    </>
  );
}