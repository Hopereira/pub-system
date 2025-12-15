// Caminho: frontend/src/app/(protected)/cozinha/page.tsx
// Rota /cozinha - Redireciona para o painel Kanban do primeiro ambiente de preparo
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAmbientes } from '@/services/ambienteService';
import { Ambiente } from '@/types/ambiente';
import { Skeleton } from '@/components/ui/skeleton';

export default function CozinhaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToAmbiente = async () => {
      try {
        const ambientes = await getAmbientes();
        const ambientesPreparo = ambientes.filter((a: Ambiente) => a.tipo === 'PREPARO');
        
        if (ambientesPreparo.length > 0) {
          // Redireciona para o primeiro ambiente de preparo
          router.replace(`/dashboard/operacional/${ambientesPreparo[0].id}`);
        } else {
          // Se não há ambientes de preparo, vai para o dashboard
          router.replace('/dashboard');
        }
      } catch (error) {
        console.error('Erro ao buscar ambientes:', error);
        router.replace('/dashboard');
      }
    };

    redirectToAmbiente();
  }, [router]);

  return (
    <div className="container mx-auto p-4">
      <Skeleton className="h-12 w-64 mb-6" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-96" />
        ))}
      </div>
    </div>
  );
}
