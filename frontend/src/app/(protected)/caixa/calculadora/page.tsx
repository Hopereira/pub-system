'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calculator as CalcIcon, Delete } from 'lucide-react';
import Link from 'next/link';

export default function CaixaCalculadoraPage() {
  const [display, setDisplay] = useState('0');
  const [operacao, setOperacao] = useState<string | null>(null);
  const [valorAnterior, setValorAnterior] = useState<number | null>(null);
  const [novoNumero, setNovoNumero] = useState(true);

  const handleNumero = (num: string) => {
    if (novoNumero) {
      setDisplay(num);
      setNovoNumero(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (novoNumero) {
      setDisplay('0.');
      setNovoNumero(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperacao = (op: string) => {
    const valor = parseFloat(display);
    
    if (valorAnterior === null) {
      setValorAnterior(valor);
    } else if (operacao) {
      const resultado = calcular(valorAnterior, valor, operacao);
      setDisplay(String(resultado));
      setValorAnterior(resultado);
    }
    
    setOperacao(op);
    setNovoNumero(true);
  };

  const calcular = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : 0;
      case '%': return a % b;
      default: return b;
    }
  };

  const handleIgual = () => {
    if (operacao && valorAnterior !== null) {
      const valor = parseFloat(display);
      const resultado = calcular(valorAnterior, valor, operacao);
      setDisplay(String(resultado));
      setValorAnterior(null);
      setOperacao(null);
      setNovoNumero(true);
    }
  };

  const handleLimpar = () => {
    setDisplay('0');
    setOperacao(null);
    setValorAnterior(null);
    setNovoNumero(true);
  };

  const handleApagar = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const formatarMoeda = () => {
    const valor = parseFloat(display);
    if (!isNaN(valor)) {
      const formatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(valor);
      setDisplay(String(valor));
      return formatado;
    }
    return display;
  };

  const botoes = [
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+'],
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Link href="/caixa">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Calculadora</h1>
          <p className="text-muted-foreground">Calculadora rápida para o caixa</p>
        </div>
      </div>

      {/* Calculadora */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <CalcIcon className="h-5 w-5" />
            Calculadora
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Display */}
          <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-6 text-right">
            <div className="text-sm text-muted-foreground mb-1 h-6">
              {operacao && valorAnterior !== null && `${valorAnterior} ${operacao}`}
            </div>
            <div className="text-4xl font-bold font-mono break-all">
              {display}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {formatarMoeda()}
            </div>
          </div>

          {/* Botões de Controle */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="destructive" 
              onClick={handleLimpar}
              className="h-14 text-lg"
            >
              Limpar (C)
            </Button>
            <Button 
              variant="outline" 
              onClick={handleApagar}
              className="h-14 text-lg"
            >
              <Delete className="h-5 w-5 mr-2" />
              Apagar
            </Button>
          </div>

          {/* Grade de Botões */}
          <div className="grid grid-cols-4 gap-2">
            {botoes.map((linha, i) => (
              linha.map((botao, j) => (
                <Button
                  key={`${i}-${j}`}
                  variant={
                    botao === '=' ? 'default' :
                    ['+', '-', '*', '/'].includes(botao) ? 'secondary' :
                    'outline'
                  }
                  className="h-16 text-xl font-semibold"
                  onClick={() => {
                    if (botao === '=') handleIgual();
                    else if (botao === '.') handleDecimal();
                    else if (['+', '-', '*', '/'].includes(botao)) handleOperacao(botao);
                    else handleNumero(botao);
                  }}
                >
                  {botao}
                </Button>
              ))
            ))}
          </div>

          {/* Botões Extras */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleOperacao('%')}
              className="h-12"
            >
              Porcentagem (%)
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setDisplay(String(-parseFloat(display)))}
              className="h-12"
            >
              +/- (Negativo)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Atalhos de Teclado */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-base">⌨️ Atalhos de Teclado</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>• <strong>0-9</strong>: Números</p>
          <p>• <strong>+ - * /</strong>: Operações</p>
          <p>• <strong>Enter</strong>: Igual (=)</p>
          <p>• <strong>Backspace</strong>: Apagar</p>
          <p>• <strong>Escape</strong>: Limpar (C)</p>
        </CardContent>
      </Card>
    </div>
  );
}
