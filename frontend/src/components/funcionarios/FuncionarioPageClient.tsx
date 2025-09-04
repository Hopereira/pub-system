// Caminho: frontend/src/features/funcionarios/FuncionarioPageClient.tsx

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function FuncionarioPageClient() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Funcionários</h1>
          <p className="text-muted-foreground">
            Adicione, edite e remova os funcionários do seu estabelecimento.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Novo
        </Button>
      </div>

      {/* O componente da tabela entrará aqui no próximo passo */}
      <div className="rounded-lg border p-4 text-center">
        <p className="text-muted-foreground">A tabela de funcionários será exibida aqui.</p>
      </div>
    </div>
  );
}