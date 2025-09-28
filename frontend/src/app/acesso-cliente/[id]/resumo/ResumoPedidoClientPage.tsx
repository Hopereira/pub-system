// Caminho: frontend/src/app/acesso-cliente/[id]/resumo/ResumoPedidoClientPage.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
// AINDA VAMOS CRIAR ESTA FUNÇÃO NO PRÓXIMO PASSO
import { createPedidoFromCliente } from '@/services/pedidoService'; 

// A mesma tipagem que usamos na página do cardápio
interface CarrinhoItem {
    produtoId: string;
    nome: string;
    preco: number;
    quantidade: number;
    observacao?: string;
}

const formatCurrency = (value: number) => {
    if (isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function ResumoPedidoClientPage() {
    const [carrinho, setCarrinho] = useState<CarrinhoItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();
    const params = useParams();
    const comandaId = params.id as string;

    useEffect(() => {
        try {
            const carrinhoString = sessionStorage.getItem('carrinho');
            if (carrinhoString) {
                const carrinhoSalvo = JSON.parse(carrinhoString);
                setCarrinho(carrinhoSalvo);
            } else {
                // Se não houver carrinho, talvez o usuário tenha chegado aqui por engano.
                toast.error("Nenhum item no carrinho para confirmar.");
                router.back();
            }
        } catch (error) {
            toast.error("Falha ao carregar os itens do seu pedido.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    const handleSendPedido = async () => {
        setIsSubmitting(true);
        try {
            // Formata os dados para o formato que o backend espera (CreatePedidoDto)
            const pedidoData = {
                comandaId,
                itens: carrinho.map(item => ({
                    produtoId: item.produtoId,
                    quantidade: item.quantidade,
                    observacao: item.observacao,
                })),
            };

            await createPedidoFromCliente(pedidoData);

            toast.success("Pedido enviado para o preparo");
            sessionStorage.removeItem('carrinho'); // Limpa o carrinho após o sucesso
            
            // Redireciona para a página de acompanhamento
            router.push(`/acesso-cliente/${comandaId}`);

        } catch (error) {
            toast.error("Não foi possível enviar o seu pedido. Tente novamente.");
            console.error(error);
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Carregando resumo...</div>;
    }

    const total = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

    return (
        <div className="bg-slate-50 min-h-screen p-4 sm:p-6 flex justify-center items-center">
            <Card className="max-w-lg w-full animate-fade-in">
                <CardHeader>
                    <CardTitle className="text-2xl">Revise seu Pedido</CardTitle>
                    <CardDescription>Confira os itens abaixo antes de ir para o preparo</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Qtd</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {carrinho.map((item) => (
                                <TableRow key={item.produtoId}>
                                    <TableCell>{item.quantidade}x</TableCell>
                                    <TableCell>
                                        <p className="font-medium">{item.nome}</p>
                                        {item.observacao && (
                                            <p className="text-sm text-gray-500 italic">Obs: {item.observacao}</p>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.preco * item.quantidade)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="mt-4 pt-4 border-t-2 font-bold text-xl flex justify-between">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar e Editar
                    </Button>
                    <Button onClick={handleSendPedido} disabled={isSubmitting} className="w-full sm:flex-1">
                        <ChefHat className="h-4 w-4 mr-2" />
                        {isSubmitting ? 'Enviando...' : 'Enviar para o Preparo'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}