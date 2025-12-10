// Caminho: frontend/src/app/portal-cliente/[comandaId]/page.tsx
import { getPublicComandaById } from '@/services/comandaService';
import ClienteHubPage from './ClienteHubPage'; // Importa o componente visual
import { notFound } from 'next/navigation';

interface PortalClientePageProps {
  params: {
    comandaId: string;
  };
}

// Este é o nosso Componente de Servidor "Gerente"
export default async function PortalClientePage({ params }: PortalClientePageProps) {
  // ✅ CORREÇÃO: Acessamos o 'comandaId' da forma segura
  const { comandaId } = await params;
  
  if (!comandaId) {
    notFound();
  }

  // Buscamos a comanda completa UMA VEZ no servidor.
  // O backend já nos trará o cliente, a mesa e a paginaEvento correta.
  const comanda = await getPublicComandaById(comandaId);

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

  // Passamos a 'paginaEvento' que veio DENTRO da comanda para o componente de cliente.
  return (
    <ClienteHubPage 
      comanda={comanda} 
      paginaAtiva={comanda.paginaEvento ?? null} 
    />
  );
}