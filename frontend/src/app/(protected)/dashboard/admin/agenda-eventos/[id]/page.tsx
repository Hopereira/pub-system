import { getEventoById } from '@/services/eventoService';
import EventoFormPage from './EventoFormPage'; // O componente de formulário que vamos criar
import { notFound } from 'next/navigation';

interface PageProps {
  params: { id: string };
}

// Este é o Componente de Servidor. Ele busca os dados ANTES da página carregar.
export default async function GerirEventoPage({ params }: PageProps) {
  const { id } = params;
  const isEditMode = id !== 'novo';
  let evento = null;

  // Se estivermos no modo de edição, buscamos os dados do evento.
  if (isEditMode) {
    evento = await getEventoById(id);
    // Se o evento com o ID fornecido não existir, mostra a página 404.
    if (!evento) {
      notFound();
    }
  }

  // Passa os dados do evento (ou null, se for um novo) para o componente de cliente.
  return <EventoFormPage eventoToEdit={evento} />;
}