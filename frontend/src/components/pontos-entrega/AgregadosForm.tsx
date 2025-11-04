'use client';

import { useState } from 'react';
import { Plus, X, Users } from 'lucide-react';
import { CreateAgregadoDto } from '@/types/ponto-entrega.dto';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';

interface AgregadosFormProps {
  agregados: CreateAgregadoDto[];
  onChange: (agregados: CreateAgregadoDto[]) => void;
  maxAgregados?: number;
}

export const AgregadosForm = ({ agregados, onChange, maxAgregados = 10 }: AgregadosFormProps) => {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');

  const handleAdd = () => {
    if (!nome.trim()) {
      return;
    }

    if (agregados.length >= maxAgregados) {
      logger.warn(`⚠️ Limite de ${maxAgregados} agregados atingido`, {
        module: 'AgregadosForm',
      });
      return;
    }

    const novoAgregado: CreateAgregadoDto = {
      nome: nome.trim(),
      cpf: cpf.trim() || undefined,
    };

    onChange([...agregados, novoAgregado]);
    logger.log(`✅ Agregado adicionado: ${nome}`, { module: 'AgregadosForm' });

    // Limpar campos
    setNome('');
    setCpf('');
  };

  const handleRemove = (index: number) => {
    const novosAgregados = agregados.filter((_, i) => i !== index);
    onChange(novosAgregados);
    logger.log(`🗑️ Agregado removido (index: ${index})`, { module: 'AgregadosForm' });
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  const handleCPFChange = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      setCpf(numbers);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Adicionar Acompanhantes
          {agregados.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {agregados.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Informe o nome das pessoas que vão compartilhar esta comanda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulário para adicionar */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="nome-agregado">Nome *</Label>
              <Input
                id="nome-agregado"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyPress={handleKeyPress}
              />
            </div>
            <div>
              <Label htmlFor="cpf-agregado">CPF (Opcional)</Label>
              <Input
                id="cpf-agregado"
                placeholder="000.000.000-00"
                value={formatCPF(cpf)}
                onChange={(e) => handleCPFChange(e.target.value)}
                onKeyPress={handleKeyPress}
                maxLength={14}
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={!nome.trim() || agregados.length >= maxAgregados}
            className="w-full md:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Acompanhante
          </Button>
        </div>

        {/* Lista de agregados adicionados */}
        {agregados.length > 0 && (
          <div className="space-y-2">
            <Label>Acompanhantes Adicionados:</Label>
            <div className="space-y-2">
              {agregados.map((agregado, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{agregado.nome}</p>
                    {agregado.cpf && (
                      <p className="text-sm text-muted-foreground">
                        CPF: {formatCPF(agregado.cpf)}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {agregados.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum acompanhante adicionado ainda
          </p>
        )}
      </CardContent>
    </Card>
  );
};
