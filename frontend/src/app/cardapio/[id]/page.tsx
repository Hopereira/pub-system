// Caminho: frontend/src/app/cardapio/[id]/page.tsx
import { notFound } from 'next/navigation'; // Certifique-se que o pacote next está instalado

import { getPublicComandaById } from '@/services/comandaService';
import { getProdutos } from '@/services/produtoService';
import CardapioClientPage from './CardapioClientPage';

type CardapioPageProps = {
  params: {
    id: string; // ID da Comanda
  };
};

// Tornamos a função assíncrona para buscar dados no servidor
export default async function CardapioPage({ params }: CardapioPageProps) {
  const { id } = await params;
  const comandaId = id;

  try {
    // Usamos Promise.all para buscar os dados em paralelo, otimizando o carregamento
    const [comanda, produtos] = await Promise.all([
      getPublicComandaById(comandaId),
      getProdutos()
    ]);

    // Se a comanda não for encontrada, exibimos a página 404
    if (!comanda) {
      notFound();
    }

    // Passamos os dados buscados como props para o componente de cliente
    if (!comanda) {
      return (
        <div className="p-8 text-center text-red-500">
          <h1>Erro ao carregar o cardápio</h1>
          <p>Não foi possível buscar os dados necessários. Tente novamente mais tarde.</p>
        </div>
      );
    }
    return <CardapioClientPage comanda={comanda} produtos={produtos} />;

  } catch (error) {
    // Em caso de erro na busca dos dados, podemos renderizar uma mensagem de erro
    // ou redirecionar. Por enquanto, vamos retornar uma mensagem simples.
    console.error('Falha ao carregar dados do cardápio:', error);
    return (
      <div className="p-8 text-center text-red-500">
        <h1>Erro ao carregar o cardápio</h1>
        <p>Não foi possível buscar os dados necessários. Tente novamente mais tarde.</p>
      </div>
    );
  }
}