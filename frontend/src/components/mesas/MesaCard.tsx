// src/components/mesas/MesaCard.tsx (versão atualizada)
'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Mesa } from '@/types/mesa';
import { CheckCircle2, Users } from 'lucide-react';

interface MesaCardProps {
  mesa: Mesa;
  onClick: (mesa: Mesa) => void; // <-- Adicionar esta linha
}

export function MesaCard({ mesa, onClick }: MesaCardProps) {
  const isLivre = mesa.status === 'Livre';

  return (
    <Card
      onClick={() => onClick(mesa)} // <-- Adicionar esta linha
      className={cn(
        'cursor-pointer transition-all hover:shadow-lg hover:scale-105',
        isLivre
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
          : 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
      )}
    >
      {/* ... o resto do código continua igual ... */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        <CardTitle className="text-2xl font-bold">{mesa.numero}</CardTitle>
        {isLivre ? (
          <CheckCircle2 className="h-8 w-8 text-green-500" />
        ) : (
          <Users className="h-8 w-8 text-amber-500" />
        )}
      </CardHeader>
    </Card>
  );
}