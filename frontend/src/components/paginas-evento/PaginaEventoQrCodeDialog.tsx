// Caminho: frontend/src/components/paginas-evento/PaginaEventoQrCodeDialog.tsx
'use client';

import { useRef } from 'react';
import { PaginaEvento } from '@/types/pagina-evento';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
// ✅ 1. Importar a NOVA biblioteca. A sintaxe é diferente.
import QRCode from "react-qr-code";

interface PaginaEventoQrCodeDialogProps {
  pagina: PaginaEvento | null;
  onClose: () => void;
}

export default function PaginaEventoQrCodeDialog({ pagina, onClose }: PaginaEventoQrCodeDialogProps) {
  if (!pagina) {
    return null;
  }

  const url = `${window.location.origin}/evento/${pagina.id}`;

  // A função de download continua a funcionar, mas agora pega o SVG
  const handleDownload = () => {
    const svg = document.getElementById("QRCodeSvg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `qrcode-${pagina.titulo}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
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

        {/* ✅ 2. Usar o NOVO componente. Ele é responsivo. */}
        <div className="p-6 bg-white flex justify-center">
          <QRCode
            id="QRCodeSvg" // Adicionamos um ID para o download funcionar
            value={url}
            size={256}
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