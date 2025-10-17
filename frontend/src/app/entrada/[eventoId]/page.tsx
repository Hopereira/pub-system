// Caminho: frontend/src/app/entrada/[eventoId]/page.tsx
import { getPublicEventoById } from '@/services/eventoService';
import EntradaClienteFormulario from './EntradaClienteFormulario'; 
import { notFound } from 'next/navigation';

type EntradaPageProps = {
  params: Promise<{ eventoId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EntradaPage({ params, searchParams }: EntradaPageProps) {
  const { eventoId } = await params;
  const sp = await searchParams;
  const mesaId = typeof sp.mesaId === 'string' ? sp.mesaId : undefined;

  // Busca os dados do evento da agenda (que inclui a paginaEvento)
  const evento = await getPublicEventoById(eventoId);

  if (!evento || !evento.paginaEvento) {
    notFound(); 
  }
  
  // Passa o objeto evento completo (com o ID e Valor)
  return (
    <EntradaClienteFormulario 
      evento={evento} 
      paginaEvento={evento.paginaEvento}
      mesaId={mesaId}
    />
  );
}