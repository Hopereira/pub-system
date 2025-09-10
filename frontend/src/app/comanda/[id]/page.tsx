// Caminho: frontend/src/app/comanda/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Comanda } from '@/types/comanda';
import { getPublicComandaById } from '@/services/comandaService';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BellRing, CheckCircle2 } from 'lucide-react'; // Importar novo ícone

// ... (Componente LoadingSkeleton e função formatCurrency permanecem os mesmos) ...
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};
const LoadingSkeleton = () => ( <div className="max-w-md mx-auto"><Card><CardHeader className="text-center"><Skeleton className="h-8 w-3/4 mx-auto" /><Skeleton className="h-4 w-1/2 mx-auto mt-2" /></CardHeader><CardContent><h3 className="font-bold mb-2 text-lg">Itens Consumidos</h3><div className="space-y-4"><div className="flex justify-between items-center"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-5 w-1/4" /></div><div className="flex justify-between items-center"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-5 w-1/4" /></div><div className="flex justify-between items-center"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-5 w-1/4" /></div></div><div className="mt-4 pt-4 border-t-2"><Skeleton className="h-8 w-full" /></div></CardContent></Card></div> );


export default function ComandaClientePage() {
  const params = useParams();
  const comandaId = params.id as string;

  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedPids, setHighlightedPids] = useState<Set<string>>(new Set());
  const [audioEnabled, setAudioEnabled] = useState(false);
  const notificationSound = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    notificationSound.current = new Audio('/notification.mp3');
  }, []);

  const handleEnableAudio = () => {
    setAudioEnabled(true);
    notificationSound.current?.play().catch(e => console.error("Erro ao ativar áudio:", e));
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (comandaId) {
      const fetchComanda = async () => {
        try {
          const newData = await getPublicComandaById(comandaId);

          // NOVO: Se a comanda estiver PAGA, paramos de atualizar.
          if (newData.status === 'PAGA') {
            setComanda(newData);
            if (intervalId) clearInterval(intervalId);
            return; // Interrompe a execução para não comparar status
          }

          if (comanda && notificationSound.current) {
            const oldStatusMap = new Map(comanda.pedidos.map(p => [p.id, p.status]));
            const newHighlightedPids = new Set<string>();
            let soundPlayed = false;

            newData.pedidos.forEach(newPedido => {
              const oldStatus = oldStatusMap.get(newPedido.id);
              if (oldStatus && oldStatus !== newPedido.status) {
                newHighlightedPids.add(newPedido.id);
                if (audioEnabled && !soundPlayed) {
                  notificationSound.current?.play().catch(e => console.error("Erro ao tocar áudio:", e));
                  soundPlayed = true;
                }
              }
            });

            if (newHighlightedPids.size > 0) {
              setHighlightedPids(newHighlightedPids);
              setTimeout(() => setHighlightedPids(new Set()), 2000);
            }
          }
          
          setComanda(newData);
          setError(null);
        } catch (err) {
          setError('Comanda não encontrada ou encerrada.');
          if (intervalId) clearInterval(intervalId);
        } finally {
          setIsLoading(false);
        }
      };

      fetchComanda(); 
      intervalId = setInterval(fetchComanda, 10000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [comandaId, comanda, audioEnabled]);

  if (isLoading) { return <div className="bg-slate-50 min-h-screen p-4 sm:p-6"><LoadingSkeleton /></div>; }
  if (error && !comanda) { return <div className="flex justify-center items-center h-screen bg-slate-50 text-red-500 text-center p-4">{error}</div>; }
  if (!comanda) { return null; }
  
  // NOVO: Se a comanda estiver paga, mostramos uma mensagem de sucesso
  if (comanda.status === 'PAGA') {
    return (
      <div className="bg-slate-50 min-h-screen p-4 sm:p-6 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
            <Card>
                <CardContent className="p-8">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Conta Paga!</h1>
                    <p className="text-muted-foreground mt-2">Obrigado pela sua visita e volte sempre!</p>
                </CardContent>
            </Card>
        </div>
      </div>
    );
  }

  const todosOsItens = comanda.pedidos?.flatMap(pedido => pedido.itens.map(item => ({ ...item, pedidoStatus: pedido.status, pedidoId: pedido.id })) ) ?? [];
  const total = comanda.pedidos?.filter(pedido => pedido.status !== 'CANCELADO').reduce((acc, pedido) => acc + (Number(pedido.total) || 0), 0) ?? 0;

  return (
    <div className="bg-slate-50 min-h-screen p-4 sm-p-6">
      <div className="max-w-md mx-auto">
        {!audioEnabled && (
            <Card className="mb-4 bg-blue-50 border-blue-200"><CardContent className="p-3 flex items-center justify-between"><p className="text-sm text-blue-800">Ativar notificações sonoras?</p><Button onClick={handleEnableAudio} size="sm"><BellRing className="h-4 w-4 mr-2" /> Ativar</Button></CardContent></Card>
        )}

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sua Comanda - {comanda.mesa ? `Mesa ${comanda.mesa.numero}` : 'Balcão'}</CardTitle>
            <CardDescription>Acompanhe seus pedidos e o total da sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="font-bold mb-2 text-lg">Itens Consumidos</h3>
            <div className="border rounded-md">
              <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
                <TableBody>
                  {todosOsItens.map(item => (
                    <TableRow key={`${item.pedidoId}-${item.id}`} className={cn(item.pedidoStatus === 'CANCELADO' ? 'text-muted-foreground line-through' : '', highlightedPids.has(item.pedidoId) ? 'highlight-row' : '')}>
                      <TableCell className="font-medium">{item.quantidade}x {item.produto.nome}</TableCell>
                      <TableCell><Badge variant={item.pedidoStatus === 'CANCELADO' ? 'outline' : 'secondary'}>{item.pedidoStatus.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="text-right">{formatCurrency(item.precoUnitario * item.quantidade)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 pt-4 border-t-2 font-bold text-xl flex justify-between">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}