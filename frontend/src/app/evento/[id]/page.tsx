// Caminho: frontend/src/app/evento/[id]/page.tsx

import { getPublicPaginaEvento } from '@/services/paginaEventoService';
import EventoClientPage from './EventoClientPage';

// Assumindo que o tipo Evento tem uma relação com PaginaEvento
interface EventoClientData {
    id: string; // ID da PaginaEvento
    paginaEvento: any; // Tipo real de PaginaEvento
    evento?: any; // Assumindo que pode ter dados do Evento relacionados
}


interface EventoPageProps {
  params: {
    id: string; // ID da PaginaEvento
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

// O componente de servidor para a página pública de evento
export default async function EventoPage({ params, searchParams }: EventoPageProps) {
  const { id } = params; // Este ID é o ID da PaginaEvento!
  const mesaId = typeof searchParams.mesaId === 'string' ? searchParams.mesaId : undefined;

  // Buscamos os dados da página de evento usando o ID
  const paginaEvento = await getPublicPaginaEvento(id);

  if (!paginaEvento || !paginaEvento.ativa) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Página Não Encontrada</h1>
        <p className="text-gray-600 mt-2">O link que você usou pode estar expirado ou incorreto.</p>
      </div>
    );
  }

  // A CORREÇÃO ESTÁ AQUI: PaginaEvento não tem um objeto Evento. 
  // No fluxo normal de Boas-Vindas (/evento/[id]), NÃO EXISTE um evento (cobrança).
  // Portanto, a prop 'evento' deve ser 'undefined'.
  
  return (
    <EventoClientPage 
      paginaEvento={paginaEvento} 
      mesaId={mesaId}
      // Se não estamos na rota /entrada, não enviamos o objeto evento.
      // Isso permite que o mesmo componente sirva para dois propósitos.
      evento={undefined} 
    />
  );
}