'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Comanda } from '@/types/comanda';
import { PaginaEvento } from '@/types/pagina-evento';
// CORREÇÃO: Importamos o seu componente com o nome correto
import EventosPubModal from '@/components/cliente/EventosPubModal'; 
import Image from 'next/image';

interface ClienteHubPageProps {
  comanda: Comanda;
  paginaAtiva: PaginaEvento | null;
}

export default function ClienteHubPage({ comanda, paginaAtiva }: ClienteHubPageProps) {
  const router = useRouter();
  const [isEventosModalOpen, setIsEventosModalOpen] = useState(false);

  const comandaId = comanda.id;
  const imagemFundo = paginaAtiva?.urlImagem || '/placeholder-bg.jpg';
  const tituloPagina = paginaAtiva?.titulo || `Bem-vindo!`;

  return (
    <div className="relative w-full h-screen bg-cover bg-center" style={{ backgroundImage: `url(${imagemFundo})` }}>
      <div className="absolute inset-0 bg-black bg-opacity-50" />
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white p-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center shadow-lg">{tituloPagina}</h1>
        <p className="text-lg md:text-xl mb-8">Comanda: {comandaId.substring(0, 8)}...</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          <Button size="lg" className="py-8 text-lg" onClick={() => router.push(`/cardapio/${comandaId}`)}>
            Cardápio
          </Button>
          <Button size="lg" className="py-8 text-lg" onClick={() => router.push(`/acesso-cliente/${comandaId}`)}>
            Meus Pedidos
          </Button>
          <Button size="lg" className="py-8 text-lg" onClick={() => setIsEventosModalOpen(true)}>
            Eventos do Pub
          </Button>
        </div>
      </div>
      
      {/* CORREÇÃO: Usamos o seu componente e passamos a prop 'onOpenChange' simplificada */}
      <EventosPubModal
        open={isEventosModalOpen}
        onOpenChange={setIsEventosModalOpen}
      />
    </div>
  );
}