// Caminho: frontend/src/app/(protected)/dashboard/operacional/[ambienteId]/page.tsx

import { getAmbienteById } from '@/services/ambienteService';
import { OperacionalClientPage } from './OperacionalClientPage';
// ADIÇÃO: Importamos a função 'cookies' do Next.js para ler o token no servidor
import { cookies } from 'next/headers';

type PaginaOperacionalProps = {
  params: {
    ambienteId: string;
  };
};

// CORREÇÃO: Desestruturamos { ambienteId } diretamente dos params
export default async function PaginaOperacional({ params: { ambienteId } }: PaginaOperacionalProps) {
  
  // ADIÇÃO: Lógica para fazer a chamada autenticada no servidor
  const cookieStore = cookies();
  const token = cookieStore.get('authToken')?.value;

  // Agora chamamos a função passando o ID e o token
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
      
      {/* O componente do cliente continua a funcionar da mesma forma */}
      <OperacionalClientPage ambienteId={ambienteId} />
    </div>
  );
}