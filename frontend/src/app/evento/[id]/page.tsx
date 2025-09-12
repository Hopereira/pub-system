// Caminho: frontend/src/app/evento/[id]/page.tsx

import { getPublicPaginaEvento } from '@/services/paginaEventoService'; // Precisaremos de criar este serviço/função
import EventoClientPage from './EventoClientPage'; // Precisaremos de criar este componente

type EventoPageProps = {
  params: {
    id: string; // ID da PaginaEvento
  };
  searchParams: { // Para capturar o ID da mesa, se vier na URL
    mesaId?: string;
  }
};

// Esta é uma Server Page. Ela busca os dados antes de renderizar.
export default async function EventoPage({ params, searchParams }: EventoPageProps) {
  // Critério de Aceite #2: Buscar os dados da PaginaEvento
  const paginaEvento = await getPublicPaginaEvento(params.id).catch(() => null);

  if (!paginaEvento || !paginaEvento.ativa) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Evento Não Encontrado</h1>
          <p className="text-muted-foreground">O link que você usou pode estar expirado ou incorreto.</p>
        </div>
      </div>
    );
  }

  // Passamos os dados para o componente de cliente que terá o formulário
  return (
    <EventoClientPage 
      paginaEvento={paginaEvento} 
      mesaId={searchParams.mesaId} 
    />
  );
}