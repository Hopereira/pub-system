// Caminho: app/(cliente)/cardapio/[comandaId]/page.tsx

import { notFound } from 'next/navigation';
import { getPublicComandaById } from '@/services/comandaService';
import { ComandaGuard } from '@/components/guards/ComandaGuard';
import { ComandaStatus } from '@/types/comanda';
import CardapioClientPage from './CardapioClientPage';

// 1. O tipo agora espera 'comandaId' nos parâmetros da página.
type CardapioPageProps = { 
  params: Promise<{ comandaId: string }>;
};

// Tornamos a função assíncrona para buscar dados no servidor
export default async function CardapioPage({ params }: CardapioPageProps) {
  const { comandaId } = await params;

  try {
    // Buscar apenas a comanda no servidor
    const comanda = await getPublicComandaById(comandaId);

    // Se a comanda não for encontrada, o Next.js exibirá a página 404 padrão
    if (!comanda) {
      notFound();
    }

    // Protege acesso: apenas comandas ABERTAS podem acessar o cardápio
    // Os produtos serão buscados no Client Component onde o header X-Tenant-ID funciona
    return (
      <ComandaGuard 
        comandaId={comandaId} 
        allowedStatuses={[ComandaStatus.ABERTA]}
        redirectOnInvalid={false}
      >
        <CardapioClientPage comanda={comanda} />
      </ComandaGuard>
    );

  } catch (error) {
    // Em caso de erro na busca dos dados, renderizamos uma mensagem de erro
    console.error('Falha ao carregar dados do cardápio:', error);
    return (
      <div className="p-8 text-center text-red-500">
        <h1>Erro ao carregar o cardápio</h1>
        <p>Não foi possível buscar os dados necessários. Tente novamente mais tarde.</p>
      </div>
    );
  }
}