'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  User,
  Calendar,
  FileText,
  Receipt,
  CreditCard
} from 'lucide-react';
import caixaService from '@/services/caixaService';
import { ResumoCaixa } from '@/types/caixa';
import { formatCurrency } from '@/lib/format';

interface PageProps {
  params: {
    id: string;
  };
}

export default function DetalhesCaixaPage({ params }: PageProps) {
  const router = useRouter();
  const [resumo, setResumo] = useState<ResumoCaixa | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    buscarResumo();
  }, [params.id]);

  const buscarResumo = async () => {
    try {
      setCarregando(true);
      const data = await caixaService.getResumoCaixa(params.id);
      setResumo(data);
    } catch (error) {
      console.error('Erro ao buscar resumo do caixa:', error);
    } finally {
      setCarregando(false);
    }
  };

  const calcularTempoAberto = (dataAbertura: Date, horaAbertura: string) => {
    const agora = new Date();
    const abertura = new Date(dataAbertura);
    const [horas, minutos] = horaAbertura.split(':');
    abertura.setHours(parseInt(horas), parseInt(minutos));
    
    const diff = agora.getTime() - abertura.getTime();
    const horas_decorridas = Math.floor(diff / (1000 * 60 * 60));
    const minutos_decorridos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas_decorridas}h ${minutos_decorridos}min`;
  };

  if (carregando) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-32 bg-muted rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-24 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!resumo) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Caixa não encontrado</h3>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { abertura, movimentacoes, sangrias, totalVendas, totalSangrias, saldoFinal, resumoPorFormaPagamento } = resumo;

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Detalhes do Caixa</h1>
          <p className="text-muted-foreground">
            Informações completas e movimentações
          </p>
        </div>
      </div>

      {/* Informações do Funcionário */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl flex items-center gap-3">
                <User className="h-6 w-6" />
                {abertura.funcionario?.nome || 'Funcionário'}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {abertura.funcionario?.cargo || 'Cargo não definido'}
              </p>
            </div>
            <Badge variant="default" className="bg-green-500 text-lg px-4 py-2">
              {abertura.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Data de Abertura</p>
                <p className="font-semibold">
                  {new Date(abertura.dataAbertura).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Hora de Abertura</p>
                <p className="font-semibold">{abertura.horaAbertura}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <p className="text-sm text-muted-foreground">Tempo Aberto</p>
                <p className="font-semibold">
                  {calcularTempoAberto(abertura.dataAbertura, abertura.horaAbertura)}
                </p>
              </div>
            </div>
          </div>
          {abertura.observacao && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Observação</p>
              <p>{abertura.observacao}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inicial</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(abertura.valorInicial))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalVendas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {movimentacoes.filter(m => m.tipo === 'VENDA').length} vendas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sangrias</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalSangrias)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {sangrias.length} sangrias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Final</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(saldoFinal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor atual em caixa
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo por Forma de Pagamento */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Resumo por Forma de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(resumoPorFormaPagamento).map(([forma, valor]) => (
              <div key={forma} className="flex justify-between items-center p-4 bg-muted rounded-lg">
                <span className="font-medium">{forma}</span>
                <span className="font-bold">{formatCurrency(valor)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Movimentações */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Movimentações ({movimentacoes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {movimentacoes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma movimentação registrada
              </p>
            ) : (
              movimentacoes.map((mov) => (
                <div
                  key={mov.id}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={mov.tipo === 'VENDA' ? 'default' : 'secondary'}>
                        {mov.tipo}
                      </Badge>
                      {mov.formaPagamento && (
                        <Badge variant="outline">{mov.formaPagamento}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{mov.descricao}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      mov.tipo === 'VENDA' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {mov.tipo === 'VENDA' ? '+' : '-'} {formatCurrency(Number(mov.valor))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(mov.criadoEm).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sangrias */}
      {sangrias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Sangrias ({sangrias.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sangrias.map((sangria) => (
                <div
                  key={sangria.id}
                  className="flex justify-between items-center p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{sangria.motivo}</p>
                    {sangria.observacao && (
                      <p className="text-sm text-muted-foreground mt-1">{sangria.observacao}</p>
                    )}
                    {sangria.autorizadoPor && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Autorizado por: {sangria.autorizadoPor}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">
                      - {formatCurrency(Number(sangria.valor))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sangria.criadoEm).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
