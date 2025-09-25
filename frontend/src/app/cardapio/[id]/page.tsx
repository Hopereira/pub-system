// Caminho: frontend/src/app/cardapio/[id]/page.tsx
import { notFound } from 'next/navigation';
import { getPublicComandaById } from '@/services/comandaService';
import { getProdutos } from '@/services/produtoService';
import CardapioClientPage from './CardapioClientPage';

// O tipo das props continua o mesmo
type CardapioPageProps = {
  params: {
    id: string; // ID da Comanda
  };
};

// MUDANÇA AQUI: A função agora recebe o objeto 'props' inteiro
export default async function CardapioPage(props: CardapioPageProps) {
  // CORRIGIDO: Acessamos o 'id' a partir de 'props.params.id' de forma segura
  const comandaId = props.params.id;

  try {
    // Usamos Promise.all para buscar os dados em paralelo, otimizando o carregamento
    const [comanda, produtos] = await Promise.all([
      getPublicComandaById(comandaId),
      getProdutos(),
    ]);

    // Se a comanda não for encontrada, exibimos a página 404
    if (!comanda) {
      notFound();
    }

    // Passamos os dados buscados como props para o componente de cliente
    return <CardapioClientPage comanda={comanda} produtos={produtos} />;

  } catch (error) {
    // Em caso de erro na busca dos dados, renderizamos uma mensagem de erro clara.
    console.error('Falha ao carregar dados do cardápio:', error);
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100 p-8 text-center">
        <div className="rounded-lg bg-white p-8 shadow-md">
            <h1 className="text-2xl font-bold text-red-600">Erro ao Carregar o Cardápio</h1>
            <p className="mt-2 text-gray-600">Não foi possível buscar os dados necessários. Verifique a sua conexão ou tente novamente mais tarde.</p>
        </div>
      </div>
    );
  }
}