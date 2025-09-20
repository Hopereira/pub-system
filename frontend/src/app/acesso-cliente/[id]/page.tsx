'use client';

import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useComandaSubscription } from '@/hooks/useComandaSubscription';
import { Button } from '@/components/ui/button';
import { CheckCircle, Volume2 } from 'lucide-react';
import { ComandaStatus } from '@/types/comanda';
import { ItemPedido, Pedido } from '@/types/pedido';

// Interface para garantir que nosso item processado tem a referência ao pedido pai
interface EnrichedItemPedido extends ItemPedido {
    pedido: Pedido;
}

const formatCurrency = (value: number) => {
    if (isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function ComandaClientePage() {
    const params = useParams();
    // Garantimos que comandaId nunca será um array, pegando apenas o primeiro elemento se for o caso
    const comandaId = Array.isArray(params.id) ? params.id[0] : params.id;

    const { comanda, isLoading, error, changedPedidos, audioConsentNeeded, handleAllowAudio } = useComandaSubscription(comandaId);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen bg-slate-50">Carregando comanda...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen bg-slate-50 text-red-500">{error}</div>;
    }

    if (!comanda) {
        return <div className="flex justify-center items-center h-screen bg-slate-50">Comanda não encontrada.</div>;
    }

    // Lógica para tela de comanda PAGA ou FECHADA
    if (comanda.status === ComandaStatus.PAGA || comanda.status === ComandaStatus.FECHADA) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50 p-4">
                <Card className="max-w-md w-full text-center p-6 animate-fade-in">
                    <CardHeader>
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                        <CardTitle className="text-2xl mt-4">Tudo Certo!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Sua comanda foi paga com sucesso. Agradecemos a sua visita!</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Lógica correta para achatar a lista de itens, mantendo a referência ao pedido pai
    const todosOsItens: EnrichedItemPedido[] = 
        comanda.pedidos?.flatMap(pedido => 
            (pedido.itens || []).map(item => ({ ...item, pedido }))
        ) ?? [];

    const itensValidos = todosOsItens.filter(item => item.status !== 'CANCELADO');
    const total = itensValidos.reduce((acc, item) => acc + (Number(item.precoUnitario) * item.quantidade), 0);

    return (
        <div className="bg-slate-50 min-h-screen p-4 sm:p-6 pt-24">
             {audioConsentNeeded && (
                <div className="fixed top-0 left-0 right-0 bg-gray-900 text-white p-3 flex items-center justify-center shadow-lg z-50 animate-fade-in">
                    <p className="mr-4 text-sm sm:text-base">Ativar notificações sonoras?</p>
                    <Button onClick={handleAllowAudio} variant="secondary" size="sm">
                        <Volume2 className="h-5 w-5 mr-2" />
                        Ativar Som
                    </Button>
                </div>
            )}

            <div className="max-w-md mx-auto">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">
                            Sua Comanda - {comanda.mesa ? `Mesa ${comanda.mesa.numero}` : 'Balcão'}
                        </CardTitle>
                        <CardDescription>Acompanhe seus pedidos e o total da sua conta.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <h3 className="font-bold mb-2">Itens Consumidos</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Qtd</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Valor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {itensValidos.map((item, index) => {
                                    const valorItem = (Number(item.precoUnitario) || 0) * (item.quantidade || 0);
                                    return (
                                        <TableRow key={`${item.pedido.id}-${item.id}-${index}`} className={ changedPedidos.has(item.pedido.id) ? 'bg-emerald-100 transition-all duration-500' : 'transition-all duration-500'}>
                                            <TableCell>{item.quantidade}x</TableCell>
                                            <TableCell className="font-medium">{item.produto?.nome ?? 'Produto não encontrado'}</TableCell>
                                            <TableCell><Badge variant="secondary">{(item.status || 'INDEFINIDO').replace('_', ' ')}</Badge></TableCell>
                                            <TableCell className="text-right">{formatCurrency(valorItem)}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
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