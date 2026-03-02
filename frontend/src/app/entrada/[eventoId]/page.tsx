// Caminho: frontend/src/app/entrada/[eventoId]/page.tsx
import { getPublicEventoById } from '@/services/eventoService';
import EntradaClienteFormulario from './EntradaClienteFormulario'; 
import { notFound } from 'next/navigation';
import { PaginaEvento } from '@/types/pagina-evento';

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

  if (!evento) {
    notFound(); 
  }

  // ✅ FALLBACK: Se o evento não tiver tema associado, criar uma PaginaEvento virtual
  // usando os dados do próprio evento (título e imagem)
  const paginaEventoFallback: PaginaEvento | null = evento.paginaEvento ?? {
    id: '', // ID vazio indica que é um fallback virtual
    titulo: evento.titulo,
    urlImagem: evento.urlImagem || null,
    ativa: true,
    criadoEm: evento.criadoEm || new Date().toISOString(),
    atualizadoEm: evento.atualizadoEm || new Date().toISOString(),
  };
  
  // Passa o objeto evento completo (com o ID e Valor)
  return (
    <EntradaClienteFormulario 
      evento={evento} 
      paginaEvento={paginaEventoFallback}
      mesaId={mesaId}
    />
  );
}