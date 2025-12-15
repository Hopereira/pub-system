'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Lock, AlertTriangle, CheckCircle2, XCircle, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { ResumoCaixa, formasPagamentoLabels } from '@/types/caixa';

interface FechamentoCaixaModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (valores: {
    valorInformadoDinheiro: number;
    valorInformadoPix: number;
    valorInformadoDebito: number;
    valorInformadoCredito: number;
    valorInformadoValeRefeicao: number;
    valorInformadoValeAlimentacao: number;
    observacao?: string;
    forcarFechamento?: boolean;
  }) => Promise<void>;
  resumoCaixa: ResumoCaixa;
}

export function FechamentoCaixaModal({ 
  open, 
  onClose, 
  onConfirm,
  resumoCaixa
}: FechamentoCaixaModalProps) {
  const [valores, setValores] = useState({
    dinheiro: '',
    pix: '',
    debito: '',
    credito: '',
    valeRefeicao: '',
    valeAlimentacao: '',
  });
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);

  const esperados = resumoCaixa.resumoPorFormaPagamento.reduce((acc, item) => {
    const key = item.formaPagamento.toLowerCase().replace(/_/g, '');
    acc[key] = item.valorEsperado;
    return acc;
  }, {} as Record<string, number>);

  const calcularDiferenca = (esperado: number, informado: string) => {
    const valor = parseFloat(informado.replace(',', '.')) || 0;
    return valor - esperado;
  };

  const getDiferencaIcon = (diferenca: number) => {
    if (diferenca === 0) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (Math.abs(diferenca) < 5) return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getDiferencaColor = (diferenca: number) => {
    if (diferenca === 0) return 'text-green-600';
    if (Math.abs(diferenca) < 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalInformado = Object.values(valores).reduce((acc, val) => {
    return acc + (parseFloat(val.replace(',', '.')) || 0);
  }, 0);

  const totalEsperado = resumoCaixa.totalVendas - resumoCaixa.totalSangrias + resumoCaixa.totalSuprimentos;
  const diferencaTotal = totalInformado - totalEsperado;

  const handlePreencherAutomatico = () => {
    setValores({
      dinheiro: (esperados.dinheiro || 0).toFixed(2),
      pix: (esperados.pix || 0).toFixed(2),
      debito: (esperados.debito || 0).toFixed(2),
      credito: (esperados.credito || 0).toFixed(2),
      valeRefeicao: (esperados.valerefeicao || 0).toFixed(2),
      valeAlimentacao: (esperados.valealimentacao || 0).toFixed(2),
    });
    toast.success('Valores preenchidos automaticamente!');
  };

  const handleConfirm = async () => {
    // Verifica se há movimentações
    const semMovimentacoes = resumoCaixa.totalVendas === 0 && resumoCaixa.totalSangrias === 0 && resumoCaixa.totalSuprimentos === 0;
    
    // Se não há movimentações, exigir observação
    if (semMovimentacoes && !observacao.trim()) {
      toast.error('Fechamento sem movimentações requer observação');
      return;
    }

    // Validar se todos os valores foram informados (apenas se houver movimentações)
    if (!semMovimentacoes) {
      const todosPreenchidos = Object.values(valores).every(v => v.trim() !== '');
      
      if (!todosPreenchidos) {
        toast.error('Preencha todos os valores');
        return;
      }

      // Se diferença > R$ 50, exigir observação
      if (Math.abs(diferencaTotal) > 50 && !observacao.trim()) {
        toast.error('Diferença maior que R$ 50,00 requer observação detalhada');
        return;
      }
    }

    try {
      setLoading(true);
      await onConfirm({
        valorInformadoDinheiro: parseFloat(valores.dinheiro.replace(',', '.')) || 0,
        valorInformadoPix: parseFloat(valores.pix.replace(',', '.')) || 0,
        valorInformadoDebito: parseFloat(valores.debito.replace(',', '.')) || 0,
        valorInformadoCredito: parseFloat(valores.credito.replace(',', '.')) || 0,
        valorInformadoValeRefeicao: parseFloat(valores.valeRefeicao.replace(',', '.')) || 0,
        valorInformadoValeAlimentacao: parseFloat(valores.valeAlimentacao.replace(',', '.')) || 0,
        observacao: observacao || undefined,
        forcarFechamento: semMovimentacoes,
      });
      toast.success('Caixa fechado com sucesso!');
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erro ao fechar caixa');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Fechamento de Caixa
          </DialogTitle>
          <DialogDescription>
            Operador: <strong>{resumoCaixa.abertura.funcionarioNome}</strong>
            <br />
            Confira os valores de cada forma de pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Botão de Preenchimento Automático */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handlePreencherAutomatico}
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Preencher Valores Automaticamente
          </Button>

          {/* Resumo do Turno */}
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Vendas do turno:</span>
              <span className="font-semibold">{formatCurrency(resumoCaixa.totalVendas)}</span>
            </div>
            <div className="flex justify-between">
              <span>Sangrias realizadas:</span>
              <span className="font-semibold text-red-600">- {formatCurrency(resumoCaixa.totalSangrias)}</span>
            </div>
            <div className="flex justify-between">
              <span>Suprimentos:</span>
              <span className="font-semibold text-green-600">+ {formatCurrency(resumoCaixa.totalSuprimentos)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-bold">Saldo esperado:</span>
              <span className="font-bold">{formatCurrency(totalEsperado)}</span>
            </div>
          </div>

          {/* Conferência por Forma de Pagamento */}
          <div className="space-y-3">
            {/* Dinheiro */}
            <div className="space-y-1">
              <Label className="flex items-center justify-between">
                <span>💵 {formasPagamentoLabels.DINHEIRO}</span>
                <span className="text-xs text-muted-foreground">
                  Esperado: {formatCurrency(esperados.dinheiro || 0)}
                </span>
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="0.00"
                  value={valores.dinheiro}
                  onChange={(e) => setValores({...valores, dinheiro: e.target.value.replace(/[^0-9.,]/g, '')})}
                  className="flex-1"
                />
                {getDiferencaIcon(calcularDiferenca(esperados.dinheiro || 0, valores.dinheiro))}
                <span className={`text-sm font-semibold min-w-[80px] text-right ${getDiferencaColor(calcularDiferenca(esperados.dinheiro || 0, valores.dinheiro))}`}>
                  {calcularDiferenca(esperados.dinheiro || 0, valores.dinheiro) >= 0 ? '+' : ''}
                  {formatCurrency(calcularDiferenca(esperados.dinheiro || 0, valores.dinheiro))}
                </span>
              </div>
            </div>

            {/* PIX */}
            <div className="space-y-1">
              <Label className="flex items-center justify-between">
                <span>📱 {formasPagamentoLabels.PIX}</span>
                <span className="text-xs text-muted-foreground">
                  Esperado: {formatCurrency(esperados.pix || 0)}
                </span>
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="0.00"
                  value={valores.pix}
                  onChange={(e) => setValores({...valores, pix: e.target.value.replace(/[^0-9.,]/g, '')})}
                  className="flex-1"
                />
                {getDiferencaIcon(calcularDiferenca(esperados.pix || 0, valores.pix))}
                <span className={`text-sm font-semibold min-w-[80px] text-right ${getDiferencaColor(calcularDiferenca(esperados.pix || 0, valores.pix))}`}>
                  {calcularDiferenca(esperados.pix || 0, valores.pix) >= 0 ? '+' : ''}
                  {formatCurrency(calcularDiferenca(esperados.pix || 0, valores.pix))}
                </span>
              </div>
            </div>

            {/* Débito */}
            <div className="space-y-1">
              <Label className="flex items-center justify-between">
                <span>💳 {formasPagamentoLabels.DEBITO}</span>
                <span className="text-xs text-muted-foreground">
                  Esperado: {formatCurrency(esperados.debito || 0)}
                </span>
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="0.00"
                  value={valores.debito}
                  onChange={(e) => setValores({...valores, debito: e.target.value.replace(/[^0-9.,]/g, '')})}
                  className="flex-1"
                />
                {getDiferencaIcon(calcularDiferenca(esperados.debito || 0, valores.debito))}
                <span className={`text-sm font-semibold min-w-[80px] text-right ${getDiferencaColor(calcularDiferenca(esperados.debito || 0, valores.debito))}`}>
                  {calcularDiferenca(esperados.debito || 0, valores.debito) >= 0 ? '+' : ''}
                  {formatCurrency(calcularDiferenca(esperados.debito || 0, valores.debito))}
                </span>
              </div>
            </div>

            {/* Crédito */}
            <div className="space-y-1">
              <Label className="flex items-center justify-between">
                <span>💳 {formasPagamentoLabels.CREDITO}</span>
                <span className="text-xs text-muted-foreground">
                  Esperado: {formatCurrency(esperados.credito || 0)}
                </span>
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="0.00"
                  value={valores.credito}
                  onChange={(e) => setValores({...valores, credito: e.target.value.replace(/[^0-9.,]/g, '')})}
                  className="flex-1"
                />
                {getDiferencaIcon(calcularDiferenca(esperados.credito || 0, valores.credito))}
                <span className={`text-sm font-semibold min-w-[80px] text-right ${getDiferencaColor(calcularDiferenca(esperados.credito || 0, valores.credito))}`}>
                  {calcularDiferenca(esperados.credito || 0, valores.credito) >= 0 ? '+' : ''}
                  {formatCurrency(calcularDiferenca(esperados.credito || 0, valores.credito))}
                </span>
              </div>
            </div>

            {/* Vale Refeição */}
            <div className="space-y-1">
              <Label className="flex items-center justify-between">
                <span>🎫 {formasPagamentoLabels.VALE_REFEICAO}</span>
                <span className="text-xs text-muted-foreground">
                  Esperado: {formatCurrency(esperados.valerefeicao || 0)}
                </span>
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="0.00"
                  value={valores.valeRefeicao}
                  onChange={(e) => setValores({...valores, valeRefeicao: e.target.value.replace(/[^0-9.,]/g, '')})}
                  className="flex-1"
                />
                {getDiferencaIcon(calcularDiferenca(esperados.valerefeicao || 0, valores.valeRefeicao))}
                <span className={`text-sm font-semibold min-w-[80px] text-right ${getDiferencaColor(calcularDiferenca(esperados.valerefeicao || 0, valores.valeRefeicao))}`}>
                  {calcularDiferenca(esperados.valerefeicao || 0, valores.valeRefeicao) >= 0 ? '+' : ''}
                  {formatCurrency(calcularDiferenca(esperados.valerefeicao || 0, valores.valeRefeicao))}
                </span>
              </div>
            </div>

            {/* Vale Alimentação */}
            <div className="space-y-1">
              <Label className="flex items-center justify-between">
                <span>🎫 {formasPagamentoLabels.VALE_ALIMENTACAO}</span>
                <span className="text-xs text-muted-foreground">
                  Esperado: {formatCurrency(esperados.valealimentacao || 0)}
                </span>
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="text"
                  placeholder="0.00"
                  value={valores.valeAlimentacao}
                  onChange={(e) => setValores({...valores, valeAlimentacao: e.target.value.replace(/[^0-9.,]/g, '')})}
                  className="flex-1"
                />
                {getDiferencaIcon(calcularDiferenca(esperados.valealimentacao || 0, valores.valeAlimentacao))}
                <span className={`text-sm font-semibold min-w-[80px] text-right ${getDiferencaColor(calcularDiferenca(esperados.valealimentacao || 0, valores.valeAlimentacao))}`}>
                  {calcularDiferenca(esperados.valealimentacao || 0, valores.valeAlimentacao) >= 0 ? '+' : ''}
                  {formatCurrency(calcularDiferenca(esperados.valealimentacao || 0, valores.valeAlimentacao))}
                </span>
              </div>
            </div>
          </div>

          {/* Total Geral */}
          <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold">Total Informado:</span>
              <span className="text-xl font-bold">{formatCurrency(totalInformado)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold">Total Esperado:</span>
              <span className="text-xl font-bold">{formatCurrency(totalEsperado)}</span>
            </div>
            <div className={`flex justify-between items-center pt-2 border-t ${getDiferencaColor(diferencaTotal)}`}>
              <span className="font-bold flex items-center gap-2">
                {getDiferencaIcon(diferencaTotal)}
                Diferença Total:
              </span>
              <span className="text-xl font-bold">
                {diferencaTotal >= 0 ? '+' : ''}
                {formatCurrency(diferencaTotal)}
              </span>
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-2">
            <Label htmlFor="observacao">
              Observação {Math.abs(diferencaTotal) > 50 && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="observacao"
              placeholder="Descreva qualquer ocorrência relevante durante o turno..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
            />
            {Math.abs(diferencaTotal) > 50 && (
              <p className="text-xs text-red-500">
                * Diferença maior que R$ 50,00 requer observação obrigatória
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Fechando...' : 'Fechar Caixa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
