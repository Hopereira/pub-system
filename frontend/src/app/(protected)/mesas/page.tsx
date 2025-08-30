'use client';

import { AbrirComandaModal } from '@/components/mesas/AbrirComandaModal';
import { MesaCard } from '@/components/mesas/MesaCard';
import { getComandaAbertaPorMesa } from '@/services/comandaService';
import { getMesas } from '@/services/mesaService';
import { Mesa } from '@/types/mesa';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MapaDeMesasPage() {
  const router = useRouter();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  // CORREÇÃO: A lógica para buscar as mesas estava em falta aqui.
  useEffect(() => {
    async function loadMesas() {
      try {
        setIsLoading(true);
        const data = await getMesas();
        data.sort((a, b) => a.numero - b.numero);
        setMesas(data);
        setError(null);
      } catch (err) {
        setError('Não foi possível carregar as mesas.');
      } finally {
        setIsLoading(false);
      }
    }
    loadMesas();
  }, []);

  const handleMesaClick = async (mesa: Mesa) => {
    if (mesa.status === 'Livre') {
      setSelectedMesa(mesa);
      setIsModalOpen(true);
    } else {
      setIsNavigating(mesa.id);
      try {
        const comanda = await getComandaAbertaPorMesa(mesa.id);
        router.push(`/comandas/${comanda.id}`);
      } catch (err) {
        alert(`Erro ao buscar a comanda para a mesa ${mesa.numero}.`);
        setIsNavigating(null);
      }
    }
  };

  // CORREÇÃO: A lógica para esta função estava em falta.
  const handleComandaAberta = (mesaId: string) => {
    setMesas(mesasAtuais =>
      mesasAtuais.map(m =>
        m.id === mesaId ? { ...m, status: 'Ocupada' } : m
      )
    );
    setIsModalOpen(false);
  };

  // CORREÇÃO: A lógica de renderização estava em falta.
  if (isLoading) {
    return <div className="text-center p-4">A carregar mesas...</div>;
  }

  // CORREÇÃO: A lógica de renderização estava em falta.
  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

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

      {/* CORREÇÃO: As propriedades para o modal estavam em falta. */}
      <AbrirComandaModal
        mesa={selectedMesa}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComandaAberta={handleComandaAberta}
      />
    </div>
  );
}
