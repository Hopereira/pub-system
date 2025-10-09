// Caminho: frontend/src/app/evento/[id]/page.tsx

import { getPublicPaginaEvento } from '@/services/paginaEventoService';
// ✅ CORREÇÃO: Importamos o componente correto para esta página: EventoClientPage
import EventoClientPage from './EventoClientPage';

// A interface para as props da página
interface EventoPageProps {
  params: {
    id: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

// O componente de servidor para a página pública de evento
export default async function EventoPage({ params, searchParams }: EventoPageProps) {
  
  // Acessamos o ID e o ID da mesa de forma segura
  const id = params.id;
  const mesaId = typeof searchParams.mesaId === 'string' ? searchParams.mesaId : undefined;

  // Buscamos os dados da página de evento usando o ID
  const paginaEvento = await getPublicPaginaEvento(id);

  // Se a página não for encontrada ou estiver inativa, mostramos uma mensagem de erro amigável.
  if (!paginaEvento || !paginaEvento.ativa) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Página Não Encontrada</h1>
        <p className="text-gray-600 mt-2">O link que você usou pode estar expirado ou incorreto.</p>
      </div>
    );
  }

  // ✅ CORREÇÃO: Renderizamos o componente correto, o EventoClientPage,
  // passando os dados que ele precisa.
  return (
    <EventoClientPage 
      paginaEvento={paginaEvento} 
      mesaId={mesaId}
    />
  );
}