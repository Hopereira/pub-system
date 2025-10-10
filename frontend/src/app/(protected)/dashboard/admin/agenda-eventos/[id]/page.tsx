// Caminho: frontend/src/app/(protected)/dashboard/admin/agenda-eventos/[id]/page.tsx

import EventoFormPage from './EventoFormPage';

interface PageProps {
  params: {
    id: string;
  };
}

// Este componente não é 'async' pois não busca mais dados.
export default async function GerirEventoPage({ params }: PageProps) {
  // A única responsabilidade dele é obter o ID da URL...
  const { id } = await params;

  // ...e passar esse ID para o componente de cliente (o formulário),
  // que fará todo o trabalho de busca de dados e renderização.
  return <EventoFormPage eventoId={id} />;
}