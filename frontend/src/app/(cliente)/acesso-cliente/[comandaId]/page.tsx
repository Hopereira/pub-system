// Caminho: app/(cliente)/acesso-cliente/[comandaId]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useComandaSubscription } from '@/hooks/useComandaSubscription';
import { Button } from '@/components/ui/button';
import { CheckCircle, Volume2, AlertCircle, MapPin, RefreshCw } from 'lucide-react';
import { ComandaStatus } from '@/types/comanda';
import { MudarLocalModal } from '@/components/pontos-entrega/MudarLocalModal';
import ModalAvaliacao from '@/components/avaliacao/ModalAvaliacao';

// Interface para garantir que nosso item processado tem a referência ao pedido pai
interface EnrichedItemPedido {
    id: string;
    quantidade: number;
    observacao?: string | null;
    produto: { id: string; nome: string; };
    precoUnitario: number;
    pedidoId: string;
    status?: string;
    ambienteRetirada?: { id: string; nome: string; };
    pedido: { id: string };
}

const formatCurrency = (value: number) => {
    if (isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function ComandaClientePage() {
    const params = useParams();
    const router = useRouter();
    
    // ==================================================================
    // ## A CORREÇÃO ESTÁ AQUI ##
    // Alterado de params.id para params.comandaId para seguir o padrão
    const comandaId = Array.isArray(params.comandaId) ? params.comandaId[0] : params.comandaId;
    // ==================================================================

    const { comanda, isLoading, error, changedPedidos, audioConsentNeeded, handleAllowAudio } = useComandaSubscription(comandaId ?? null);
    const [isLocalModalOpen, setIsLocalModalOpen] = useState(false);
    const [isAvaliacaoModalOpen, setIsAvaliacaoModalOpen] = useState(false);
    const [avaliacaoJaExibida, setAvaliacaoJaExibida] = useState(false);

    // Abre modal de avaliação quando comanda é paga/fechada
    useEffect(() => {
        if (comanda && (comanda.status === ComandaStatus.PAGA || comanda.status === ComandaStatus.FECHADA) && !avaliacaoJaExibida) {
            // Aguarda 1 segundo para exibir o modal
            const timer = setTimeout(() => {
                setIsAvaliacaoModalOpen(true);
                setAvaliacaoJaExibida(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [comanda, avaliacaoJaExibida]);
    
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
            <>
                <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
                    <Card className="max-w-md w-full text-center p-8 animate-fade-in shadow-2xl border-0">
                        <CardHeader className="pb-2">
                            <div className="mx-auto h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                            </div>
                            <CardTitle className="text-3xl font-bold text-green-800">Tudo Certo!</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-lg text-gray-600">
                                Sua comanda foi paga com sucesso. Agradecemos a sua visita!
                            </p>
                            <div className="py-6">
                                <p className="text-2xl font-semibold text-primary">
                                    🍻 Volte Sempre! 🍻
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Modal de Avaliação */}
                {comandaId && (
                    <ModalAvaliacao
                        isOpen={isAvaliacaoModalOpen}
                        onClose={() => setIsAvaliacaoModalOpen(false)}
                        comandaId={comandaId}
                        onSuccess={() => {
                            // Opcional: redirecionar após avaliação
                        }}
                    />
                )}
            </>
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
                            {comanda.cliente ? (
                                <>
                                    {comanda.cliente.nome}
                                    {comanda.mesa && <span className="text-muted-foreground"> - Mesa {comanda.mesa.numero}</span>}
                                </>
                            ) : (
                                `Sua Comanda - ${comanda.mesa ? `Mesa ${comanda.mesa.numero}` : 'Balcão'}`
                            )}
                        </CardTitle>
                        <CardDescription>Acompanhe seus pedidos e o total da sua conta.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Seção de Local de Entrega */}
                        {(comanda.mesa || comanda.pontoEntrega) && (
                            <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-blue-900 text-base mb-1">
                                            📦 Local de Entrega
                                        </h4>
                                        <p className="text-blue-800 text-sm mb-2">
                                            Seus pedidos serão entregues em:
                                        </p>
                                        <div className="bg-white rounded-md p-3 border border-blue-300 mb-3">
                                            <p className="font-bold text-blue-900 text-lg">
                                                {comanda.mesa 
                                                    ? `Mesa ${comanda.mesa.numero}` 
                                                    : comanda.pontoEntrega?.nome
                                                }
                                            </p>
                                            {comanda.pontoEntrega?.descricao && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {comanda.pontoEntrega.descricao}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsLocalModalOpen(true)}
                                            className="w-full"
                                        >
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Mudar Local de Entrega
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                                <div key={idx} className="mb-3 last:mb-0 pb-3 last:pb-0 border-b last:border-b-0 border-amber-200">
                                                    <div className="flex items-start gap-2 mb-1">
                                                        <span className="text-lg">📍</span>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-amber-900 text-base">
                                                                {item.ambienteRetirada?.nome || 'Ambiente de Preparo'}
                                                            </p>
                                                            <p className="text-sm text-gray-700 font-medium mt-1">
                                                                {item.quantidade}x {item.produto?.nome ?? item.observacao}
                                                            </p>
                                                        </div>
                                                    </div>
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

            {comandaId && (
                <MudarLocalModal
                    comandaId={comandaId}
                    pontoAtualId={comanda.pontoEntrega?.id}
                    mesaAtualId={comanda.mesa?.id}
                    agregadosAtuais={comanda.agregados}
                    open={isLocalModalOpen}
                    onOpenChange={setIsLocalModalOpen}
                    onSuccess={async () => {
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}