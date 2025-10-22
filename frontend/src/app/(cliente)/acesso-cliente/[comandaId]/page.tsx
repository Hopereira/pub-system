// Caminho: app/(cliente)/acesso-cliente/[comandaId]/page.tsx

'use client';

import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useComandaSubscription } from '@/hooks/useComandaSubscription';
import { Button } from '@/components/ui/button';
import { CheckCircle, Volume2, AlertCircle } from 'lucide-react';
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
    
    // ==================================================================
    // ## A CORREÇÃO ESTÁ AQUI ##
    // Alterado de params.id para params.comandaId para seguir o padrão
    const comandaId = Array.isArray(params.comandaId) ? params.comandaId[0] : params.comandaId;
    // ==================================================================

    const { comanda, isLoading, error, changedPedidos, audioConsentNeeded, handleAllowAudio } = useComandaSubscription(comandaId);
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-screen bg-slate-50">Carregando comanda...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen bg-slate-50 text-red-500">{error}</div>;
    }

    if (!comanda) {
        // Adicionando uma verificação para o caso de o comandaId não ser encontrado pelo hook
        if (!comandaId) {
            return <div className="flex justify-center items-center h-screen bg-slate-50 text-red-500">ID da comanda não fornecido.</div>
        }
        return <div className="flex justify-center items-center h-screen bg-slate-50">Comanda não encontrada.</div>;
    }

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

    const todosOsItens: EnrichedItemPedido[] = 
        comanda.pedidos?.flatMap(pedido => 
            (pedido.itens || []).map(item => ({ ...item, pedido }))
        ) ?? [];

    const itensValidos = todosOsItens.filter(item => item.status !== 'CANCELADO');
    const itensDeixadosNoAmbiente = itensValidos.filter(item => item.status === 'DEIXADO_NO_AMBIENTE');
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
                        {/* Alerta de Pedidos Deixados no Ambiente */}
                        {itensDeixadosNoAmbiente.length > 0 && (
                            <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-400 rounded-lg animate-pulse">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-amber-900 text-lg mb-1">
                                            🍽️ Seu Pedido Está Pronto!
                                        </h4>
                                        <p className="text-amber-800 text-sm mb-2">
                                            O garçom não te encontrou no local indicado. Seu pedido foi deixado no seguinte ambiente:
                                        </p>
                                        <div className="bg-white rounded-md p-3 border border-amber-300">
                                            {itensDeixadosNoAmbiente.map((item, idx) => (
                                                <div key={idx} className="mb-2 last:mb-0">
                                                    <p className="font-semibold text-gray-900">
                                                        📍 {item.ambienteRetirada?.nome || 'Ambiente de Preparo'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {item.quantidade}x {item.produto?.nome ?? item.observacao}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-amber-700 text-xs mt-3 font-medium">
                                            💡 Por favor, retire seu pedido no local indicado acima.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

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
                                    // Se não tem produto, é entrada/couvert artístico
                                    const nomeItem = item.produto?.nome ?? (item.observacao || 'Entrada/Couvert Artístico');
                                    return (
                                        <TableRow 
                                            key={`${item.pedido.id}-${item.id}-${index}`} 
                                            className={
                                                item.status === 'DEIXADO_NO_AMBIENTE' 
                                                    ? 'bg-amber-50 border-l-4 border-amber-500 transition-all duration-500'
                                                    : changedPedidos.has(item.pedido.id) 
                                                        ? 'bg-emerald-100 transition-all duration-500' 
                                                        : 'transition-all duration-500'
                                            }
                                        >
                                            <TableCell>{item.quantidade}x</TableCell>
                                            <TableCell className="font-medium">{nomeItem}</TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={item.status === 'DEIXADO_NO_AMBIENTE' ? 'destructive' : 'secondary'}
                                                    className={item.status === 'DEIXADO_NO_AMBIENTE' ? 'animate-pulse' : ''}
                                                >
                                                    {item.status === 'DEIXADO_NO_AMBIENTE' ? '🔔 RETIRAR' : (item.status || 'INDEFINIDO').replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
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