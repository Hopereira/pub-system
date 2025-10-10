// Caminho: frontend/src/app/entrada/[eventoId]/page.tsx
import { getPublicEventoById } from '@/services/eventoService'; // Precisaremos desta função
import EntradaClientePage from './EntradaClientePage';
import { notFound } from 'next/navigation';

interface EntradaPageProps {
  params: { eventoId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function EntradaPage({ params, searchParams }: EntradaPageProps) {
  const { eventoId } = params;
  const mesaId = typeof searchParams.mesaId === 'string' ? searchParams.mesaId : undefined;

  // Busca os dados do evento da agenda para mostrar o título e a imagem
  const evento = await getPublicEventoById(eventoId);

  if (!evento || !evento.paginaEvento) {
    notFound(); // Se o evento não existir ou não tiver um tema, não mostra a página
  }
  
  return (
    <EntradaClientePage 
      evento={evento} 
      paginaEvento={evento.paginaEvento}
      mesaId={mesaId}
    />
  );
}