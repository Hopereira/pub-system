'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  DollarSign, 
  User, 
  Clock, 
  TrendingUp, 
  Eye, 
  TrendingDown,
  Calendar,
  Receipt,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import caixaService from '@/services/caixaService';
import { AberturaCaixa, ResumoCaixa } from '@/types/caixa';
import { formatCurrency } from '@/lib/format';

interface CaixaComResumo {
  abertura: AberturaCaixa;
  resumo: ResumoCaixa | null;
}

export default function GestaoTodosCaixas() {
  const [caixasComResumo, setCaixasComResumo] = useState<CaixaComResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [caixaSelecionado, setCaixaSelecionado] = useState<CaixaComResumo | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    buscarTodosCaixas();
  }, []);

  const buscarTodosCaixas = async () => {
    try {
      setCarregando(true);
      const caixas = await caixaService.getTodosCaixasAbertos();
      
      // Buscar resumo de cada caixa em paralelo
      const caixasComResumos = await Promise.all(
        caixas.map(async (caixa) => {
          try {
            const resumo = await caixaService.getResumoCaixa(caixa.id);
            return { abertura: caixa, resumo };
          } catch (error) {
            console.error(`Erro ao buscar resumo do caixa ${caixa.id}:`, error);
            return { abertura: caixa, resumo: null };
          }
        })
      );
      
      setCaixasComResumo(caixasComResumos);
    } catch (error) {
      console.error('Erro ao buscar caixas:', error);
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

  const abrirModal = (caixaComResumo: CaixaComResumo) => {
    setCaixaSelecionado(caixaComResumo);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setCaixaSelecionado(null);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Caixas</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os caixas abertos no sistema
          </p>
        </div>
        <Button variant="outline" onClick={buscarTodosCaixas}>
          Atualizar
        </Button>
      </div>

      {carregando ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-32 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : caixasComResumo.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum caixa aberto</h3>
            <p className="text-muted-foreground text-center">
              Não há caixas abertos no momento
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumo Geral */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Caixas</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{caixasComResumo.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Caixas abertos agora</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total em Caixas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    caixasComResumo.reduce((sum, c) => sum + (c.resumo?.saldoFinal || 0), 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Saldo atual de todos os caixas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total em Vendas</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    caixasComResumo.reduce((sum, c) => sum + (c.resumo?.totalVendas || 0), 0)
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Vendas de todos os caixas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {caixasComResumo.length > 0
                    ? Math.round(
                        caixasComResumo.reduce((sum, c) => {
                          const abertura = new Date(c.abertura.dataAbertura);
                          const [h, m] = c.abertura.horaAbertura.split(':');
                          abertura.setHours(parseInt(h), parseInt(m));
                          const diff = Date.now() - abertura.getTime();
                          return sum + diff / (1000 * 60 * 60);
                        }, 0) / caixasComResumo.length
                      )
                    : 0}
                  h
                </div>
                <p className="text-xs text-muted-foreground mt-1">Tempo de abertura</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Caixas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {caixasComResumo.map((caixaComResumo) => {
              const caixa = caixaComResumo.abertura;
              const resumo = caixaComResumo.resumo;
              
              return (
                <Card key={caixa.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {caixa.funcionario?.nome || 'Funcionário'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {caixa.funcionario?.cargo || 'Cargo não definido'}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      {caixa.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Saldo Atual</p>
                      <p className="text-sm font-semibold text-blue-600">
                        {formatCurrency(resumo?.saldoFinal || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tempo Aberto</p>
                      <p className="text-sm font-semibold">
                        {calcularTempoAberto(caixa.dataAbertura, caixa.horaAbertura)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Vendas</p>
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(resumo?.totalVendas || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Sangrias</p>
                      <p className="text-sm font-semibold text-red-600">
                        {formatCurrency(resumo?.totalSangrias || 0)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Abertura</p>
                    <p className="text-sm">
                      {new Date(caixa.dataAbertura).toLocaleDateString('pt-BR')} às{' '}
                      {caixa.horaAbertura}
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => abrirModal(caixaComResumo)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Modal de Detalhes do Caixa */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              <User className="h-6 w-6" />
              {caixaSelecionado?.abertura.funcionario?.nome || 'Funcionário'}
            </DialogTitle>
            <DialogDescription>
              {caixaSelecionado?.abertura.funcionario?.cargo || 'Cargo não definido'} • 
              Caixa {caixaSelecionado?.abertura.status}
            </DialogDescription>
          </DialogHeader>

          {caixaSelecionado && (
            <div className="space-y-6 mt-4">
              {/* Resumo Financeiro */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Valor Inicial
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold">
                      {formatCurrency(Number(caixaSelecionado.abertura.valorInicial))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Total Vendas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(caixaSelecionado.resumo?.totalVendas || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {caixaSelecionado.resumo?.movimentacoes.filter(m => m.tipo === 'VENDA').length || 0} vendas
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      Total Sangrias
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-red-600">
                      {formatCurrency(caixaSelecionado.resumo?.totalSangrias || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {caixaSelecionado.resumo?.sangrias.length || 0} sangrias
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      Saldo Atual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-blue-600">
                      {formatCurrency(caixaSelecionado.resumo?.saldoFinal || 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Informações de Abertura */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Informações de Abertura
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Abertura</p>
                    <p className="font-semibold">
                      {new Date(caixaSelecionado.abertura.dataAbertura).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hora de Abertura</p>
                    <p className="font-semibold">{caixaSelecionado.abertura.horaAbertura}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Aberto</p>
                    <p className="font-semibold">
                      {calcularTempoAberto(
                        caixaSelecionado.abertura.dataAbertura,
                        caixaSelecionado.abertura.horaAbertura
                      )}
                    </p>
                  </div>
                  {caixaSelecionado.abertura.observacao && (
                    <div className="md:col-span-3">
                      <p className="text-sm text-muted-foreground">Observação</p>
                      <p className="font-semibold">{caixaSelecionado.abertura.observacao}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resumo por Forma de Pagamento */}
              {caixaSelecionado.resumo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Resumo por Forma de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(caixaSelecionado.resumo.resumoPorFormaPagamento).map(
                        ([forma, valor]) => (
                          <div
                            key={forma}
                            className="flex justify-between items-center p-3 bg-muted rounded-lg"
                          >
                            <span className="font-medium text-sm">{forma}</span>
                            <span className="font-bold">{formatCurrency(valor)}</span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Últimas Movimentações */}
              {caixaSelecionado.resumo && caixaSelecionado.resumo.movimentacoes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Receipt className="h-5 w-5" />
                      Últimas Movimentações ({caixaSelecionado.resumo.movimentacoes.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {caixaSelecionado.resumo.movimentacoes.slice(0, 10).map((mov) => (
                        <div
                          key={mov.id}
                          className="flex justify-between items-center p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={mov.tipo === 'VENDA' ? 'default' : 'secondary'}
                              >
                                {mov.tipo}
                              </Badge>
                              {mov.formaPagamento && (
                                <Badge variant="outline">{mov.formaPagamento}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{mov.descricao}</p>
                          </div>
                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${
                                mov.tipo === 'VENDA' ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {mov.tipo === 'VENDA' ? '+' : '-'} {formatCurrency(Number(mov.valor))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(mov.criadoEm).toLocaleTimeString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
