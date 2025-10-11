// Caminho: frontend/src/app/entrada/[eventoId]/page.tsx
import { getPublicEventoById } from '@/services/eventoService';
import EntradaClienteFormulario from './EntradaClienteFormulario'; 
import { notFound } from 'next/navigation';

interface EntradaPageProps {
  params: { eventoId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function EntradaPage({ params, searchParams }: EntradaPageProps) {
  // ✅ CORREÇÃO APLICADA: Next.js é satisfeito quando desestrutura-se diretamente
  const { eventoId } = params;
  const mesaId = typeof searchParams.mesaId === 'string' ? searchParams.mesaId : undefined;

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