import { getPublicComandaById } from '@/services/comandaService';
import { getPaginaEventoAtiva } from '@/services/paginaEventoService';
import PortalClienteClientPage from './PortalClienteClientPage';
import { notFound } from 'next/navigation';

interface PortalClientePageProps {
  params: {
    comandaId: string;
  };
}

// Esta página busca os dados no servidor primeiro.
export default async function PortalClientePage({ params }: PortalClientePageProps) {
  const { comandaId } = params;

  // Busca os dados da comanda e da página de evento ativa em paralelo para mais performance.
  const [comanda, paginaAtiva] = await Promise.all([
    getPublicComandaById(comandaId),
    getPaginaEventoAtiva(),
  ]);

  // Se a comanda não for encontrada, exibe uma página 404.
  if (!comanda) {
    notFound();
  }

  // Passa os dados para o componente de cliente, que cuidará da interatividade.
  return <PortalClienteClientPage comanda={comanda} paginaAtiva={paginaAtiva} />;
}