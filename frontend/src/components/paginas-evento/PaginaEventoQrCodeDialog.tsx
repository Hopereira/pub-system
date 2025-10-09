// Caminho: frontend/src/components/paginas-evento/PaginaEventoQrCodeDialog.tsx
'use client';

import { useRef } from 'react';
import { PaginaEvento } from '@/types/pagina-evento';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
// ✅ CORREÇÃO: A importação correta usa chaves { }.
import { QRCode } from 'qrcode.react';

interface PaginaEventoQrCodeDialogProps {
  pagina: PaginaEvento | null;
  onClose: () => void;
}

export default function PaginaEventoQrCodeDialog({ pagina, onClose }: PaginaEventoQrCodeDialogProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);

  if (!pagina) {
    return null;
  }

  const url = `${window.location.origin}/evento/${pagina.id}`;

  const handleDownload = () => {
    const canvas = qrCodeRef.current?.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `qrcode-${pagina.titulo}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <Dialog open={!!pagina} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code para "{pagina.titulo}"</DialogTitle>
          <DialogDescription>
            Clientes podem escanear este código para acessar a página de boas-vindas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center p-6" ref={qrCodeRef}>
          <QRCode
            value={url}
            size={256}
            level={"H"}
            includeMargin={true}
          />
        </div>

        <DialogFooter className="sm:justify-between flex-col sm:flex-row gap-2 items-center">
            <p className="text-xs text-muted-foreground break-all">{url}</p>
            <Button onClick={handleDownload} type="button">Baixar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}