// Caminho: frontend/src/app/(protected)/dashboard/operacional/[ambienteId]/page.tsx

import { getAmbienteById } from '@/services/ambienteService';
import { OperacionalClientPage } from './OperacionalClientPage';
import { cookies } from 'next/headers';

type PaginaOperacionalProps = {
  params: {
    ambienteId: string;
  };
};

// A assinatura da função permanece a mesma que corrigimos antes
export default async function PaginaOperacional({ params: { ambienteId } }: PaginaOperacionalProps) {
  
  // A LÓGICA DE BUSCA DE DADOS FOI AJUSTADA PARA SER TOTALMENTE ASSÍNCRONA
  const cookieStore = cookies();
  const token = cookieStore.get('authToken')?.value;

  const ambiente = await getAmbienteById(ambienteId, token);
  const nomeDoAmbiente = ambiente?.nome ?? 'Painel Operacional';

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{nomeDoAmbiente}</h1>
        <p className="text-muted-foreground">
          Acompanhe e gerencie os pedidos em tempo real.
        </p>
      </div>
      
      <OperacionalClientPage ambienteId={ambienteId} />
    </div>
  );
}