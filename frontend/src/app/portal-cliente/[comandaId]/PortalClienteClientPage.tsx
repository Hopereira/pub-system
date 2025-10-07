import { getPublicComandaById } from '@/services/comandaService';
import { getPublicPaginaEventoAtiva } from '@/services/paginaEventoService';
import ClienteHubPage from './ClienteHubPage';

// Este componente agora é async e corre no servidor
export default async function PortalClientePage({ params }: { params: { comandaId: string } }) {
  const { comandaId } = params;

  // Busca os dados necessários em paralelo antes de renderizar a página
  const [comanda, paginaAtiva] = await Promise.all([
    getPublicComandaById(comandaId),
    getPublicPaginaEventoAtiva(),
  ]);

  // Se a comanda não for encontrada, exibe uma mensagem de erro clara
  if (!comanda) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600">Erro</h1>
          <p className="text-gray-700 mt-2">Comanda não encontrada ou inválida.</p>
        </div>
      </div>
    );
  }

  // Passa os dados já prontos para o componente de cliente
  return <ClienteHubPage comanda={comanda} paginaAtiva={paginaAtiva} />;
}