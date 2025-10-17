// Caminho: app/(cliente)/cardapio/[comandaId]/page.tsx

import { notFound } from 'next/navigation';
import { getPublicComandaById } from '@/services/comandaService';
import { getProdutos } from '@/services/produtoService';
import CardapioClientPage from './CardapioClientPage';

// 1. O tipo agora espera 'comandaId' nos parâmetros da página.
type CardapioPageProps = { 
  params: Promise<{ comandaId: string }>;
};

// Tornamos a função assíncrona para buscar dados no servidor
export default async function CardapioPage({ params }: CardapioPageProps) {
  const { comandaId } = await params;

  try {
    // Usamos Promise.all para buscar os dados em paralelo, otimizando o carregamento
    const [comanda, produtos] = await Promise.all([
      getPublicComandaById(comandaId),
      getProdutos()
    ]);

    // Se a comanda não for encontrada, o Next.js exibirá a página 404 padrão
    if (!comanda) {
      notFound();
    }

    // Passamos os dados buscados como props para o componente de cliente
    return <CardapioClientPage comanda={comanda} produtos={produtos} />;

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