import { getPublicEventoById } from '@/services/eventoService';
// ✅ CORREÇÃO: Usar o nome do arquivo que você enviou
import EntradaClienteFormulario from './EntradaClienteFormulario'; 
import { notFound } from 'next/navigation';

interface EntradaPageProps {
  params: { eventoId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function EntradaPage({ params, searchParams }: EntradaPageProps) {
  const { eventoId } = params;
  const mesaId = typeof searchParams.mesaId === 'string' ? searchParams.mesaId : undefined;

  // Busca os dados do evento da agenda (que inclui a paginaEvento)
  const evento = await getPublicEventoById(eventoId);
  
  if (!evento || !evento.paginaEvento) {
    notFound(); 
  }
  
  // ✅ Passa os objetos completos para o componente cliente
  return (
    <EntradaClienteFormulario 
      evento={evento} // Objeto Evento com o ID e Valor
      paginaEvento={evento.paginaEvento}
      mesaId={mesaId}
    />
  );
}