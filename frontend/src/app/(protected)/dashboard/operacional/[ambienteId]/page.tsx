// Caminho: frontend/src/app/(protected)/dashboard/operacional/[ambienteId]/page.tsx

import { getAmbienteById } from '@/services/ambienteService';
// CORREÇÃO: Importamos o componente com chaves {}
import { OperacionalClientPage } from './OperacionalClientPage';

type PaginaOperacionalProps = {
  params: {
    ambienteId: string;
  };
};

export default async function PaginaOperacional({ params }: PaginaOperacionalProps) {
  // É uma boa prática buscar o nome do ambiente no servidor
  const ambiente = await getAmbienteById(params.ambienteId).catch(() => null);
  const nomeDoAmbiente = ambiente?.nome ?? 'Painel Operacional';

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{nomeDoAmbiente}</h1>
        <p className="text-muted-foreground">
          Acompanhe e gerencie os pedidos em tempo real.
        </p>
      </div>
      
      {/* Renderizamos o componente de cliente, passando o ambienteId para ele */}
      <OperacionalClientPage ambienteId={params.ambienteId} />
    </div>
  );
}