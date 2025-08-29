'use client';

import { AbrirComandaModal } from '@/components/mesas/AbrirComandaModal';
import { MesaCard } from '@/components/mesas/MesaCard';
import { getComandaAbertaPorMesa } from '@/services/comandaService';
import { getMesas } from '@/services/mesaService';
import { Mesa } from '@/types/mesa';
import { useRouter } from 'next/navigation'; // <-- Importar o useRouter
import { useEffect, useState } from 'react';

export default function MapaDeMesasPage() {
  const router = useRouter(); // <-- Iniciar o router
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);

  // Estado para feedback de navegação
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  useEffect(() => { /* ... continua igual ... */ }, []);

  const handleMesaClick = async (mesa: Mesa) => {
    if (mesa.status === 'Livre') {
      setSelectedMesa(mesa);
      setIsModalOpen(true);
    } else {
      setIsNavigating(mesa.id); // Ativa o feedback de carregamento no card
      try {
        // Busca a comanda aberta para esta mesa
        const comanda = await getComandaAbertaPorMesa(mesa.id);
        // Navega para a página de detalhes da comanda
        router.push(`/comandas/${comanda.id}`);
      } catch (err) {
        alert(`Erro ao buscar a comanda para a mesa ${mesa.numero}.`);
        setIsNavigating(null); // Desativa o feedback
      }
    }
  };

  const handleComandaAberta = (mesaId: string) => { /* ... continua igual ... */ };

  if (isLoading) { /* ... continua igual ... */ }
  if (error) { /* ... continua igual ... */ }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Mapa de Mesas</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {mesas.map((mesa) => (
          <div key={mesa.id} className="relative">
            <MesaCard mesa={mesa} onClick={handleMesaClick} />
            {isNavigating === mesa.id && (
              <div className="absolute inset-0 bg-white/70 dark:bg-black/70 flex items-center justify-center rounded-lg">
                <p>A abrir...</p>
              </div>
            )}
          </div>
        ))}
      </div>
      <AbrirComandaModal /* ... continua igual ... */ />
    </div>
  );
}