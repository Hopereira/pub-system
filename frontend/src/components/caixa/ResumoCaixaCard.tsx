'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, Lock, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { ResumoCaixa } from '@/types/caixa';

interface ResumoCaixaCardProps {
  resumoCaixa: ResumoCaixa | null;
  temCaixaAberto: boolean;
  onAbrirCaixa: () => void;
  onFecharCaixa: () => void;
  onRegistrarSangria: () => void;
}

export function ResumoCaixaCard({
  resumoCaixa,
  temCaixaAberto,
  onAbrirCaixa,
  onFecharCaixa,
  onRegistrarSangria,
}: ResumoCaixaCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!temCaixaAberto) {
    return (
      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Caixa Fechado
          </CardTitle>
          <CardDescription>
            Abra o caixa para iniciar as operações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onAbrirCaixa} className="w-full" size="lg">
            <Wallet className="h-4 w-4 mr-2" />
            Abrir Caixa
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!resumoCaixa) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-green-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-600" />
            Caixa Aberto
          </CardTitle>
          <Badge variant="default" className="bg-green-600">
            Em Operação
          </Badge>
        </div>
        <CardDescription>
          Abertura: {formatTime(resumoCaixa.abertura.dataAbertura)} por {resumoCaixa.abertura.funcionarioNome}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas Principais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Vendas</span>
            </div>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(resumoCaixa.totalVendas)}
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-medium">Sangrias</span>
            </div>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(resumoCaixa.totalSangrias)}
            </p>
          </div>
        </div>

        {/* Saldo Atual */}
        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">Saldo Atual</span>
            </div>
            <span className="text-2xl font-bold">
              {formatCurrency(resumoCaixa.saldoFinal)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Valor inicial: {formatCurrency(resumoCaixa.abertura.valorInicial)} + 
            Vendas: {formatCurrency(resumoCaixa.totalVendas)} - 
            Sangrias: {formatCurrency(resumoCaixa.totalSangrias)}
          </p>
        </div>

        {/* Resumo por Forma de Pagamento */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Por Forma de Pagamento</h4>
          <div className="space-y-1">
            {resumoCaixa.resumoPorFormaPagamento
              .filter(item => item.valorEsperado > 0)
              .map((item) => (
                <div key={item.formaPagamento} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.formaPagamento === 'DINHEIRO' ? '💵' : 
                     item.formaPagamento === 'PIX' ? '📱' :
                     item.formaPagamento === 'DEBITO' ? '💳' :
                     item.formaPagamento === 'CREDITO' ? '💳' : '🎫'} {item.formaPagamento}
                  </span>
                  <span className="font-medium">{formatCurrency(item.valorEsperado)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Ações */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onRegistrarSangria}
            className="w-full"
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Sangria
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={onFecharCaixa}
            className="w-full"
          >
            <Lock className="h-4 w-4 mr-2" />
            Fechar Caixa
          </Button>
        </div>

        {/* Informações Adicionais */}
        {resumoCaixa.sangrias.length > 0 && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {resumoCaixa.sangrias.length} sangria(s) realizada(s) neste turno
          </div>
        )}
      </CardContent>
    </Card>
  );
}
