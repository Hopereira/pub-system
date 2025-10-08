// frontend/src/app/(protected)/dashboard/admin/agenda-eventos/[id]/page.tsx

import EventoFormPage from './EventoFormPage';

interface PageProps {
  params: {
    id: string;
  };
}

// O componente de servidor agora é extremamente simples.
// Ele não faz nenhum trabalho assíncrono, evitando o crash.
export default function GerirEventoPage({ params }: PageProps) {
  // A única responsabilidade dele é obter o ID da URL...
  const { id } = params;

  // ...e passar esse ID para o componente de cliente (o formulário),
  // que fará todo o trabalho de busca de dados e renderização.
  return <EventoFormPage eventoId={id} />;
}